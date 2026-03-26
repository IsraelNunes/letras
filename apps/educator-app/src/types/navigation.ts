export interface EducatorOnboardingData {
  cpf: string;
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

export type EducatorRootStackParamList = {
  EducatorLoading: undefined;
  EducatorSplash: undefined;
  EducatorOnboardingStepTwo: Pick<EducatorOnboardingData, 'cpf' | 'phoneDigits'>;
  EducatorOnboardingStepThree: Pick<
    EducatorOnboardingData,
    'cpf' | 'phoneDigits' | 'fullName' | 'birthDate' | 'uf' | 'city' | 'photoUri'
  >;
  EducatorOnboardingConfirm: EducatorOnboardingData;
  EducatorDashboard: undefined;
};
