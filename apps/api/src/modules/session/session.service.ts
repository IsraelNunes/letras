import { Injectable } from '@nestjs/common';
import { Prisma, SessionRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLearnerSessionDto, SessionParticipantRole } from './dto/create-learner-session.dto';
import { UpdateSessionStateDto } from './dto/update-session-state.dto';

@Injectable()
export class SessionService {
  constructor(private readonly prisma: PrismaService) {}

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
      include: {
        learnerProfile: true,
        sessionState: true,
      },
    });
  }

  async updateState(learnerProfileId: string, dto: UpdateSessionStateDto) {
    const session = await this.prisma.learnerSession.findUniqueOrThrow({
      where: { learnerProfileId },
      select: { id: true },
    });

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
    const session = await this.prisma.learnerSession.findUniqueOrThrow({
      where: { learnerProfileId },
      select: { id: true },
    });

    return this.prisma.sessionState.upsert({
      where: {
        sessionId: session.id,
      },
      create: {
        sessionId: session.id,
        currentView: 'home',
        statePayload: {},
        isLocked,
      },
      update: {
        isLocked,
      },
    });
  }

  private toSessionRole(role?: SessionParticipantRole): SessionRole {
    return role === SessionParticipantRole.EDUCATOR ? SessionRole.EDUCATOR : SessionRole.LEARNER;
  }
}
