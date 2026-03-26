import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AssignThemeDto } from './dto/assign-theme.dto';
import { CreateLearnerProfileDto } from './dto/create-learner-profile.dto';

@Injectable()
export class LearnerService {
  constructor(private readonly prisma: PrismaService) {}

  createProfile(dto: CreateLearnerProfileDto) {
    return this.prisma.learnerProfile.create({
      data: {
        displayName: dto.displayName,
        notes: dto.notes,
        educatorId: dto.educatorId,
      },
    });
  }

  async assignTheme(learnerProfileId: string, dto: AssignThemeDto) {
    await this.prisma.learnerProfile.findUniqueOrThrow({
      where: { id: learnerProfileId },
      select: { id: true },
    });

    await this.prisma.theme.findUniqueOrThrow({
      where: { id: dto.themeId },
      select: { id: true },
    });

    return this.prisma.learnerTheme.upsert({
      where: {
        learnerProfileId_themeId: {
          learnerProfileId,
          themeId: dto.themeId,
        },
      },
      create: {
        learnerProfileId,
        themeId: dto.themeId,
      },
      update: {},
      include: {
        theme: true,
      },
    });
  }

  getAssignedThemes(learnerProfileId: string) {
    return this.prisma.learnerTheme.findMany({
      where: { learnerProfileId },
      include: {
        theme: {
          include: {
            learningUnits: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }
}
