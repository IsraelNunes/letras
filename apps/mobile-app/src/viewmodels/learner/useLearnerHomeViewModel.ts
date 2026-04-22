import { SocketIdentity } from '@letras/shared-types';
import { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { LearnerSessionRepositoryImpl } from '../../data/repositories/learner-session-repository.impl';
import { useLearnerRealtime } from '../../hooks/useLearnerRealtime';

interface SyncCurrentStateInput {
  currentView?: string;
  currentActivityId?: string;
  statePayload?: Record<string, unknown>;
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
      const shouldConnectRealtime = Platform.OS !== 'web' && !isLocalFallbackProfile;
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
    (message = 'Preciso de apoio na atividade atual.') => {
      if (!learnerProfileId) {
        return;
      }

      emitHelp({
        learnerProfileId,
        message,
      });
    },
    [emitHelp, learnerProfileId],
  );

  const cleanup = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    loading,
    errorMessage,
    learnerProfileId,
    deviceId,
    themeNames,
    isLocked: realtime.isLocked,
    presence: realtime.presence,
    helpAcknowledgedAt: realtime.helpAcknowledgedAt,
    initialize,
    cleanup,
    syncCurrentState,
    requestHelp,
  };
}
