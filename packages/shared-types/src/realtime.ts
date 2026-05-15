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

export type LearnerScreenStage = '1' | '2' | '3';

export interface LearnerScreenSnapshot {
  // Identificacao da tela em que o alfabetizando estava ao pedir ajuda.
  // Tudo opcional para permitir snapshots parciais quando, por exemplo,
  // o pedido sai da Home (ainda sem moduleId) ou da tela de conclusao.
  moduleId?: string;
  lessonId?: string;
  moduleLabel?: string;
  moduleTitle?: string;
  lessonTitle?: string;
  screenIndex?: number;
  totalScreens?: number;
  stage?: LearnerScreenStage;
  screenId?: string;
  screenTitle?: string;
  screenTemplate?: string;
  // Conteudo da tela para que o alfabetizador veja o mesmo que o aluno.
  mediaUrl?: string | null;
  mediaKind?: 'video' | 'audio' | 'image' | null;
  learnerSpeech?: string | null;
  highlightMessage?: string | null;
  // Exercicio serializado (items, alternativas, etc.). Mantido como
  // unknown porque o LearnerExerciseConfig vive no mobile-app, mas o
  // shape e estavel o suficiente para o painel/educator renderizarem.
  exercise?: unknown;
}

export interface HelpPayload {
  learnerProfileId: string;
  message?: string;
  snapshot?: LearnerScreenSnapshot;
}

export interface PresencePayload {
  learnerProfileId: string;
  learnersOnline: string[];
  educatorsOnline: string[];
}
