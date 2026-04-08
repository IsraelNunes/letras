export interface EducatorOnboardingData {
  cpf: string;
  email: string;
  password: string;
  phoneDigits: string;
  fullName: string;
  birthDate: string;
  uf: string;
  city: string;
  photoUri?: string | null;
  educationLevel: string;
  trainingArea: string;
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
  EducatorOnboardingStepTwo: Pick<EducatorOnboardingData, 'cpf' | 'email' | 'password' | 'phoneDigits'>;
  EducatorOnboardingStepThree: Pick<
    EducatorOnboardingData,
    'cpf' | 'email' | 'password' | 'phoneDigits' | 'fullName' | 'birthDate' | 'uf' | 'city' | 'photoUri'
  >;
  EducatorOnboardingConfirm: EducatorOnboardingData;
  EducatorLearningMode: {
    fullName?: string;
  };
};

export type LearnerRootStackParamList = {
  LearnerHome: undefined;
};

export type RootStackParamList = {
  AppModeGate: undefined;
  EducatorFlow: undefined;
  LearnerFlow: undefined;
};
