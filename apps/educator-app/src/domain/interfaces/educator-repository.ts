import {
  EducatorAuthResponse,
  EducatorMeResponse,
  LearnerProfile,
  ReferenceCity,
  ReferenceUf,
  RegisterEducatorRequest,
  Theme,
} from '@letras/shared-types';

export interface EducatorRepository {
  createLearnerProfile(displayName: string, educatorId?: string): Promise<LearnerProfile>;
  registerEducator(payload: RegisterEducatorRequest): Promise<EducatorAuthResponse>;
  loginEducator(identifier: string, password: string): Promise<EducatorAuthResponse>;
  fetchCurrentEducator(): Promise<EducatorMeResponse>;
  logoutEducator(): Promise<void>;
  fetchThemes(): Promise<Theme[]>;
  fetchUfs(): Promise<ReferenceUf[]>;
  fetchCitiesByUf(uf: string): Promise<ReferenceCity[]>;
  assignTheme(learnerProfileId: string, themeId: string): Promise<void>;
  setLockState(learnerProfileId: string, isLocked: boolean): Promise<void>;
}
