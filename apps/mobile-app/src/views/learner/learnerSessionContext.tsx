import { PropsWithChildren, createContext, useContext, useEffect } from 'react';
import { useLearnerHomeViewModel } from '../../viewmodels/learner/useLearnerHomeViewModel';

type LearnerSessionContextValue = ReturnType<typeof useLearnerHomeViewModel>;

const LearnerSessionContext = createContext<LearnerSessionContextValue | null>(null);

// Sinaliza às telas reaproveitadas (via LearnerScreenLayout) que o menu inferior
// do alfabetizando deve ser escondido — usado pelo runner da Etapa 1 no modo
// educador, onde Tutoriais/Pontuação/Perfil do aluno não fazem sentido.
export const LearnerChromeContext = createContext<{ hideBottomMenu: boolean }>({
  hideBottomMenu: false,
});

export function useLearnerChrome() {
  return useContext(LearnerChromeContext);
}

interface LearnerSessionProviderProps {
  // Runner da Etapa 1 no educador: opera sob o perfil do alfabetizando.
  overrideLearnerProfileId?: string;
  overrideLearnerName?: string;
}

export function LearnerSessionProvider({
  children,
  overrideLearnerProfileId,
  overrideLearnerName,
}: PropsWithChildren<LearnerSessionProviderProps>) {
  const viewModel = useLearnerHomeViewModel({ overrideLearnerProfileId, overrideLearnerName });
  const { initialize, cleanup } = viewModel;

  useEffect(() => {
    void initialize();
    return cleanup;
  }, [cleanup, initialize]);

  return <LearnerSessionContext.Provider value={viewModel}>{children}</LearnerSessionContext.Provider>;
}

export function useLearnerSession() {
  const context = useContext(LearnerSessionContext);
  if (!context) {
    throw new Error('useLearnerSession must be used within LearnerSessionProvider.');
  }
  return context;
}

export function useOptionalLearnerSession() {
  return useContext(LearnerSessionContext);
}
