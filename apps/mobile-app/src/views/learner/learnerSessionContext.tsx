import { PropsWithChildren, createContext, useContext, useEffect } from 'react';
import { useLearnerHomeViewModel } from '../../viewmodels/learner/useLearnerHomeViewModel';

type LearnerSessionContextValue = ReturnType<typeof useLearnerHomeViewModel>;

const LearnerSessionContext = createContext<LearnerSessionContextValue | null>(null);

export function LearnerSessionProvider({ children }: PropsWithChildren) {
  const viewModel = useLearnerHomeViewModel();
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
