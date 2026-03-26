import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionService } from '../../modules/session/session.service';
import { HelpEventDto } from '../dto/help-event.dto';
import { LearnerStateUpdateDto } from '../dto/learner-state-update.dto';
import { RoomEventDto } from '../dto/room-event.dto';
import { PresenceRole, PresenceService } from '../presence/presence.service';

@WebSocketGateway({
  namespace: '/realtime',
  cors: {
    origin: '*',
  },
})
export class SessionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly sessionService: SessionService,
    private readonly presenceService: PresenceService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    const identity = this.resolveIdentity(client);

    if (!identity) {
      client.disconnect(true);
      return;
    }

    client.join(identity.learnerProfileId);

    this.presenceService.registerParticipant({
      socketId: client.id,
      participantId: identity.participantId,
      role: identity.role,
      learnerProfileId: identity.learnerProfileId,
    });

    this.server.to(identity.learnerProfileId).emit('presence_changed', this.presenceService.getRoomPresence(identity.learnerProfileId));
  }

  handleDisconnect(client: Socket): void {
    const disconnected = this.presenceService.unregisterParticipant(client.id);

    if (!disconnected) {
      return;
    }

    this.server
      .to(disconnected.learnerProfileId)
      .emit('presence_changed', this.presenceService.getRoomPresence(disconnected.learnerProfileId));
  }

  @SubscribeMessage('learner_state_update')
  async handleLearnerStateUpdate(@ConnectedSocket() client: Socket, @MessageBody() payload: LearnerStateUpdateDto) {
    await this.sessionService.updateState(payload.learnerProfileId, {
      currentView: payload.currentView,
      currentActivityId: payload.currentActivityId,
      statePayload: payload.state,
    });

    this.server.to(payload.learnerProfileId).emit('learner_state_update', {
      ...payload,
      sentBy: client.id,
      timestamp: new Date().toISOString(),
    });

    return { ok: true };
  }

  @SubscribeMessage('lock_set')
  async handleLockSet(@ConnectedSocket() client: Socket, @MessageBody() payload: RoomEventDto) {
    await this.sessionService.setLockState(payload.learnerProfileId, true);

    this.server.to(payload.learnerProfileId).emit('lock_set', {
      learnerProfileId: payload.learnerProfileId,
      sentBy: client.id,
      timestamp: new Date().toISOString(),
    });

    this.server.to(payload.learnerProfileId).emit('locked_changed', {
      learnerProfileId: payload.learnerProfileId,
      isLocked: true,
      sentBy: client.id,
      timestamp: new Date().toISOString(),
    });

    return { ok: true };
  }

  @SubscribeMessage('lock_release')
  async handleLockRelease(@ConnectedSocket() client: Socket, @MessageBody() payload: RoomEventDto) {
    await this.sessionService.setLockState(payload.learnerProfileId, false);

    this.server.to(payload.learnerProfileId).emit('lock_release', {
      learnerProfileId: payload.learnerProfileId,
      sentBy: client.id,
      timestamp: new Date().toISOString(),
    });

    this.server.to(payload.learnerProfileId).emit('locked_changed', {
      learnerProfileId: payload.learnerProfileId,
      isLocked: false,
      sentBy: client.id,
      timestamp: new Date().toISOString(),
    });

    return { ok: true };
  }

  @SubscribeMessage('help_requested')
  handleHelpRequested(@ConnectedSocket() client: Socket, @MessageBody() payload: HelpEventDto) {
    this.server.to(payload.learnerProfileId).emit('help_requested', {
      learnerProfileId: payload.learnerProfileId,
      message: payload.message,
      sentBy: client.id,
      timestamp: new Date().toISOString(),
    });

    return { ok: true };
  }

  @SubscribeMessage('help_received')
  handleHelpReceived(@ConnectedSocket() client: Socket, @MessageBody() payload: HelpEventDto) {
    this.server.to(payload.learnerProfileId).emit('help_received', {
      learnerProfileId: payload.learnerProfileId,
      message: payload.message,
      sentBy: client.id,
      timestamp: new Date().toISOString(),
    });

    return { ok: true };
  }

  private resolveIdentity(client: Socket): { learnerProfileId: string; role: PresenceRole; participantId: string } | null {
    const learnerProfileId = this.getQueryValue(client, 'learnerProfileId');
    const role = this.getQueryValue(client, 'role');
    const participantId = this.getQueryValue(client, 'participantId') ?? client.id;

    if (!learnerProfileId || !role) {
      return null;
    }

    if (role !== 'learner' && role !== 'educator') {
      return null;
    }

    return {
      learnerProfileId,
      role,
      participantId,
    };
  }

  private getQueryValue(client: Socket, key: string): string | null {
    const value = client.handshake.query[key];

    if (Array.isArray(value)) {
      return typeof value[0] === 'string' ? value[0] : null;
    }

    return typeof value === 'string' ? value : null;
  }
}
