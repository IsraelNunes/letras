import { ParticipantRole } from './entities';

export const REALTIME_EVENTS = {
  LEARNER_STATE_UPDATE: 'learner_state_update',
  LOCKED_CHANGED: 'locked_changed',
  HELP_REQUESTED: 'help_requested',
  HELP_RECEIVED: 'help_received',
  LOCK_SET: 'lock_set',
  LOCK_RELEASE: 'lock_release',
  PRESENCE_CHANGED: 'presence_changed',
} as const;

export interface SocketIdentity {
  learnerProfileId: string;
  participantId: string;
  role: ParticipantRole;
}

export interface LearnerStateUpdatePayload {
  learnerProfileId: string;
  currentView?: string;
  currentActivityId?: string;
  state: Record<string, unknown>;
}

export interface LockPayload {
  learnerProfileId: string;
}

export interface LockedChangedPayload {
  learnerProfileId: string;
  isLocked: boolean;
}

export interface HelpPayload {
  learnerProfileId: string;
  message?: string;
}

export interface PresencePayload {
  learnerProfileId: string;
  learnersOnline: string[];
  educatorsOnline: string[];
}
