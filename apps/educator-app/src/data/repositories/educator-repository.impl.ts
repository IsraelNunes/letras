import {
  AssignThemeRequest,
  CreateLearnerProfileRequest,
  LearnerProfile,
  SetLockRequest,
  Theme,
} from '@letras/shared-types';
import { EducatorRepository } from '../../domain/interfaces/educator-repository';
import { httpClient } from '../../infra/api/http-client';

export class EducatorRepositoryImpl implements EducatorRepository {
  createLearnerProfile(displayName: string): Promise<LearnerProfile> {
    const body: CreateLearnerProfileRequest = {
      displayName,
      notes: 'Perfil criado por alfabetizador no app educador.',
    };

    return httpClient.post<LearnerProfile>('/learners', body);
  }

  fetchThemes(): Promise<Theme[]> {
    return httpClient.get<Theme[]>('/themes');
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
