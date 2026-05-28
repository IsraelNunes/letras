import { HelpPayload, REALTIME_EVENTS } from '@letras/shared-types';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createEducatorHomeSocket } from '../../infra/realtime/session-socket';

export interface HelpAlert {
  learnerId: string;
  displayName: string;
  phoneDigits: string | null;
  message?: string;
  timestamp: string;
}

interface LearnerLookup {
  displayName: string;
  phoneDigits: string | null;
}

interface UseEducatorHomeRealtimeParams {
  educatorId: string | undefined;
  getLearnerInfo: (learnerId: string) => LearnerLookup | undefined;
  onLockEvent: () => void;
}

export function useEducatorHomeRealtime({
  educatorId,
  getLearnerInfo,
  onLockEvent,
}: UseEducatorHomeRealtimeParams) {
  const [helpAlerts, setHelpAlerts] = useState<HelpAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Refs estáveis para callbacks — evitam reconexão ao socket quando as
  // funções são recriadas pelo React entre re-renders
  const getLearnerInfoRef = useRef(getLearnerInfo);
  const onLockEventRef = useRef(onLockEvent);
  useLayoutEffect(() => {
    getLearnerInfoRef.current = getLearnerInfo;
    onLockEventRef.current = onLockEvent;
  });

  useEffect(() => {
    if (!educatorId) return;

    const socket = createEducatorHomeSocket(educatorId, `educator-home-${educatorId}`);

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on(REALTIME_EVENTS.LOCK_SET, () => {
      onLockEventRef.current();
    });

    socket.on(REALTIME_EVENTS.LOCK_RELEASE, () => {
      onLockEventRef.current();
    });

    socket.on(REALTIME_EVENTS.HELP_REQUESTED, (payload: HelpPayload & { timestamp: string }) => {
      const info = getLearnerInfoRef.current(payload.learnerProfileId);
      setHelpAlerts((prev) => {
        // Substitui alerta anterior do mesmo aprendiz (mantém o mais recente)
        const filtered = prev.filter((a) => a.learnerId !== payload.learnerProfileId);
        return [
          ...filtered,
          {
            learnerId: payload.learnerProfileId,
            displayName: info?.displayName ?? payload.learnerProfileId,
            phoneDigits: info?.phoneDigits ?? null,
            message: payload.message,
            timestamp: payload.timestamp ?? new Date().toISOString(),
          },
        ];
      });
    });

    return () => {
      socket.disconnect();
      setIsConnected(false);
    };
  }, [educatorId]);

  const clearHelpAlert = (learnerId: string) => {
    setHelpAlerts((prev) => prev.filter((a) => a.learnerId !== learnerId));
  };

  return { helpAlerts, clearHelpAlert, isConnected };
}
