import { LearnerScreenSnapshot, SocketIdentity } from '@letras/shared-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LearnerSessionRepositoryImpl } from '../../data/repositories/learner-session-repository.impl';
import { useLearnerRealtime } from '../../hooks/useLearnerRealtime';
import { httpClient } from '../../infra/api/http-client';
import { SessionStorage } from '../../infra/storage/session-storage';
import type { LessonCompletionResult } from '../../views/learner/learnerAccessPolicy.js';

const LOCAL_PROFILE_PREFIX = 'learner-local-profile';

interface SyncCurrentStateInput {
  currentView?: string;
  currentActivityId?: string;
  statePayload?: Record<string, unknown>;
}

type ProgressStatus = 'IN_PROGRESS' | 'COMPLETED';
type ExtendedProgressStatus = ProgressStatus | 'LOCKED';

interface RecordProgressInput {
  activityId: string;
  status: ExtendedProgressStatus;
  score?: number;
  elapsedSeconds?: number;
  attempts?: number;
  errorsCount?: number;
  maxAttempts?: number;
  lockReason?: string;
}

const UUID_PREFIX_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
const CUID_PATTERN = /^c[a-z0-9]{10,}/i;

function resolveCanonicalActivityId(activityId: string): string | null {
  const normalized = activityId.trim();
  if (!normalized) return null;
  const uuidMatch = normalized.match(UUID_PREFIX_PATTERN);
  if (uuidMatch) return uuidMatch[0];
  // Aceita cuid (formato do Prisma local): c + alfanumérico, min 10 chars
  if (CUID_PATTERN.test(normalized)) return normalized;
  return null;
}

interface LearnerHomeViewModelOptions {
  // Quando presente, o view-model opera "por cima" do perfil de um alfabetizando
  // específico (runner da Etapa 1 no modo educador): pula bootstrap de sessão,
  // realtime e lock-polling; recordProgress posta com este UUID. O guard de
  // perfil local (learner-local-profile-*) segue valendo.
  overrideLearnerProfileId?: string;
  // Nome do alfabetizando no modo override (o bootstrap que buscaria o nome é
  // pulado; sem isto o cabeçalho das aulas do runner mostraria "—").
  overrideLearnerName?: string;
  // Tema do alfabetizando no modo override: escopa o stage-status/firstStage do
  // runner ao tema atribuído (sem isto, cairia no primeiro tema publicado).
  overrideThemeId?: string;
}

