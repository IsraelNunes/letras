import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SessionRole } from '@prisma/client';
import { Server } from 'socket.io';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLearnerSessionDto, SessionParticipantRole } from './dto/create-learner-session.dto';
import { UpdateSessionStateDto } from './dto/update-session-state.dto';

@Injectable()
export class SessionService {
  private _socketServer: Server | null = null;

  constructor(private readonly prisma: PrismaService) {}

  setSocketServer(server: Server) {
    this._socketServer = server;
  }

  async createSession(dto: CreateLearnerSessionDto) {
    const normalizedRole = this.toSessionRole(dto.role);

    const session = await this.prisma.learnerSession.upsert({
      where: {
        learnerProfileId: dto.learnerProfileId,
      },
      create: {
        learnerProfileId: dto.learnerProfileId,
        deviceId: dto.deviceId,
        role: normalizedRole,
        connectedAt: new Date(),
        sessionState: {
          create: {
            currentView: 'home',
            statePayload: {},
            isLocked: false,
          },
        },
      },
      update: {
        deviceId: dto.deviceId,
        role: normalizedRole,
        connectedAt: new Date(),
      },
      include: {
        sessionState: true,
      },
    });

    if (!session.sessionState) {
      await this.prisma.sessionState.create({
        data: {
          sessionId: session.id,
          currentView: 'home',
          statePayload: {},
          isLocked: false,
        },
      });
    }

    return this.getSessionByLearnerProfile(dto.learnerProfileId);
  }

  getSessionByLearnerProfile(learnerProfileId: string) {
    return this.prisma.learnerSession.findUnique({
      where: {
        learnerProfileId,
      },
      select: {
        id: true,
        learnerProfileId: true,
        deviceId: true,
        role: true,
        connectedAt: true,
        createdAt: true,
        updatedAt: true,
        sessionState: {
          select: {
            id: true,
            sessionId: true,
            currentView: true,
            currentActivityId: true,
            statePayload: true,
            isLocked: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async updateState(learnerProfileId: string, dto: UpdateSessionStateDto) {
    const session = await this.prisma.learnerSession.findUnique({
      where: { learnerProfileId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Sessao do learnerProfile ${learnerProfileId} nao encontrada.`);
    }

    const statePayload = dto.statePayload as Prisma.InputJsonValue | undefined;

    return this.prisma.sessionState.upsert({
      where: {
        sessionId: session.id,
      },
      create: {
        sessionId: session.id,
        currentView: dto.currentView ?? 'home',
        currentActivityId: dto.currentActivityId,
        statePayload: statePayload ?? {},
        isLocked: false,
      },
      update: {
        ...(dto.currentView !== undefined ? { currentView: dto.currentView } : {}),
        ...(dto.currentActivityId !== undefined ? { currentActivityId: dto.currentActivityId } : {}),
        ...(statePayload !== undefined ? { statePayload } : {}),
      },
    });
  }

  async setLockState(learnerProfileId: string, isLocked: boolean) {
    const session = await this.prisma.learnerSession.findUnique({
      where: { learnerProfileId },
      select: { id: true },
    });

    if (!session) {
      throw new NotFoundException(`Sessao do learnerProfile ${learnerProfileId} nao encontrada.`);
    }

    const result = await this.prisma.sessionState.upsert({
      where: { sessionId: session.id },
      create: { sessionId: session.id, currentView: 'home', statePayload: {}, isLocked },
      update: { isLocked },
    });

    if (this._socketServer) {
      const educatorId = await this.getEducatorIdForLearner(learnerProfileId);
      const event = { learnerProfileId, sentBy: 'server', timestamp: new Date().toISOString() };
      const lockEvent = isLocked ? 'lock_set' : 'lock_release';

      this._socketServer.to(learnerProfileId).emit(lockEvent, event);
      this._socketServer.to(learnerProfileId).emit('locked_changed', { ...event, isLocked });

      if (educatorId) {
        this._socketServer.to(`educator-${educatorId}`).emit(lockEvent, event);
      }
    }

    return result;
  }

  async getEducatorIdForLearner(learnerProfileId: string): Promise<string | null> {
    const profile = await this.prisma.learnerProfile.findUnique({
      where: { id: learnerProfileId },
      select: { educatorId: true },
    });
    return profile?.educatorId ?? null;
  }

  private toSessionRole(role?: SessionParticipantRole): SessionRole {
    return role === SessionParticipantRole.EDUCATOR ? SessionRole.EDUCATOR : SessionRole.LEARNER;
  }
}
