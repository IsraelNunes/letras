import { PropsWithChildren, createContext, useContext, useEffect } from 'react';
import { useLearnerHomeViewModel } from '../../viewmodels/learner/useLearnerHomeViewModel';

type LearnerSessionContextValue = ReturnType<typeof useLearnerHomeViewModel>;

const LearnerSessionContext = createContext<LearnerSessionContextValue | null>(null);

interface LearnerSessionProviderProps {
  // Runner da Etapa 1 no educador: opera sob o perfil do alfabetizando.
  overrideLearnerProfileId?: string;
}

export function LearnerSessionProvider({
  children,
  overrideLearnerProfileId,
}: PropsWithChildren<LearnerSessionProviderProps>) {
  const viewModel = useLearnerHomeViewModel({ overrideLearnerProfileId });
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
