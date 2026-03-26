import { LearnerProfile, Theme } from '@letras/shared-types';

export interface EducatorRepository {
  createLearnerProfile(displayName: string): Promise<LearnerProfile>;
  fetchThemes(): Promise<Theme[]>;
  assignTheme(learnerProfileId: string, themeId: string): Promise<void>;
  setLockState(learnerProfileId: string, isLocked: boolean): Promise<void>;
}
