import { LearnerProfile, ReferenceCity, ReferenceUf, Theme } from '@letras/shared-types';

export interface EducatorRepository {
  createLearnerProfile(displayName: string): Promise<LearnerProfile>;
  fetchThemes(): Promise<Theme[]>;
  fetchUfs(): Promise<ReferenceUf[]>;
  fetchCitiesByUf(uf: string): Promise<ReferenceCity[]>;
  assignTheme(learnerProfileId: string, themeId: string): Promise<void>;
  setLockState(learnerProfileId: string, isLocked: boolean): Promise<void>;
}
