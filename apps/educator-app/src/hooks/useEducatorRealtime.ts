import {
  HelpPayload,
  LearnerStateUpdatePayload,
  LockedChangedPayload,
  PresencePayload,
  REALTIME_EVENTS,
  SocketIdentity,
} from '@letras/shared-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Socket } from 'socket.io-client';
import { createEducatorSocket } from '../infra/realtime/session-socket';

export function useEducatorRealtime() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [presence, setPresence] = useState<PresencePayload | null>(null);
  const [lastLearnerState, setLastLearnerState] = useState<LearnerStateUpdatePayload | null>(null);
  const [lastHelpRequest, setLastHelpRequest] = useState<string | null>(null);

  const connect = useCallback((identity: SocketIdentity) => {
    setSocket((current) => {
      current?.disconnect();
      return createEducatorSocket(identity);
    });
  }, []);

  const disconnect = useCallback(() => {
    setSocket((current) => {
      current?.disconnect();
      return null;
    });
  }, []);

  useEffect(() => {
    if (!socket) {
      return;
    }

    const onPresenceChanged = (payload: PresencePayload) => {
      setPresence(payload);
    };

    const onLearnerState = (payload: LearnerStateUpdatePayload) => {
      setLastLearnerState(payload);
    };

    const onHelpRequested = (payload: HelpPayload) => {
      setLastHelpRequest(payload.message ?? 'Aprendiz solicitou ajuda.');
    };

    const onLockedChanged = (payload: LockedChangedPayload) => {
      setIsLocked(payload.isLocked);
    };

    socket.on(REALTIME_EVENTS.PRESENCE_CHANGED, onPresenceChanged);
    socket.on(REALTIME_EVENTS.LEARNER_STATE_UPDATE, onLearnerState);
    socket.on(REALTIME_EVENTS.HELP_REQUESTED, onHelpRequested);
    socket.on(REALTIME_EVENTS.LOCKED_CHANGED, onLockedChanged);

    return () => {
      socket.off(REALTIME_EVENTS.PRESENCE_CHANGED, onPresenceChanged);
      socket.off(REALTIME_EVENTS.LEARNER_STATE_UPDATE, onLearnerState);
      socket.off(REALTIME_EVENTS.HELP_REQUESTED, onHelpRequested);
      socket.off(REALTIME_EVENTS.LOCKED_CHANGED, onLockedChanged);
    };
  }, [socket]);

  const emitLockSet = useCallback(
    (learnerProfileId: string) => {
      socket?.emit(REALTIME_EVENTS.LOCK_SET, { learnerProfileId });
    },
    [socket],
  );

  const emitLockRelease = useCallback(
    (learnerProfileId: string) => {
      socket?.emit(REALTIME_EVENTS.LOCK_RELEASE, { learnerProfileId });
    },
    [socket],
  );

  const emitHelpReceived = useCallback(
    (payload: HelpPayload) => {
      socket?.emit(REALTIME_EVENTS.HELP_RECEIVED, payload);
    },
    [socket],
  );

  return useMemo(
    () => ({
      connect,
      disconnect,
      emitLockSet,
      emitLockRelease,
      emitHelpReceived,
      isLocked,
      presence,
      lastLearnerState,
      lastHelpRequest,
    }),
    [
      connect,
      disconnect,
      emitHelpReceived,
      emitLockRelease,
      emitLockSet,
      isLocked,
      lastHelpRequest,
      lastLearnerState,
      presence,
    ],
  );
}
