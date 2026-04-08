import { Theme } from '@letras/shared-types';

export interface BootstrappedLearnerSession {
  learnerProfileId: string;
  deviceId: string;
  sessionId: string;
}

export interface AssignedLearnerTheme {
  learnerProfileId: string;
  themeId: string;
  assignedAt: string;
  theme: Theme;
}

export interface LearnerSessionRepository {
  bootstrapPersistentSession(): Promise<BootstrappedLearnerSession>;
  getAssignedThemes(learnerProfileId: string): Promise<AssignedLearnerTheme[]>;
  pushState(
    learnerProfileId: string,
    payload: { currentView?: string; currentActivityId?: string; statePayload?: Record<string, unknown> },
  ): Promise<void>;
}
