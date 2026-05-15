import { SocketIdentity } from '@letras/shared-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LearnerSessionRepositoryImpl } from '../../data/repositories/learner-session-repository.impl';
import { useLearnerRealtime } from '../../hooks/useLearnerRealtime';
import { httpClient } from '../../infra/api/http-client';

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

export function useLearnerHomeViewModel() {
  const repository = useMemo(() => new LearnerSessionRepositoryImpl(), []);
  const realtime = useLearnerRealtime();
  const { connect, disconnect, sendStateUpdate, requestHelp: emitHelp } = realtime;

  const [learnerProfileId, setLearnerProfileId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [themeNames, setThemeNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [polledIsLocked, setPolledIsLocked] = useState(false);
  const lastStateRef = useRef<SyncCurrentStateInput>({
    currentView: 'LearnerHome',
  });

  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const session = await repository.bootstrapPersistentSession();
      setLearnerProfileId(session.learnerProfileId);
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
  }, [connect, repository]);

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
    async (message = 'Preciso de apoio na atividade atual.') => {
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
      });
    },
    [deviceId, emitHelp, learnerProfileId],
  );

  const recordProgress = useCallback(
    async ({ activityId, status, score, elapsedSeconds, attempts, errorsCount, maxAttempts, lockReason }: RecordProgressInput) => {
      if (!learnerProfileId || !activityId) {
        return;
      }

      // Perfis locais (modo offline/fallback) nao tem registro no backend,
      // entao nao adianta tentar gravar progresso.
      if (learnerProfileId.startsWith('learner-local-profile-')) {
        return;
      }

      try {
        // Em producao o mobile aponta para o painel Express
        // (painel.letras.cloud/api/v1), que expoe POST /painel/progress
        // espelhando o contrato do POST /progress do backend NestJS.
        await httpClient.post('/painel/progress', {
          learnerProfileId,
          activityId,
          status,
          ...(typeof score === 'number' ? { score } : {}),
          ...(typeof elapsedSeconds === 'number' ? { elapsedSeconds } : {}),
          ...(typeof attempts === 'number' ? { attempts } : {}),
          ...(typeof errorsCount === 'number' ? { errorsCount } : {}),
          ...(typeof maxAttempts === 'number' ? { maxAttempts } : {}),
          ...(typeof lockReason === 'string' && lockReason.trim() ? { lockReason } : {}),
        });
      } catch (error) {
        // Falha de progresso nao deve quebrar a UI da aula. O proximo
        // sync ou a proxima conclusao tentam de novo; o erro fica visivel
        // no log para diagnostico.
        if (__DEV__) {
          // eslint-disable-next-line no-console
          console.warn('[learner] failed to record progress', error);
        }
      }
    },
    [learnerProfileId],
  );

  const cleanup = useCallback(() => {
    disconnect();
  }, [disconnect]);

  useEffect(() => {
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
  }, [learnerProfileId, repository]);

  return {
    loading,
    errorMessage,
    learnerProfileId,
    deviceId,
    themeNames,
    isLocked: realtime.isLocked || polledIsLocked,
    presence: realtime.presence,
    helpAcknowledgedAt: realtime.helpAcknowledgedAt,
    initialize,
    cleanup,
    syncCurrentState,
    requestHelp,
    recordProgress,
  };
}
