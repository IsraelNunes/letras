import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CompletionStatus, TrackProgressDto } from './dto/track-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async trackProgress(dto: TrackProgressDto) {
    const [learnerProfile, activity] = await Promise.all([
      this.prisma.learnerProfile.findUnique({
        where: { id: dto.learnerProfileId },
        select: { id: true },
      }),
      this.prisma.activity.findUnique({
        where: { id: dto.activityId },
        select: { id: true },
      }),
    ]);

    if (!learnerProfile) {
      throw new NotFoundException(`LearnerProfile ${dto.learnerProfileId} nao encontrado.`);
    }

    if (!activity) {
      throw new NotFoundException(`Activity ${dto.activityId} nao encontrada.`);
    }

    const completedAt = dto.status === CompletionStatus.COMPLETED ? new Date() : null;

    return this.prisma.completion.upsert({
      where: {
        learnerProfileId_activityId: {
          learnerProfileId: dto.learnerProfileId,
          activityId: dto.activityId,
        },
      },
      create: {
        learnerProfileId: dto.learnerProfileId,
        activityId: dto.activityId,
        status: dto.status,
        score: dto.score,
        elapsedSeconds: dto.elapsedSeconds,
        completedAt,
      },
      update: {
        status: dto.status,
        score: dto.score,
        elapsedSeconds: dto.elapsedSeconds,
        completedAt,
      },
      include: {
        activity: true,
      },
    });
  }

  getProgress(learnerProfileId: string) {
    return this.prisma.completion.findMany({
      where: { learnerProfileId },
      include: {
        activity: {
          include: {
            learningUnit: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}
