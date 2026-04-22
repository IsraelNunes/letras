import { CreateLearnerProfileRequest, CreateLearnerSessionRequest, LearnerProfile, LearnerSession } from '@letras/shared-types';
import { createLocalId } from '@letras/shared-utils';
import {
  AssignedLearnerTheme,
  BootstrappedLearnerSession,
  LearnerSessionRepository,
} from '../../../domain/interfaces/learner/learner-session-repository';
import { httpClient } from '../../../infra/api/http-client';
import { SessionStorage } from '../../../infra/storage/session-storage';

const LOCAL_PROFILE_PREFIX = 'learner-local-profile';
const LOCAL_SESSION_PREFIX = 'learner-local-session';

export class LearnerSessionRepositoryImpl implements LearnerSessionRepository {
  async bootstrapPersistentSession(): Promise<BootstrappedLearnerSession> {
    const deviceId = await SessionStorage.getOrCreateLearnerDeviceId();

    let learnerProfileId = await SessionStorage.getLearnerProfileId();
    if (!learnerProfileId) {
      learnerProfileId = await this.provisionLearnerProfile(deviceId);
    }

    if (this.isLocalFallbackProfile(learnerProfileId)) {
      return {
        learnerProfileId,
        deviceId,
        sessionId: createLocalId(LOCAL_SESSION_PREFIX),
      };
    }

    try {
      const session = await this.createOrRefreshSession({
        learnerProfileId,
        deviceId,
        role: 'learner',
      });

      return {
        learnerProfileId,
        deviceId,
        sessionId: session.id,
      };
    } catch {
      const localProfileId = await this.createLocalFallbackProfile(deviceId);
      return {
        learnerProfileId: localProfileId,
        deviceId,
        sessionId: createLocalId(LOCAL_SESSION_PREFIX),
      };
    }
  }

  async getAssignedThemes(learnerProfileId: string): Promise<AssignedLearnerTheme[]> {
    if (this.isLocalFallbackProfile(learnerProfileId)) {
      return [];
    }
    try {
      return await httpClient.get<AssignedLearnerTheme[]>(`/learners/${learnerProfileId}/themes`);
    } catch {
      return [];
    }
  }

  async pushState(
    learnerProfileId: string,
    payload: { currentView?: string; currentActivityId?: string; statePayload?: Record<string, unknown> },
  ): Promise<void> {
    if (this.isLocalFallbackProfile(learnerProfileId)) {
      return;
    }
    try {
      await httpClient.patch(`/sessions/${learnerProfileId}/state`, payload);
    } catch {
      // Mantem o fluxo local quando o backend de sessao nao estiver pronto.
    }
  }

  private createOrRefreshSession(body: CreateLearnerSessionRequest) {
    return httpClient.post<LearnerSession>('/sessions', body);
  }

  private async createAndPersistLearnerProfile(deviceId: string): Promise<string> {
    const friendlySuffix = deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'WEB';
    const body: CreateLearnerProfileRequest = {
      displayName: `Alfabetizando ${friendlySuffix}`,
      notes: 'Provisionado automaticamente no primeiro acesso ao fluxo mobile.',
    };

    const profile = await httpClient.post<LearnerProfile>('/learners', body);
    await SessionStorage.setLearnerProfileId(profile.id);
    return profile.id;
  }

  private async provisionLearnerProfile(deviceId: string): Promise<string> {
    if (this.shouldUseLocalProvisioningOnly()) {
      return this.createLocalFallbackProfile(deviceId);
    }
    try {
      return await this.createAndPersistLearnerProfile(deviceId);
    } catch {
      return this.createLocalFallbackProfile(deviceId);
    }
  }

  private isLocalFallbackProfile(learnerProfileId: string): boolean {
    return learnerProfileId.startsWith(`${LOCAL_PROFILE_PREFIX}-`);
  }

  private async createLocalFallbackProfile(deviceId: string): Promise<string> {
    const suffix = deviceId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase() || 'WEB';
    const localProfileId = createLocalId(`${LOCAL_PROFILE_PREFIX}-${suffix}`);
    await SessionStorage.setLearnerProfileId(localProfileId);
    return localProfileId;
  }

  private shouldUseLocalProvisioningOnly(): boolean {
    const runtime = globalThis as { window?: { location?: { hostname?: string } } };
    const hostname = String(runtime.window?.location?.hostname || '').toLowerCase();
    return hostname === 'mobile.letras.cloud' || hostname === 'app.letras.cloud';
  }
}
