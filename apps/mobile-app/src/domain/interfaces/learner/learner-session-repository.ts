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

export interface LearnerSessionStateSnapshot {
  id: string;
  learnerProfileId: string;
  deviceId?: string;
  sessionState?: {
    id: string;
    currentView: string;
    currentActivityId?: string | null;
    statePayload?: Record<string, unknown> | null;
    isLocked: boolean;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export interface LearnerSessionRepository {
  bootstrapPersistentSession(): Promise<BootstrappedLearnerSession>;
  getAssignedThemes(learnerProfileId: string): Promise<AssignedLearnerTheme[]>;
  getSessionState(learnerProfileId: string): Promise<LearnerSessionStateSnapshot | null>;
  pushState(
    learnerProfileId: string,
    payload: { currentView?: string; currentActivityId?: string; statePayload?: Record<string, unknown> },
  ): Promise<void>;
}
