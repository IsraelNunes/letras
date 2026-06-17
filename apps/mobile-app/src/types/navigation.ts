export interface EducatorOnboardingData {
  cpf: string;
  phoneDigits: string;
  email?: string;
  password?: string;
  fullName: string;
  birthDate: string;
  uf: string;
  city: string;
  photoUri?: string | null;
  educationLevel?: string;
  trainingArea?: string;
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  xHandle?: string;
}

export type AppMode = 'educator' | 'learner';

export type EducatorRootStackParamList = {
  EducatorLoading: undefined;
  EducatorLogin: undefined;
  EducatorSplash: undefined;
  EducatorProfile: undefined;
  EducatorOnboardingStepTwo: Pick<EducatorOnboardingData, 'cpf' | 'phoneDigits'>;
  EducatorOnboardingStepThree: Pick<
    EducatorOnboardingData,
    'cpf' | 'phoneDigits' | 'email' | 'fullName' | 'birthDate' | 'uf' | 'city' | 'photoUri'
  >;
  EducatorOnboardingConfirm: EducatorOnboardingData;
  LearnerOnboardingStep1: { isEducatorFlow?: boolean } | undefined;
  LearnerOnboardingStep2: Pick<LearnerOnboardingData, 'cpfOrPassport' | 'phoneDigits'> & { isEducatorFlow?: boolean };
  LearnerOnboardingConfirm: LearnerOnboardingData & { isEducatorFlow?: boolean };
  EducatorHome: {
    fullName?: string;
    educatorId?: string;
    openNotifications?: boolean;
  };
  EducatorLearningMode: {
    fullName?: string;
    learnerName?: string;
    learnerId?: string;
    educatorId?: string;
  };
  EducatorLinkConfirm: {
    educatorId: string;
    fullName: string;
  };
  EducatorLinkSuccess: {
    learnerName: string;
    educatorId: string;
    fullName: string;
  };
};

export interface LearnerOnboardingData {
  cpfOrPassport: string;
  phoneDigits: string;
  fullName: string;
  birthDate: string;
  uf: string;
  city: string;
  photoUri?: string | null;
}

export type LearnerRootStackParamList = {
  LearnerLoading: undefined;
  LearnerFirstAccessGate: undefined;
  LearnerCpfLogin: undefined;
  LearnerLinkStep1: undefined;
  LearnerLinkSuccess: {
    learnerName: string;
    educatorName: string;
    learnerId: string;
  };
  LearnerOnboardingStep1: { isEducatorFlow?: boolean } | undefined;
  LearnerOnboardingStep2: Pick<LearnerOnboardingData, 'cpfOrPassport' | 'phoneDigits'> & { isEducatorFlow?: boolean };
  LearnerOnboardingConfirm: LearnerOnboardingData & { isEducatorFlow?: boolean };
  LearnerHome: undefined;
  LearnerProfile: undefined;
  LearnerLessonIntro: {
    moduleId: string;
    lessonId: string;
    moduleLabel: string;
    moduleTitle: string;
  };
  LearnerLessonScreen: {
    moduleId: string;
    lessonId: string;
    screenIndex: number;
    moduleLabel: string;
    moduleTitle: string;
  };
  LearnerLessonActivity: {
    moduleId: string;
    lessonId: string;
    screenIndex: number;
    moduleLabel: string;
    moduleTitle: string;
  };
  LearnerLessonConclusion: {
    moduleId: string;
    lessonId: string;
    moduleLabel: string;
    moduleTitle: string;
  };
};

export type RootStackParamList = {
  AppModeGate: undefined;
  EducatorFlow: undefined;
  LearnerFlow: undefined;
};
