import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { Educator } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { createSessionToken, hashPassword, verifyPassword } from '../../common/security/password-hash';
import { SupabaseAuthService } from '../../common/supabase/supabase-auth.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseAuthService: SupabaseAuthService,
  ) {}

  async register(dto: RegisterEducatorDto): Promise<AuthPayload> {
    const normalizedCpf = this.normalizeCpf(dto.cpf);
    const normalizedPhone = this.normalizePhone(dto.phoneDigits);
    const normalizedEmail = this.normalizeEmail(dto.email);
    const fullName = dto.fullName.trim();

    if (!normalizedCpf && !normalizedEmail) {
      throw new BadRequestException('Informe CPF ou email para criar a conta do educador.');
    }

    const password = dto.password.trim();
    if (password.length < 6) {
      throw new BadRequestException('Senha deve ter no minimo 6 caracteres.');
    }

    const [existingByEmail, existingByCpf] = await Promise.all([
      normalizedEmail ? this.prisma.educator.findUnique({ where: { email: normalizedEmail } }) : Promise.resolve(null),
      normalizedCpf ? this.prisma.educator.findUnique({ where: { cpf: normalizedCpf } }) : Promise.resolve(null),
    ]);

    if (existingByEmail && existingByCpf && existingByEmail.id !== existingByCpf.id) {
      throw new ConflictException('Email e CPF ja estao em uso por cadastros diferentes.');
    }

    const existingEducator = existingByEmail ?? existingByCpf;
    if (existingEducator?.supabaseAuthUserId) {
      throw new ConflictException('Este cadastro ja existe. Faca login na tela inicial.');
    }

    if (!normalizedEmail) {
      throw new BadRequestException('Email obrigatorio para criar conta vinculada ao Supabase Auth.');
    }

    const supabaseUser = await this.resolveSupabaseUserForRegister(normalizedEmail, password, fullName);

    if (existingEducator) {
      try {
        const updatedEducator = await this.prisma.educator.update({
          where: { id: existingEducator.id },
          data: {
            name: fullName,
            email: normalizedEmail,
            supabaseAuthUserId: supabaseUser.userId,
            cpf: normalizedCpf ?? existingEducator.cpf,
            phoneDigits: normalizedPhone ?? existingEducator.phoneDigits,
            birthDate: this.pickValue(dto.birthDate, existingEducator.birthDate),
            uf: this.pickValue(dto.uf, existingEducator.uf),
            city: this.pickValue(dto.city, existingEducator.city),
            photoUri: this.pickValue(dto.photoUri, existingEducator.photoUri),
            educationLevel: this.pickValue(dto.educationLevel, existingEducator.educationLevel),
            trainingArea: this.pickValue(dto.trainingArea, existingEducator.trainingArea),
            linkedin: this.pickValue(dto.linkedin, existingEducator.linkedin),
            facebook: this.pickValue(dto.facebook, existingEducator.facebook),
            instagram: this.pickValue(dto.instagram, existingEducator.instagram),
            xHandle: this.pickValue(dto.xHandle, existingEducator.xHandle),
            passwordHash: hashPassword(password),
          },
        });

        return this.createSession(updatedEducator);
      } catch (error) {
        if (supabaseUser.createdNow) {
          await this.supabaseAuthService.deleteUser(supabaseUser.userId).catch(() => undefined);
        }
        throw error;
      }
    }

    try {
      const educator = await this.prisma.educator.create({
        data: {
          name: fullName,
          email: normalizedEmail,
          supabaseAuthUserId: supabaseUser.userId,
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
    } catch (error) {
      if (supabaseUser.createdNow) {
        await this.supabaseAuthService.deleteUser(supabaseUser.userId).catch(() => undefined);
      }
      throw error;
    }
  }

  async login(dto: LoginEducatorDto): Promise<AuthPayload> {
    const identifier = dto.identifier.trim();
    if (!identifier) {
      throw new UnauthorizedException('Identificador invalido.');
    }

    const educator = identifier.includes('@')
      ? await this.findEducatorByEmail(identifier)
      : await this.findEducatorByCpf(identifier);

    if (!educator || !educator.email) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    let supabaseSignInResult: { userId: string } | null = null;
    if (this.supabaseAuthService.isConfigured) {
      try {
        supabaseSignInResult = await this.supabaseAuthService.signInWithPassword(educator.email, dto.password);
      } catch {
        supabaseSignInResult = null;
      }
    }

    const isValidSupabaseCredentials = Boolean(supabaseSignInResult?.userId);
    const isValidLocalPassword =
      Boolean(educator.passwordHash) && verifyPassword(dto.password, educator.passwordHash ?? '');

    if (!isValidSupabaseCredentials && !isValidLocalPassword) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    await this.syncEducatorWithSupabaseOnLogin(educator, dto.password, supabaseSignInResult?.userId ?? null);

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

  private pickValue(newValue: string | undefined, previousValue: string | null): string | null {
    const trimmed = newValue?.trim() ?? '';
    return trimmed.length > 0 ? trimmed : previousValue;
  }

  private async resolveSupabaseUserForRegister(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ userId: string; createdNow: boolean }> {
    if (!this.supabaseAuthService.isConfigured) {
      throw new ServiceUnavailableException(
        'Supabase Auth nao configurado na API. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY e reinicie.',
      );
    }

    try {
      const user = await this.supabaseAuthService.createUser(email, password, fullName);
      return { userId: user.id, createdNow: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar usuario no Supabase Auth.';

      if (this.isSupabaseUserAlreadyExistsError(message)) {
        const signIn = await this.supabaseAuthService.signInWithPassword(email, password).catch(() => null);
        if (!signIn?.userId) {
          throw new ConflictException('Ja existe usuario no Supabase Auth com esse email. Tente fazer login.');
        }
        return { userId: signIn.userId, createdNow: false };
      }

      throw new InternalServerErrorException(`Falha no Supabase Auth: ${message}`);
    }
  }

  private isSupabaseUserAlreadyExistsError(message: string): boolean {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('already') ||
      normalized.includes('exists') ||
      normalized.includes('duplicate') ||
      normalized.includes('registered')
    );
  }

  private async syncEducatorWithSupabaseOnLogin(
    educator: Educator,
    password: string,
    supabaseUserIdFromSignIn: string | null,
  ): Promise<void> {
    if (!this.supabaseAuthService.isConfigured || educator.supabaseAuthUserId || !educator.email) {
      return;
    }

    let supabaseUserId = supabaseUserIdFromSignIn;

    if (!supabaseUserId) {
      try {
        supabaseUserId = await this.supabaseAuthService.findUserIdByEmail(educator.email);
      } catch {
        supabaseUserId = null;
      }
    }

    if (!supabaseUserId) {
      try {
        const created = await this.supabaseAuthService.createUser(educator.email, password, educator.name);
        supabaseUserId = created.id;
      } catch (error) {
        const message = error instanceof Error ? error.message : '';
        if (this.isSupabaseUserAlreadyExistsError(message)) {
          supabaseUserId = await this.supabaseAuthService.findUserIdByEmail(educator.email).catch(() => null);
        }
      }
    }

    if (!supabaseUserId) {
      return;
    }

    await this.prisma.educator
      .update({
        where: { id: educator.id },
        data: { supabaseAuthUserId: supabaseUserId },
      })
      .catch(() => undefined);
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
