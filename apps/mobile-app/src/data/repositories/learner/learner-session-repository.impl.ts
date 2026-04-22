import { CreateLearnerProfileRequest, CreateLearnerSessionRequest, LearnerProfile, LearnerSession } from '@letras/shared-types';
import {
  AssignedLearnerTheme,
  BootstrappedLearnerSession,
  LearnerSessionRepository,
} from '../../../domain/interfaces/learner/learner-session-repository';
import { httpClient } from '../../../infra/api/http-client';
import { SessionStorage } from '../../../infra/storage/session-storage';

export class LearnerSessionRepositoryImpl implements LearnerSessionRepository {
  async bootstrapPersistentSession(): Promise<BootstrappedLearnerSession> {
    const deviceId = await SessionStorage.getOrCreateLearnerDeviceId();

    let learnerProfileId = await SessionStorage.getLearnerProfileId();
    if (!learnerProfileId) {
      learnerProfileId = await this.createAndPersistLearnerProfile(deviceId);
    }

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
  }

  getAssignedThemes(learnerProfileId: string): Promise<AssignedLearnerTheme[]> {
    return httpClient.get<AssignedLearnerTheme[]>(`/learners/${learnerProfileId}/themes`);
  }

  async pushState(
    learnerProfileId: string,
    payload: { currentView?: string; currentActivityId?: string; statePayload?: Record<string, unknown> },
  ): Promise<void> {
    await httpClient.patch(`/sessions/${learnerProfileId}/state`, payload);
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
}
