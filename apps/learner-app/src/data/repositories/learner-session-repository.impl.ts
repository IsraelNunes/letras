import {
  CreateLearnerSessionRequest,
  LearnerSession,
} from '@letras/shared-types';
import {
  AssignedLearnerTheme,
  BootstrappedLearnerSession,
  LearnerSessionRepository,
} from '../../domain/interfaces/learner-session-repository';
import { httpClient } from '../../infra/api/http-client';
import { SessionStorage } from '../../infra/storage/session-storage';

export class LearnerSessionRepositoryImpl implements LearnerSessionRepository {
  async bootstrapPersistentSession(): Promise<BootstrappedLearnerSession> {
    const deviceId = await SessionStorage.getOrCreateLearnerDeviceId();

    let learnerProfileId = await SessionStorage.getLearnerProfileId();

    if (!learnerProfileId) {
      throw new Error('Learner profile is not provisioned on this device. Ask an educator to provision it first.');
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
}
