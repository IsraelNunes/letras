import {
  AssignThemeRequest,
  CreateLearnerProfileRequest,
  EducatorAuthResponse,
  EducatorMeResponse,
  LoginEducatorRequest,
  LearnerProfile,
  ReferenceCity,
  ReferenceUf,
  RegisterEducatorRequest,
  SetLockRequest,
  Theme,
} from '@letras/shared-types';
import { EducatorRepository } from '../../domain/interfaces/educator-repository';
import { httpClient } from '../../infra/api/http-client';

export class EducatorRepositoryImpl implements EducatorRepository {
  createLearnerProfile(displayName: string, educatorId?: string): Promise<LearnerProfile> {
    const body: CreateLearnerProfileRequest = {
      displayName,
      notes: 'Perfil criado por alfabetizador no app educador.',
      educatorId,
    };

    return httpClient.post<LearnerProfile>('/learners', body);
  }

  registerEducator(payload: RegisterEducatorRequest): Promise<EducatorAuthResponse> {
    return httpClient.post<EducatorAuthResponse>('/auth/educators/register', payload);
  }

  loginEducator(identifier: string, password: string): Promise<EducatorAuthResponse> {
    const body: LoginEducatorRequest = {
      identifier,
      password,
    };

    return httpClient.post<EducatorAuthResponse>('/auth/educators/login', body);
  }

  fetchCurrentEducator(): Promise<EducatorMeResponse> {
    return httpClient.get<EducatorMeResponse>('/auth/educators/me');
  }

  async logoutEducator(): Promise<void> {
    await httpClient.post('/auth/educators/logout', {});
  }

  fetchThemes(): Promise<Theme[]> {
    return httpClient.get<Theme[]>('/themes');
  }

  fetchUfs(): Promise<ReferenceUf[]> {
    return httpClient.get<ReferenceUf[]>('/reference/ufs');
  }

  fetchCitiesByUf(uf: string): Promise<ReferenceCity[]> {
    return httpClient.get<ReferenceCity[]>(`/reference/ufs/${uf}/cities`);
  }

  async assignTheme(learnerProfileId: string, themeId: string): Promise<void> {
    const body: AssignThemeRequest = {
      themeId,
    };

    await httpClient.post(`/learners/${learnerProfileId}/themes`, body);
  }

  async setLockState(learnerProfileId: string, isLocked: boolean): Promise<void> {
    const body: SetLockRequest = {
      isLocked,
    };

    await httpClient.put(`/sessions/${learnerProfileId}/lock`, body);
  }
}
