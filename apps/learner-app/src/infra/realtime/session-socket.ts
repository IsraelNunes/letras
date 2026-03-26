import { API_BASE_URL } from '@letras/shared-utils';
import { SocketIdentity } from '@letras/shared-types';
import { io, Socket } from 'socket.io-client';

function resolveRealtimeBaseUrl(): string {
  return API_BASE_URL.replace(/\/$/, '');
}

export function createLearnerSocket(identity: SocketIdentity): Socket {
  return io(`${resolveRealtimeBaseUrl()}/realtime`, {
    transports: ['websocket'],
    query: {
      learnerProfileId: identity.learnerProfileId,
      participantId: identity.participantId,
      role: identity.role,
    },
  });
}
