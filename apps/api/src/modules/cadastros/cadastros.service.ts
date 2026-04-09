import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SyncAction, SyncEntityType, TutorLearnerLinkStatus } from '@prisma/client';
import { hashPassword } from '../../common/security/password-hash';
import { SyncEventService } from '../../common/sync/sync-event.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAlfabetizadorDto } from './dto/create-alfabetizador.dto';
import { CreateAlfabetizandoDto } from './dto/create-alfabetizando.dto';
import { CreateVinculoDto } from './dto/create-vinculo.dto';
import { UpdateVinculoDto } from './dto/update-vinculo.dto';

@Injectable()
export class CadastrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly syncEventService: SyncEventService,
  ) {}

  listAlfabetizadores() {
    return this.prisma.educator.findMany({
      include: {
        _count: {
          select: {
            learners: true,
            tutorLearnerLinks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createAlfabetizador(dto: CreateAlfabetizadorDto) {
    try {
      const created = await this.prisma.educator.create({
        data: {
          name: dto.name,
          email: dto.email,
          cpf: dto.cpf,
          phoneDigits: dto.phoneDigits,
          birthDate: dto.birthDate,
          uf: dto.uf,
          city: dto.city,
          photoUri: dto.photoUri,
          educationLevel: dto.educationLevel,
          trainingArea: dto.trainingArea,
          linkedin: dto.linkedin,
          facebook: dto.facebook,
          instagram: dto.instagram,
          xHandle: dto.xHandle,
          passwordHash: dto.password ? hashPassword(dto.password) : null,
        },
      });

      await this.syncEventService.record({
        entityType: SyncEntityType.EDUCATOR,
        entityId: created.id,
        action: SyncAction.CREATED,
        payload: {
          name: created.name,
          email: created.email,
        },
      });

      return created;
    } catch (error) {
      this.handlePrismaConflict(error, 'Nao foi possivel cadastrar alfabetizador. Verifique email/cpf.');
    }
  }

  async listAlfabetizandos() {
    const learners = await this.prisma.learnerProfile.findMany({
      include: {
        completions: {
          select: {
            status: true,
            updatedAt: true,
          },
        },
        tutorLearnerLinks: {
          orderBy: {
            requestedAt: 'desc',
          },
          take: 1,
          include: {
            educator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        learnerThemes: {
          include: {
            theme: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return learners.map((learner) => {
      const totalTracked = learner.completions.length;
      const completedCount = learner.completions.filter((completion) => completion.status === 'COMPLETED').length;
      const progressPercent = totalTracked === 0 ? 0 : Math.round((completedCount / totalTracked) * 100);
      const latestCompletion = learner.completions.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
      const latestLink = learner.tutorLearnerLinks[0];

      return {
        ...learner,
        progresso: {
          totalTracked,
          completedCount,
          progressPercent,
          lastInteractionAt: latestCompletion?.updatedAt ?? learner.updatedAt,
        },
        vinculoAtual: latestLink
          ? {
              id: latestLink.id,
              status: latestLink.status,
              educator: latestLink.educator,
              requestedAt: latestLink.requestedAt,
              respondedAt: latestLink.respondedAt,
            }
          : null,
      };
    });
  }

  async getAlfabetizandoById(id: string) {
    const learner = await this.prisma.learnerProfile.findUnique({
      where: { id },
      include: {
        educator: true,
        learnerThemes: {
          include: {
            theme: {
              include: {
                learningUnits: {
                  include: {
                    activities: true,
                  },
                },
              },
            },
          },
        },
        completions: {
          include: {
            activity: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        },
        tutorLearnerLinks: {
          include: {
            educator: {
              select: {
                id: true,
                name: true,
                email: true,
                phoneDigits: true,
              },
            },
          },
          orderBy: {
            requestedAt: 'desc',
          },
        },
      },
    });

    if (!learner) {
      throw new NotFoundException(`Alfabetizando ${id} nao encontrado.`);
    }

    const completedCount = learner.completions.filter((completion) => completion.status === 'COMPLETED').length;
    const totalTracked = learner.completions.length;

    return {
      ...learner,
      progresso: {
        totalTracked,
        completedCount,
        progressPercent: totalTracked === 0 ? 0 : Math.round((completedCount / totalTracked) * 100),
      },
    };
  }

  async createAlfabetizando(dto: CreateAlfabetizandoDto) {
    try {
      const created = await this.prisma.learnerProfile.create({
        data: {
          displayName: dto.displayName,
          notes: dto.notes,
          educatorId: dto.educatorId,
          cpfOrPassport: dto.cpfOrPassport,
          phoneDigits: dto.phoneDigits,
          birthDate: dto.birthDate,
          uf: dto.uf,
          city: dto.city,
          photoUri: dto.photoUri,
        },
      });

      await this.syncEventService.record({
        entityType: SyncEntityType.LEARNER_PROFILE,
        entityId: created.id,
        action: SyncAction.CREATED,
        actorEducatorId: dto.educatorId,
        payload: {
          displayName: created.displayName,
          cpfOrPassport: created.cpfOrPassport,
          phoneDigits: created.phoneDigits,
        },
      });

      return created;
    } catch (error) {
      this.handlePrismaConflict(
        error,
        'Nao foi possivel cadastrar alfabetizando. CPF/passaporte ou telefone ja estao em uso.',
      );
    }
  }

  listVinculos(status?: TutorLearnerLinkStatus) {
    return this.prisma.tutorLearnerLink.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        educator: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneDigits: true,
          },
        },
        learnerProfile: {
          select: {
            id: true,
            displayName: true,
            cpfOrPassport: true,
            phoneDigits: true,
            uf: true,
            city: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });
  }

  async createVinculo(dto: CreateVinculoDto) {
    await this.ensureEducatorExists(dto.educatorId);
    await this.ensureLearnerExists(dto.learnerProfileId);

    const link = await this.prisma.tutorLearnerLink.upsert({
      where: {
        educatorId_learnerProfileId: {
          educatorId: dto.educatorId,
          learnerProfileId: dto.learnerProfileId,
        },
      },
      create: {
        educatorId: dto.educatorId,
        learnerProfileId: dto.learnerProfileId,
        status: TutorLearnerLinkStatus.PENDING,
        requestedBy: dto.requestedBy,
      },
      update: {
        status: TutorLearnerLinkStatus.PENDING,
        requestedBy: dto.requestedBy,
        requestedAt: new Date(),
        respondedAt: null,
        responseReason: null,
      },
      include: {
        educator: true,
        learnerProfile: true,
      },
    });

    await this.syncEventService.record({
      entityType: SyncEntityType.TUTOR_LEARNER_LINK,
      entityId: link.id,
      action: SyncAction.CREATED,
      actorEducatorId: dto.educatorId,
      payload: {
        learnerProfileId: dto.learnerProfileId,
        status: link.status,
      },
    });

    return link;
  }

  async updateVinculo(id: string, dto: UpdateVinculoDto) {
    const existing = await this.prisma.tutorLearnerLink.findUnique({
      where: { id },
      include: {
        learnerProfile: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Vinculo ${id} nao encontrado.`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.tutorLearnerLink.update({
        where: { id },
        data: {
          status: dto.status,
          responseReason: dto.responseReason,
          respondedAt: new Date(),
        },
        include: {
          educator: true,
          learnerProfile: true,
        },
      });

      if (dto.status === TutorLearnerLinkStatus.CONFIRMED) {
        await tx.learnerProfile.update({
          where: { id: next.learnerProfileId },
          data: {
            educatorId: next.educatorId,
          },
        });
      }

      return next;
    });

    await this.syncEventService.record({
      entityType: SyncEntityType.TUTOR_LEARNER_LINK,
      entityId: updated.id,
      action: SyncAction.STATUS_CHANGED,
      actorEducatorId: dto.actorEducatorId ?? updated.educatorId,
      payload: {
        previousStatus: existing.status,
        status: updated.status,
        responseReason: updated.responseReason,
      },
    });

    return updated;
  }

  private async ensureEducatorExists(id: string) {
    const educator = await this.prisma.educator.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!educator) {
      throw new NotFoundException(`Alfabetizador ${id} nao encontrado.`);
    }
  }

  private async ensureLearnerExists(id: string) {
    const learner = await this.prisma.learnerProfile.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!learner) {
      throw new NotFoundException(`Alfabetizando ${id} nao encontrado.`);
    }
  }

  private handlePrismaConflict(error: unknown, fallbackMessage: string): never {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(fallbackMessage);
    }

    throw error;
  }
}
