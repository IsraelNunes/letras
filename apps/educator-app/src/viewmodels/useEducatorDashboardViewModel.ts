import { SocketIdentity, Theme } from '@letras/shared-types';
import { useCallback, useMemo, useState } from 'react';
import { EducatorRepositoryImpl } from '../data/repositories/educator-repository.impl';
import { useEducatorRealtime } from '../hooks/useEducatorRealtime';
import { EducatorStorage } from '../infra/storage/educator-storage';

export function useEducatorDashboardViewModel() {
  const repository = useMemo(() => new EducatorRepositoryImpl(), []);
  const realtime = useEducatorRealtime();
  const {
    connect,
    disconnect,
    emitHelpReceived,
    emitLockRelease,
    emitLockSet,
    isLocked,
    lastHelpRequest,
    lastLearnerState,
    presence,
  } = realtime;

  const [learnerNameInput, setLearnerNameInput] = useState('');
  const [learnerProfileIdInput, setLearnerProfileIdInput] = useState('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const createLearnerProfile = useCallback(async () => {
    try {
      setIsBusy(true);
      setErrorMessage(null);

      const profile = await repository.createLearnerProfile(learnerNameInput || 'Novo Aprendiz');
      setLearnerProfileIdInput(profile.id);
      setStatusMessage(`Perfil criado: ${profile.displayName} (${profile.id})`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao criar perfil');
    } finally {
      setIsBusy(false);
    }
  }, [learnerNameInput, repository]);

  const loadThemes = useCallback(async () => {
    try {
      setIsBusy(true);
      setErrorMessage(null);

      const fetchedThemes = await repository.fetchThemes();
      setThemes(fetchedThemes);

      if (fetchedThemes.length > 0) {
        setSelectedThemeId(fetchedThemes[0].id);
      }

      setStatusMessage(`Temas carregados: ${fetchedThemes.length}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao carregar temas');
    } finally {
      setIsBusy(false);
    }
  }, [repository]);

  const assignSelectedTheme = useCallback(async () => {
    if (!learnerProfileIdInput || !selectedThemeId) {
      setErrorMessage('Informe learnerProfileId e carregue temas antes de atribuir.');
      return;
    }

    try {
      setIsBusy(true);
      setErrorMessage(null);

      await repository.assignTheme(learnerProfileIdInput, selectedThemeId);
      setStatusMessage('Tema atribuído ao aprendiz com sucesso.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao atribuir tema');
    } finally {
      setIsBusy(false);
    }
  }, [learnerProfileIdInput, repository, selectedThemeId]);

  const joinLearnerSession = useCallback(async () => {
    if (!learnerProfileIdInput) {
      setErrorMessage('Informe o learnerProfileId para entrar na sessão.');
      return;
    }

    const deviceId = await EducatorStorage.getOrCreateEducatorDeviceId();

    const identity: SocketIdentity = {
      learnerProfileId: learnerProfileIdInput,
      participantId: deviceId,
      role: 'educator',
    };

    connect(identity);
    setStatusMessage('Educador conectado à sessão realtime.');
  }, [connect, learnerProfileIdInput]);

  const toggleLock = useCallback(async () => {
    if (!learnerProfileIdInput) {
      setErrorMessage('Informe o learnerProfileId para travar/destravar sessão.');
      return;
    }

    try {
      const nextLockState = !isLocked;
      await repository.setLockState(learnerProfileIdInput, nextLockState);

      if (nextLockState) {
        emitLockSet(learnerProfileIdInput);
      } else {
        emitLockRelease(learnerProfileIdInput);
      }

      setStatusMessage(nextLockState ? 'Sessão travada.' : 'Sessão destravada.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao atualizar lock da sessão');
    }
  }, [emitLockRelease, emitLockSet, isLocked, learnerProfileIdInput, repository]);

  const respondHelp = useCallback(() => {
    if (!learnerProfileIdInput) {
      setErrorMessage('Informe o learnerProfileId para responder ajuda.');
      return;
    }

    emitHelpReceived({
      learnerProfileId: learnerProfileIdInput,
      message: 'Educador entrou para apoiar a atividade.',
    });

    setStatusMessage('Resposta de ajuda enviada ao aprendiz.');
  }, [emitHelpReceived, learnerProfileIdInput]);

  const cleanup = useCallback(() => {
    disconnect();
  }, [disconnect]);

  return {
    learnerNameInput,
    learnerProfileIdInput,
    themes,
    selectedThemeId,
    isBusy,
    statusMessage,
    errorMessage,
    isLocked,
    presence,
    lastLearnerState,
    lastHelpRequest,
    setLearnerNameInput,
    setLearnerProfileIdInput,
    setSelectedThemeId,
    createLearnerProfile,
    loadThemes,
    assignSelectedTheme,
    joinLearnerSession,
    toggleLock,
    respondHelp,
    cleanup,
  };
}