export function useLearnerHomeViewModel(options: LearnerHomeViewModelOptions = {}) {
  const { overrideLearnerProfileId, overrideLearnerName, overrideThemeId } = options;
  const repository = useMemo(() => new LearnerSessionRepositoryImpl(), []);
  const realtime = useLearnerRealtime();
  const { connect, disconnect, sendStateUpdate, requestHelp: emitHelp } = realtime;

  const [learnerProfileId, setLearnerProfileId] = useState<string | null>(overrideLearnerProfileId ?? null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [themeNames, setThemeNames] = useState<string[]>([]);
  const [learnerName, setLearnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [polledIsLocked, setPolledIsLocked] = useState(false);
  const [helpRequestedAt, setHelpRequestedAt] = useState<string | null>(null);
  const lastStateRef = useRef<SyncCurrentStateInput>({
    currentView: 'LearnerHome',
  });

  const initialize = useCallback(async () => {
    // Modo override (runner da Etapa 1 no educador): o perfil já vem por prop.
    // Não fazemos bootstrap de sessão, realtime nem busca de temas — o educador
    // apenas conduz as aulas e grava progresso sob o id do alfabetizando.
    if (overrideLearnerProfileId) {
      setLearnerProfileId(overrideLearnerProfileId);
      if (overrideLearnerName) setLearnerName(overrideLearnerName);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // Só inicializa se já existe um perfil vinculado no storage.
      // Sem esse guarda, bootstrapPersistentSession() criaria um perfil
      // automático no servidor, bypassando o fluxo de vínculo CPF/telefone.
      const storedId = await SessionStorage.getLearnerProfileId();
      if (!storedId || storedId.startsWith(`${LOCAL_PROFILE_PREFIX}-`)) {
        setLoading(false);
        return;
      }

      const session = await repository.bootstrapPersistentSession();
      setLearnerProfileId(session.learnerProfileId);
      httpClient.setLearnerIdentity(session.learnerProfileId);
      setDeviceId(session.deviceId);

      const identity: SocketIdentity = {
        learnerProfileId: session.learnerProfileId,
        participantId: session.deviceId,
        role: 'learner',
      };

      const isLocalFallbackProfile = session.learnerProfileId.startsWith('learner-local-profile-');
      const shouldConnectRealtime = !isLocalFallbackProfile;
      if (shouldConnectRealtime) {
        connect(identity);
      }

      const themes = await repository.getAssignedThemes(session.learnerProfileId);
      setThemeNames(themes.map((item) => item.theme.name));

      if (!isLocalFallbackProfile) {
        try {
          const profile = await httpClient.get<{ displayName?: string }>(
            `/cadastros/alfabetizandos/${session.learnerProfileId}`,
          );
          if (profile.displayName) setLearnerName(profile.displayName);
        } catch {
          // não crítico — cabeçalho funciona sem o nome
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido ao inicializar sessao';
      const normalized = message.toLowerCase();
      const isProvisioningWarning =
        normalized.includes('learner profile is not provisioned') ||
        normalized.includes('profile is not provisioned');
      setErrorMessage(isProvisioningWarning ? null : message);
    } finally {
      setLoading(false);
    }
  }, [connect, repository, overrideLearnerProfileId, overrideLearnerName]);

  const syncCurrentState = useCallback(
    async ({
      currentView = 'LearnerHome',
      currentActivityId,
      statePayload,
    }: SyncCurrentStateInput = {}) => {
      if (!learnerProfileId) {
        return;
      }

      const payload = {
        learnerProfileId,
        currentView,
        currentActivityId,
        state: {
          timestamp: new Date().toISOString(),
          ...(statePayload ?? {}),
        },
      };

      lastStateRef.current = {
        currentView: payload.currentView,
        currentActivityId: payload.currentActivityId,
        statePayload: payload.state,
      };

      sendStateUpdate(payload);

      await repository.pushState(learnerProfileId, {
        currentView: payload.currentView,
        currentActivityId: payload.currentActivityId,
        statePayload: payload.state,
      });
    },
    [learnerProfileId, repository, sendStateUpdate],
  );

  const requestHelp = useCallback(
    async (
      message = 'Preciso de apoio na atividade atual.',
      snapshot?: LearnerScreenSnapshot,
    ) => {
      if (!learnerProfileId) {
        return;
      }

      const currentState = lastStateRef.current;
      try {
        await httpClient.post('/painel/support-requests', {
          learnerProfileId,
          currentView: currentState.currentView,
          currentActivityId: currentState.currentActivityId,
          activityId: currentState.currentActivityId,
          message,
          sourcePlatform: 'mobile',
          metadata: {
            deviceId,
            statePayload: currentState.statePayload ?? {},
            snapshot: snapshot ?? null,
          },
        });
      } catch (error) {
        const normalizedMessage =
          error instanceof Error ? error.message : 'Nao foi possivel enviar o pedido de ajuda.';
        setErrorMessage(normalizedMessage);
      }

      emitHelp({
        learnerProfileId,
        message,
        snapshot,
      });

      // Marca o pedido como pendente no app do aluno; o botao PEDIR AJUDA
      // vira "AGUARDANDO AJUDA" ate o alfabetizador destravar (chega via
      // help_received do realtime, que atualiza helpAcknowledgedAt).
      setHelpRequestedAt(new Date().toISOString());
    },
    [deviceId, emitHelp, learnerProfileId],
  );

  const recordProgress = useCallback(
    async ({ activityId, status, score, elapsedSeconds, attempts, errorsCount, maxAttempts, lockReason }: RecordProgressInput): Promise<LessonCompletionResult | null> => {
      if (!learnerProfileId || !activityId) {
        return null;
      }

      // Perfis locais (modo offline/fallback) nao tem registro no backend,
      // entao nao adianta tentar gravar progresso.
      if (learnerProfileId.startsWith('learner-local-profile-')) {
        return null;
      }

      try {
        // Em producao o mobile aponta para o painel Express
        // (painel.letras.cloud/api/v1), que expoe POST /painel/progress
        // espelhando o contrato do POST /progress do backend NestJS.
        const canonicalActivityId = resolveCanonicalActivityId(activityId);
        if (!canonicalActivityId) {
          return null;
        }

        if (status === 'COMPLETED') {
          const idempotencyKey = `lesson:${learnerProfileId}:${canonicalActivityId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
          return await httpClient.post<LessonCompletionResult>(
            `/learner-activities/${canonicalActivityId}/complete`,
            {
              studentId: learnerProfileId,
              idempotencyKey,
              score,
              elapsedSeconds,
              metadata: { attempts: attempts ?? 1 },
              sourcePlatform: 'mobile',
            },
          );
        }

        // O backend só aceita IN_PROGRESS e COMPLETED — LOCKED é estado local
        const backendStatus = status === 'LOCKED' ? 'IN_PROGRESS' : status;
        await httpClient.post('/painel/progress', {
          learnerProfileId,
          activityId: canonicalActivityId,
          status: backendStatus,
          ...(typeof score === 'number' ? { score } : {}),
          ...(typeof elapsedSeconds === 'number' ? { elapsedSeconds } : {}),
          ...(typeof attempts === 'number' ? { attempts } : {}),
          ...(typeof errorsCount === 'number' ? { errorsCount } : {}),
          ...(typeof maxAttempts === 'number' ? { maxAttempts } : {}),
          ...(typeof lockReason === 'string' && lockReason.trim() ? { lockReason } : {}),
        });
        return null;
      } catch (error) {
        // Falha de progresso nao deve quebrar a UI da aula. O proximo
        // sync ou a proxima conclusao tentam de novo; o erro fica visivel
        // no log para diagnostico.
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[learner] failed to record progress', error);
        }
        return null;
      }
    },
    [learnerProfileId],
  );

  const setSessionLocked = useCallback(
    async (isLocked: boolean) => {
      if (!learnerProfileId) return;
      await repository.setLocked(learnerProfileId, isLocked);
    },
    [learnerProfileId, repository],
  );

  const cleanup = useCallback(() => {
    disconnect();
    httpClient.setLearnerIdentity(null);
  }, [disconnect]);

  useEffect(() => {
    // Runner do educador não tem lock de sessão do aluno para vigiar.
    if (overrideLearnerProfileId) {
      setPolledIsLocked(false);
      return;
    }
    if (!learnerProfileId || learnerProfileId.startsWith('learner-local-profile-')) {
      setPolledIsLocked(false);
      return;
    }

    let active = true;
    const pollLockState = async () => {
      const snapshot = await repository.getSessionState(learnerProfileId);
      if (!active) {
        return;
      }
      setPolledIsLocked(Boolean(snapshot?.sessionState?.isLocked));
    };

    void pollLockState();
    const timer = setInterval(pollLockState, 10000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [learnerProfileId, repository, overrideLearnerProfileId]);

  useEffect(() => {
    // O snapshot HTTP e a fonte canonica do lock. O realtime so antecipa a
    // mudanca de UI; se o evento de unlock se perder, o proximo poll precisa
    // conseguir destravar a sessao em vez de ficar preso no ultimo `true`.
    if (realtime.isLocked) setPolledIsLocked(true);
  }, [realtime.isLocked]);

  return {
    loading,
    errorMessage,
    learnerProfileId,
    themeId: overrideThemeId ?? null,
    learnerName,
    deviceId,
    themeNames,
    isLocked: polledIsLocked,
    presence: realtime.presence,
    helpAcknowledgedAt: realtime.helpAcknowledgedAt,
    helpRequestedAt,
    // Ajuda pendente = pediu ajuda e ainda nao recebeu o ack (help_received).
    // Quando o educator destrava, helpAcknowledgedAt > helpRequestedAt e a
    // UI volta ao estado normal do botao "PEDIR AJUDA".
    isHelpPending: Boolean(
      helpRequestedAt &&
        (!realtime.helpAcknowledgedAt || realtime.helpAcknowledgedAt < helpRequestedAt),
    ),
    initialize,
    cleanup,
    syncCurrentState,
    requestHelp,
    recordProgress,
    setSessionLocked,
  };
}
