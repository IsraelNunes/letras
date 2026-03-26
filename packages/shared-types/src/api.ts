import { CompletionStatus, ParticipantRole } from './entities';

export interface CreateLearnerProfileRequest {
  displayName: string;
  notes?: string;
  educatorId?: string;
}

export interface AssignThemeRequest {
  themeId: string;
}

export interface CreateThemeRequest {
  name: string;
  description?: string;
}

export interface CreateLearnerSessionRequest {
  learnerProfileId: string;
  deviceId: string;
  role?: ParticipantRole;
}

export interface UpdateSessionStateRequest {
  currentView?: string;
  currentActivityId?: string;
  statePayload?: Record<string, unknown>;
}

export interface SetLockRequest {
  isLocked: boolean;
}

export interface TrackProgressRequest {
  learnerProfileId: string;
  activityId: string;
  status: CompletionStatus;
  score?: number;
  elapsedSeconds?: number;
}

export interface ReferenceUf {
  id: number;
  code: string;
  name: string;
}

export interface ReferenceCity {
  id: number;
  uf: string;
  name: string;
}
