import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Educator } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { createSessionToken, hashPassword, verifyPassword } from '../../common/security/password-hash';
import { LoginEducatorDto } from './dto/login-educator.dto';
import { RegisterEducatorDto } from './dto/register-educator.dto';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

interface AuthPayload {
  token: string;
  expiresAt: string;
  educator: {
    id: string;
    fullName: string;
    email: string | null;
    cpf: string | null;
    phoneDigits: string | null;
  };
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterEducatorDto): Promise<AuthPayload> {
    const normalizedCpf = this.normalizeCpf(dto.cpf);
    const normalizedPhone = this.normalizePhone(dto.phoneDigits);
    const normalizedEmail = this.normalizeEmail(dto.email);

    if (!normalizedCpf && !normalizedEmail) {
      throw new BadRequestException('Informe CPF ou email para criar a conta do educador.');
    }

    if (normalizedEmail) {
      const existingByEmail = await this.prisma.educator.findUnique({ where: { email: normalizedEmail } });
      if (existingByEmail) {
        throw new ConflictException('Ja existe um educador cadastrado com esse email.');
      }
    }

    if (normalizedCpf) {
      const existingByCpf = await this.prisma.educator.findUnique({ where: { cpf: normalizedCpf } });
      if (existingByCpf) {
        throw new ConflictException('Ja existe um educador cadastrado com esse CPF.');
      }
    }

    const password = dto.password.trim();
    if (password.length < 6) {
      throw new BadRequestException('Senha deve ter no minimo 6 caracteres.');
    }

    const educator = await this.prisma.educator.create({
      data: {
        name: dto.fullName.trim(),
        email: normalizedEmail,
        cpf: normalizedCpf,
        phoneDigits: normalizedPhone,
        birthDate: dto.birthDate?.trim() || null,
        uf: dto.uf?.trim() || null,
        city: dto.city?.trim() || null,
        photoUri: dto.photoUri?.trim() || null,
        educationLevel: dto.educationLevel?.trim() || null,
        trainingArea: dto.trainingArea?.trim() || null,
        linkedin: dto.linkedin?.trim() || null,
        facebook: dto.facebook?.trim() || null,
        instagram: dto.instagram?.trim() || null,
        xHandle: dto.xHandle?.trim() || null,
        passwordHash: hashPassword(password),
      },
    });

    return this.createSession(educator);
  }

  async login(dto: LoginEducatorDto): Promise<AuthPayload> {
    const identifier = dto.identifier.trim();
    if (!identifier) {
      throw new UnauthorizedException('Identificador invalido.');
    }

    const educator = identifier.includes('@')
      ? await this.findEducatorByEmail(identifier)
      : await this.findEducatorByCpf(identifier);

    if (!educator || !educator.passwordHash) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    if (!verifyPassword(dto.password, educator.passwordHash)) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    return this.createSession(educator);
  }

  async me(authorizationHeader?: string): Promise<Omit<AuthPayload, 'token'>> {
    const token = this.extractBearerToken(authorizationHeader);

    const session = await this.prisma.educatorAuthSession.findUnique({
      where: { token },
      include: { educator: true },
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Sessao invalida ou expirada.');
    }

    return {
      expiresAt: session.expiresAt.toISOString(),
      educator: this.toEducatorPayload(session.educator),
    };
  }

  async logout(authorizationHeader?: string): Promise<{ success: boolean }> {
    const token = this.extractBearerToken(authorizationHeader);

    await this.prisma.educatorAuthSession.updateMany({
      where: {
        token,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return { success: true };
  }

  private async createSession(educator: Educator): Promise<AuthPayload> {
    const token = createSessionToken('educator');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.prisma.educatorAuthSession.create({
      data: {
        educatorId: educator.id,
        token,
        expiresAt,
      },
    });

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      educator: this.toEducatorPayload(educator),
    };
  }

  private toEducatorPayload(educator: Educator): AuthPayload['educator'] {
    return {
      id: educator.id,
      fullName: educator.name,
      email: educator.email,
      cpf: educator.cpf,
      phoneDigits: educator.phoneDigits,
    };
  }

  private extractBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader) {
      throw new UnauthorizedException('Token ausente.');
    }

    const [type, token] = authorizationHeader.split(' ');
    if (type?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException('Token invalido.');
    }

    return token.trim();
  }

  private normalizeCpf(value?: string): string | null {
    const digits = value?.replace(/\D/g, '').slice(0, 11) ?? '';
    return digits.length === 11 ? digits : null;
  }

  private normalizePhone(value?: string): string | null {
    const digits = value?.replace(/\D/g, '').slice(0, 11) ?? '';
    return digits.length === 11 ? digits : null;
  }

  private normalizeEmail(value?: string): string | null {
    const normalized = value?.trim().toLowerCase() ?? '';
    return normalized.length > 0 ? normalized : null;
  }

  private findEducatorByEmail(identifier: string) {
    const email = this.normalizeEmail(identifier);
    if (!email) {
      return Promise.resolve(null);
    }

    return this.prisma.educator.findUnique({ where: { email } });
  }

  private findEducatorByCpf(identifier: string) {
    const cpf = this.normalizeCpf(identifier);
    if (!cpf) {
      return Promise.resolve(null);
    }

    return this.prisma.educator.findUnique({ where: { cpf } });
  }
}
