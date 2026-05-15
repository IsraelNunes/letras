import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Audio, ResizeMode, Video } from 'expo-av';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LearnerScreenSnapshot } from '@letras/shared-types';
import { LearnerRootStackParamList } from '../../types';
import { LearnerActionButtons } from './components/LearnerActionButtons';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { learnerTheme } from './learnerTheme';
import { useLearnerFlowData } from './learnerFlowData';
import { getLearnerVisibleExerciseLabel, LearnerExerciseConfig } from './learnerFlowMapper';
import { useLearnerSession } from './learnerSessionContext';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLessonScreen'>;

interface ExerciseFeedback {
  type: 'ok' | 'error';
  message: string;
}

function resolveLockMessage(reason: string | null, lockMessage?: string | null) {
  const explicitMessage = String(lockMessage || '').trim();
  if (explicitMessage) {
    return explicitMessage;
  }
  const normalizedReason = String(reason || '').trim().toLowerCase();
  if (!normalizedReason) {
    return 'A tela foi bloqueada. Aguarde apoio do alfabetizador para continuar.';
  }
  if (normalizedReason.includes('ajuda')) {
    return 'A tela foi bloqueada porque houve pedido de ajuda. O alfabetizador entrara em contato.';
  }
  if (normalizedReason.includes('tentativa') || normalizedReason.includes('erro')) {
    return 'A tela foi bloqueada apos tentativas sem acerto. Aguarde orientacao do alfabetizador.';
  }
  return reason ?? 'A tela foi bloqueada temporariamente.';
}

function isInstructionAudioButtonVisible(exercise: LearnerExerciseConfig | null) {
  return Boolean(exercise);
}

function SoundWaveIcon({ large = false }: { large?: boolean }) {
  const color = large ? '#2fa536' : '#9be39f';
  const strokeWidth = large ? 4.5 : 4;
  return (
    <Svg width={large ? 66 : 38} height={large ? 54 : 32} viewBox="0 0 66 54" fill="none">
      <Path d="M8 22H19L33 10V44L19 32H8V22Z" fill={color} />
      <Path
        d="M42 20C45 23.5 45 30.5 42 34"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <Path
        d="M49 15C55 21 55 33 49 39"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {large ? (
        <Path
          d="M56 10C65 19 65 35 56 44"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      ) : null}
    </Svg>
  );
}

function SpeakerButton({
  onPress,
  large = false,
  disabled = false,
  active = false,
}: {
  onPress: () => void;
  large?: boolean;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Reproduzir audio"
      hitSlop={large ? 12 : 8}
      style={({ pressed }) => [
        large ? styles.largeAudioBtn : styles.itemSpeakerBtn,
        active ? styles.audioBtnActive : null,
        pressed && !disabled ? styles.audioBtnPressed : null,
        disabled ? styles.audioBtnDisabled : null,
      ]}
    >
      <SoundWaveIcon large={large} />
    </Pressable>
  );
}

function clampAspectRatio(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const ratio = width / height;
  return Math.max(1.2, Math.min(2, ratio));
}

function buildSpellingNarration(label: string): string {
  const normalized = String(label || '').trim();
  if (!normalized) return '';
  return normalized
    .split(/\s+/g)
    .map((chunk) => chunk.split('').join(' '))
    .join(', ');
}

function speakWithBrowserVoice(text: string): boolean {
  const normalized = String(text || '').trim();
  if (!normalized || Platform.OS !== 'web') {
    return false;
  }

  const runtime = globalThis as {
    speechSynthesis?: {
      cancel: () => void;
      speak: (utterance: unknown) => void;
      getVoices: () => Array<{ lang?: string }>;
    };
    SpeechSynthesisUtterance?: new (value: string) => {
      lang?: string;
      rate?: number;
      pitch?: number;
      voice?: unknown;
    };
  };

  if (!runtime.speechSynthesis || typeof runtime.SpeechSynthesisUtterance !== 'function') {
    return false;
  }

  const utterance = new runtime.SpeechSynthesisUtterance(normalized);
  const voices = runtime.speechSynthesis.getVoices?.() ?? [];
  const preferredVoice =
    voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith('pt-br')) ??
    voices.find((voice) => String(voice.lang || '').toLowerCase().startsWith('pt'));

  utterance.lang = 'pt-BR';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  runtime.speechSynthesis.cancel();
  runtime.speechSynthesis.speak(utterance);
  return true;
}

function cancelBrowserVoice() {
  if (Platform.OS !== 'web') return;
  const runtime = globalThis as { speechSynthesis?: { cancel: () => void } };
  runtime.speechSynthesis?.cancel();
}

export function LearnerLessonScreenView({ navigation, route }: Props) {
  const { moduleId, lessonId, screenIndex, moduleLabel, moduleTitle } = route.params;
  const { getLesson } = useLearnerFlowData();
  const learnerSession = useLearnerSession();
  const lesson = getLesson(moduleId, lessonId);
  const wrongSelectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reinforcementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAudioRef = useRef<Audio.Sound | null>(null);
  const audioRequestIdRef = useRef(0);

  const [didFailImageLoad, setDidFailImageLoad] = useState(false);
  const [didFailMediaLoad, setDidFailMediaLoad] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState(16 / 9);

  const [matchSelectedOptions, setMatchSelectedOptions] = useState<Record<string, string>>({});
  const [matchCompletedIds, setMatchCompletedIds] = useState<string[]>([]);
  const [matchUnlockedIndex, setMatchUnlockedIndex] = useState(0);
  const [matchWrongIds, setMatchWrongIds] = useState<string[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [exerciseAttempts, setExerciseAttempts] = useState(0);
  const [exerciseLocked, setExerciseLocked] = useState(false);
  const [remoteLockWasObserved, setRemoteLockWasObserved] = useState(false);
  const [exerciseFeedback, setExerciseFeedback] = useState<ExerciseFeedback | null>(null);
  const [showReinforcement, setShowReinforcement] = useState(false);
  const [reinforcementMessage, setReinforcementMessage] = useState<string | null>(null);
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);

  if (!lesson) {
    return (
      <LearnerScreenLayout activeMenu="acompanhar" onMenuHome={() => navigation.navigate('LearnerHome')}>
        <Text style={styles.error}>Conteudo nao encontrado.</Text>
      </LearnerScreenLayout>
    );
  }

  const totalScreens = lesson.screens.length;
  const safeIndex = Math.min(Math.max(screenIndex, 0), totalScreens - 1);
  const screen = lesson.screens[safeIndex];
  const progressPercent = ((safeIndex + 1) / totalScreens) * 100;
  const completedMatchSet = useMemo(() => new Set(matchCompletedIds), [matchCompletedIds]);
  const isLockedByTemplate = screen.screenTemplate === 'locked';
  const isLocked = isLockedByTemplate || exerciseLocked || learnerSession.isLocked;
  const isInteractionLocked = isLocked || showReinforcement;
  const expectedSelections = Math.max(1, screen.exercise?.expectedSelections ?? 1);
  const selectedImageCount = selectedImageIds.length;
  const shouldRenderDefaultMedia = screen.screenTemplate === 'default' && !screen.exercise;

  const pauseOtherHtmlMedia = useCallback((exceptElement: unknown = null) => {
    // No web temos tres fontes de audio concorrentes: <audio>/<video> nativos
    // renderizados em telas de midia, o expo-av (speaker dos exercicios) e o
    // speechSynthesis (fallback TTS). Para evitar sobreposicao, ao iniciar
    // qualquer audio paramos todos os elementos de midia da pagina, exceto o
    // que disparou o evento.
    if (Platform.OS !== 'web') return;
    const runtimeDocument = (globalThis as { document?: Document }).document;
    if (!runtimeDocument) return;
    runtimeDocument.querySelectorAll('audio, video').forEach((element) => {
      if (element === exceptElement) return;
      const mediaElement = element as HTMLMediaElement;
      if (mediaElement.paused) return;
      try {
        mediaElement.pause();
      } catch {
        // Elementos ainda nao prontos podem lancar; nao ha o que fazer aqui.
      }
    });
  }, []);

  const stopCurrentAudio = useCallback(
    async (exceptHtmlElement: unknown = null) => {
      audioRequestIdRef.current += 1;
      cancelBrowserVoice();
      pauseOtherHtmlMedia(exceptHtmlElement);
      const current = activeAudioRef.current;
      activeAudioRef.current = null;
      setPlayingAudioKey(null);
      if (!current) return;
      try {
        await current.stopAsync();
      } catch {
        // The audio may already be stopped; unloading below is still the important part.
      }
      try {
        await current.unloadAsync();
      } catch {
        // Ignore unload errors from already released native resources.
      }
    },
    [pauseOtherHtmlMedia],
  );

  const playAudioUrl = useCallback(
    async (url: string | null | undefined, fallbackText?: string | null, key?: string) => {
      const normalizedUrl = String(url || '').trim();
      const normalizedFallback = String(fallbackText || '').trim();

      await stopCurrentAudio();
      const requestId = audioRequestIdRef.current;

      if (!normalizedUrl) {
        if (requestId === audioRequestIdRef.current) {
          speakWithBrowserVoice(normalizedFallback);
        }
        return;
      }

      const audioKey = key || normalizedUrl;
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          staysActiveInBackground: false,
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: normalizedUrl },
          { shouldPlay: true },
        );
        if (requestId !== audioRequestIdRef.current) {
          try {
            await sound.stopAsync();
          } catch {
            // The stale sound may not have started yet.
          }
          await sound.unloadAsync();
          return;
        }
        activeAudioRef.current = sound;
        setPlayingAudioKey(audioKey);
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded || !status.didJustFinish) return;
          void sound.unloadAsync();
          if (activeAudioRef.current === sound) {
            activeAudioRef.current = null;
            setPlayingAudioKey(null);
          }
        });
      } catch {
        if (requestId !== audioRequestIdRef.current) {
          return;
        }
        activeAudioRef.current = null;
        setPlayingAudioKey(null);
        speakWithBrowserVoice(normalizedFallback);
      }
    },
    [stopCurrentAudio],
  );

  useFocusEffect(
    useCallback(() => {
      void learnerSession.syncCurrentState({
        currentView: 'LearnerLessonScreen',
        currentActivityId: screen.id,
        statePayload: {
          moduleId,
          lessonId,
          screenIndex: safeIndex,
          screenTemplate: screen.screenTemplate,
        },
      });
      void learnerSession.recordProgress({
        activityId: screen.id,
        status: 'IN_PROGRESS',
      });
    }, [learnerSession, lessonId, moduleId, safeIndex, screen.id, screen.screenTemplate]),
  );

  useEffect(() => {
    void stopCurrentAudio();
    setDidFailImageLoad(false);
    setDidFailMediaLoad(false);
    setMediaAspectRatio(16 / 9);
    setMatchSelectedOptions({});
    setMatchCompletedIds([]);
    setMatchUnlockedIndex(0);
    setMatchWrongIds([]);
    setSelectedImageIds([]);
    setExerciseAttempts(0);
    setExerciseLocked(false);
    setRemoteLockWasObserved(false);
    setExerciseFeedback(null);
    setShowReinforcement(false);
    setReinforcementMessage(null);
    if (wrongSelectionTimeoutRef.current) {
      clearTimeout(wrongSelectionTimeoutRef.current);
      wrongSelectionTimeoutRef.current = null;
    }
    if (reinforcementTimeoutRef.current) {
      clearTimeout(reinforcementTimeoutRef.current);
      reinforcementTimeoutRef.current = null;
    }
  }, [screen.id, screen.mediaKind, screen.mediaUrl, screen.screenTemplate, stopCurrentAudio]);

  useEffect(() => {
    if (learnerSession.isLocked) {
      setRemoteLockWasObserved(true);
      return;
    }

    if (!remoteLockWasObserved || !exerciseLocked) {
      return;
    }

    setExerciseLocked(false);
    setExerciseAttempts(0);
    setExerciseFeedback({
      type: 'ok',
      message: 'Atividade liberada pelo alfabetizador. Voce ja pode continuar.',
    });
  }, [exerciseLocked, learnerSession.isLocked, remoteLockWasObserved]);

  useEffect(() => {
    return () => {
      if (wrongSelectionTimeoutRef.current) {
        clearTimeout(wrongSelectionTimeoutRef.current);
      }
      if (reinforcementTimeoutRef.current) {
        clearTimeout(reinforcementTimeoutRef.current);
      }
      const activeAudio = activeAudioRef.current;
      activeAudioRef.current = null;
      if (activeAudio) {
        void activeAudio.unloadAsync();
      }
    };
  }, []);

  const handleMediaReady = (event: unknown) => {
    const naturalSize = (event as { naturalSize?: { width?: number; height?: number } })?.naturalSize;
    const width = Number(naturalSize?.width ?? 0);
    const height = Number(naturalSize?.height ?? 0);
    const clampedRatio = clampAspectRatio(width, height);
    if (!clampedRatio) return;
    setMediaAspectRatio(clampedRatio);
  };

  const renderVideoPlayer = (mediaUrl: string) => {
    if (Platform.OS === 'web') {
      return createElement('video', {
        src: mediaUrl,
        controls: true,
        playsInline: true,
        preload: 'metadata',
        style: {
          width: '100%',
          height: '100%',
          display: 'block',
          backgroundColor: '#000000',
          objectFit: 'contain',
        },
        onLoadedMetadata: (event: {
          currentTarget?: {
            videoWidth?: number;
            videoHeight?: number;
          };
        }) => {
          const width = Number(event.currentTarget?.videoWidth ?? 0);
          const height = Number(event.currentTarget?.videoHeight ?? 0);
          const clampedRatio = clampAspectRatio(width, height);
          if (!clampedRatio) return;
          setMediaAspectRatio(clampedRatio);
        },
        onPlay: (event: { currentTarget?: unknown }) => {
          void stopCurrentAudio(event.currentTarget ?? null);
        },
        onError: () => setDidFailMediaLoad(true),
      });
    }

    return (
      <Video
        source={{ uri: mediaUrl }}
        style={styles.videoMedia}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        isLooping={false}
        onReadyForDisplay={handleMediaReady}
        onError={() => setDidFailMediaLoad(true)}
      />
    );
  };

  const renderAudioPlayer = (mediaUrl: string) => {
    // No web a tag <video> nao expoe controles utilizaveis para arquivos de
    // audio (renderiza apenas um retangulo cinza). Usamos a tag <audio> nativa
    // para ter o player com play/pausa/scrubber.
    if (Platform.OS === 'web') {
      return createElement('audio', {
        src: mediaUrl,
        controls: true,
        preload: 'metadata',
        style: {
          width: '100%',
          display: 'block',
        },
        onPlay: (event: { currentTarget?: unknown }) => {
          void stopCurrentAudio(event.currentTarget ?? null);
        },
        onError: () => setDidFailMediaLoad(true),
      });
    }

    return (
      <Video
        source={{ uri: mediaUrl }}
        style={styles.audioMedia}
        useNativeControls
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        isLooping={false}
        onError={() => setDidFailMediaLoad(true)}
      />
    );
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    if (safeIndex > 0) {
      navigation.replace('LearnerLessonScreen', {
        moduleId,
        lessonId,
        screenIndex: safeIndex - 1,
        moduleLabel,
        moduleTitle,
      });
      return;
    }

    navigation.navigate('LearnerLessonIntro', {
      moduleId,
      lessonId,
      moduleLabel,
      moduleTitle,
    });
  };

  const goNextDefault = () => {
    void learnerSession.recordProgress({
      activityId: screen.id,
      status: 'COMPLETED',
    });

    if (screen.followUpActivity) {
      navigation.push('LearnerLessonActivity', {
        moduleId,
        lessonId,
        screenIndex: safeIndex,
        moduleLabel,
        moduleTitle,
      });
      return;
    }

    if (safeIndex + 1 < totalScreens) {
      navigation.push('LearnerLessonScreen', {
        moduleId,
        lessonId,
        screenIndex: safeIndex + 1,
        moduleLabel,
        moduleTitle,
      });
      return;
    }

    navigation.push('LearnerLessonConclusion', { moduleId, lessonId, moduleLabel, moduleTitle });
  };

  const buildHelpSnapshot = (): LearnerScreenSnapshot => ({
    moduleId,
    lessonId,
    moduleLabel,
    moduleTitle,
    lessonTitle: lesson.title,
    screenIndex: safeIndex,
    totalScreens,
    // Por enquanto so a Etapa 2 esta no mobile. O painel pode consumir esse
    // campo como pista, mas nao depende dele.
    stage: '2',
    screenId: screen.id,
    screenTitle: screen.title,
    screenTemplate: screen.screenTemplate,
    mediaUrl: screen.mediaUrl,
    mediaKind: screen.mediaKind,
    learnerSpeech: screen.learnerSpeech,
    highlightMessage: screen.highlightMessage,
    exercise: screen.exercise ?? null,
  });

  const lockCurrentExercise = (message: string) => {
    const nextAttempts = Math.max(exerciseAttempts, screen.exercise?.maxAttemptsBeforeLock ?? 1);
    setExerciseLocked(true);
    setExerciseFeedback({
      type: 'error',
      message,
    });
    void learnerSession.recordProgress({
      activityId: screen.id,
      status: 'LOCKED',
      attempts: nextAttempts,
      errorsCount: nextAttempts,
      maxAttempts: screen.exercise?.maxAttemptsBeforeLock,
      lockReason: message,
    });
    void learnerSession.requestHelp(message, buildHelpSnapshot());
  };

  const canAdvanceMatchExercise =
    screen.screenTemplate === 'exercise-match-letter' &&
    screen.exercise &&
    screen.exercise.items.length > 0 &&
    screen.exercise.items.every((item) => completedMatchSet.has(item.id)) &&
    !isInteractionLocked;

  const canAdvanceMarkImagesExercise =
    screen.screenTemplate === 'exercise-mark-images' &&
    screen.exercise &&
    selectedImageCount === expectedSelections &&
    !isInteractionLocked;

  const triggerErrorReinforcement = (fallbackMessage: string) => {
    const config = screen.exercise?.errorReinforcement;
    if (!config) {
      return false;
    }

    if (!config.preserveProgress) {
      setMatchCompletedIds([]);
      setMatchUnlockedIndex(0);
      setSelectedImageIds([]);
    }

    if (reinforcementTimeoutRef.current) {
      clearTimeout(reinforcementTimeoutRef.current);
    }

    const reinforcementText = config.instructionText || fallbackMessage;
    setReinforcementMessage(reinforcementText);
    setShowReinforcement(true);

    if (config.instructionAudioUrl) {
      void playAudioUrl(config.instructionAudioUrl, reinforcementText, 'reinforcement');
    }

    reinforcementTimeoutRef.current = setTimeout(() => {
      setShowReinforcement(false);
    }, Math.max(500, config.autoReturnMs));

    return true;
  };

  const handleMatchOptionPress = (itemIndex: number, itemId: string, option: string) => {
    if (screen.screenTemplate !== 'exercise-match-letter' || !screen.exercise || isInteractionLocked) {
      return;
    }
    if (screen.exercise.progressiveUnlock && itemIndex > matchUnlockedIndex) {
      return;
    }

    const item = screen.exercise.items[itemIndex];
    const normalizedOption = String(option).toUpperCase();
    const isCorrect = item.correctOptions.includes(normalizedOption);

    setMatchSelectedOptions((previous) => ({
      ...previous,
      [itemId]: normalizedOption,
    }));

    if (isCorrect) {
      setMatchCompletedIds((previous) => (previous.includes(itemId) ? previous : [...previous, itemId]));
      if (screen.exercise.progressiveUnlock) {
        setMatchUnlockedIndex((previous) => Math.max(previous, itemIndex + 1));
      }
      setExerciseFeedback({
        type: 'ok',
        message: screen.exercise.successFeedback || 'Correto!',
      });
      return;
    }

    setMatchWrongIds((previous) => [...previous.filter((id) => id !== itemId), itemId]);

    if (wrongSelectionTimeoutRef.current) {
      clearTimeout(wrongSelectionTimeoutRef.current);
    }
    wrongSelectionTimeoutRef.current = setTimeout(() => {
      setMatchSelectedOptions((previous) => {
        const next = { ...previous };
        delete next[itemId];
        return next;
      });
      setMatchWrongIds((previous) => previous.filter((id) => id !== itemId));
    }, 1000);

    const nextAttempts = exerciseAttempts + 1;
    setExerciseAttempts(nextAttempts);
    if (nextAttempts >= screen.exercise.maxAttemptsBeforeLock) {
      lockCurrentExercise(resolveLockMessage(screen.lockReason, screen.lockMessage));
      return;
    }

    const fallbackMessage = screen.exercise.errorFeedback || 'Tente outra posicao.';
    const hasReinforcement = triggerErrorReinforcement(fallbackMessage);
    setExerciseFeedback({
      type: 'error',
      message: hasReinforcement ? 'Revendo orientacao. Aguarde para tentar novamente.' : fallbackMessage,
    });
  };

  const handleToggleMarkImageItem = (itemId: string) => {
    if (screen.screenTemplate !== 'exercise-mark-images' || !screen.exercise || isInteractionLocked) {
      return;
    }
    setSelectedImageIds((previous) => {
      if (previous.includes(itemId)) {
        return previous.filter((value) => value !== itemId);
      }
      if (previous.length >= expectedSelections) {
        return previous;
      }
      return [...previous, itemId];
    });
    setExerciseFeedback(null);
  };

  const handleInstructionAudioPress = () => {
    const instructionUrl = screen.exercise?.instructionAudioUrl;
    const fallbackInstruction =
      screen.exercise?.instructionText || 'Escute o audio e marque a letra correta.';
    void playAudioUrl(instructionUrl, fallbackInstruction, `instruction-${screen.id}`);
  };

  const onNext = () => {
    if (showReinforcement) {
      setExerciseFeedback({
        type: 'error',
        message: 'Aguarde o termino da tela de reforco para continuar.',
      });
      return;
    }

    if (learnerSession.isLocked) {
      setExerciseFeedback({
        type: 'error',
        message: 'Sessao bloqueada pelo alfabetizador. Aguarde orientacao para continuar.',
      });
      return;
    }

    if (isLockedByTemplate) {
      setExerciseFeedback({
        type: 'error',
        message: resolveLockMessage(screen.lockReason, screen.lockMessage),
      });
      return;
    }

    if (screen.screenTemplate === 'exercise-match-letter') {
      if (!canAdvanceMatchExercise) {
        setExerciseFeedback({
          type: 'error',
          message:
            isInteractionLocked
              ? resolveLockMessage(screen.lockReason, screen.lockMessage)
              : 'Conclua todas as respostas para avancar.',
        });
        return;
      }
      goNextDefault();
      return;
    }

    if (screen.screenTemplate === 'exercise-mark-images' && screen.exercise) {
      if (!canAdvanceMarkImagesExercise) {
        setExerciseFeedback({
          type: 'error',
          message: `Selecione exatamente ${expectedSelections} caixa(s) para liberar o avancar.`,
        });
        return;
      }

      const selectedSet = new Set(selectedImageIds);
      const correctSet = new Set(
        screen.exercise.items.filter((item) => item.isCorrectTarget).map((item) => item.id),
      );
      const hasOnlyCorrectSelections = [...selectedSet].every((itemId) => correctSet.has(itemId));
      const isCorrect = hasOnlyCorrectSelections && selectedSet.size === expectedSelections;

      if (isCorrect) {
        setExerciseFeedback({
          type: 'ok',
          message: screen.exercise.successFeedback || 'Muito bem! Avancando para a proxima tela.',
        });
        goNextDefault();
        return;
      }

      const nextAttempts = exerciseAttempts + 1;
      setExerciseAttempts(nextAttempts);
      if (nextAttempts >= screen.exercise.maxAttemptsBeforeLock) {
        lockCurrentExercise(resolveLockMessage(screen.lockReason, screen.lockMessage));
        return;
      }

      setExerciseFeedback({
        type: 'error',
        message: screen.exercise.errorFeedback || 'Ainda nao foi desta vez. Tente novamente.',
      });
      return;
    }

    goNextDefault();
  };

  const renderExerciseContent = () => {
    if (!screen.exercise) return null;

    if (screen.screenTemplate === 'exercise-match-letter') {
      return (
        <View style={styles.exerciseCard}>
          {/* Botão de áudio de instrução — ícone grande centralizado */}
          <View style={styles.instructionAudioRow}>
            <SpeakerButton
              onPress={handleInstructionAudioPress}
              large
              active={playingAudioKey === `instruction-${screen.id}`}
            />
          </View>

          {screen.exercise.items.map((item, itemIndex) => {
            const isCompleted = completedMatchSet.has(item.id);
            const isWrongFlash = matchWrongIds.includes(item.id);
            const selectedLetter = matchSelectedOptions[item.id];
            const word = String(item.label || '').toUpperCase();
            const wordLetters = word.split('').filter(Boolean);
            const audioUrl = item.wordAudioUrl || item.audioUrl;
            const isEnabled = !isInteractionLocked;

            return (
              <View key={item.id} style={styles.matchItem}>
                {/* Imagem com badge de status + botão speaker */}
                <View style={styles.matchItemTopRow}>
                  <View style={styles.matchImageWrap}>
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.matchItemImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={styles.matchItemImageFallback}>
                        <Text style={styles.matchItemImageFallbackText}>{word.slice(0, 1)}</Text>
                      </View>
                    )}
                    {isCompleted ? (
                      <View style={[styles.itemStatusBadge, styles.itemStatusBadgeOk]}>
                        <Text style={styles.itemStatusBadgeText}>✓</Text>
                      </View>
                    ) : isWrongFlash ? (
                      <View style={[styles.itemStatusBadge, styles.itemStatusBadgeErr]}>
                        <Text style={styles.itemStatusBadgeText}>✗</Text>
                      </View>
                    ) : null}
                  </View>
                  <SpeakerButton
                    onPress={() => {
                      void playAudioUrl(audioUrl, item.label, `word-${item.id}`);
                    }}
                    active={playingAudioKey === `word-${item.id}`}
                  />
                </View>

                {/* Quadrados posicionais — um por letra da palavra */}
                <View style={styles.squaresRow}>
                  {wordLetters.map((letter, squareIndex) => {
                    const isWrongSquare =
                      isWrongFlash &&
                      Boolean(selectedLetter) &&
                      wordLetters.indexOf(selectedLetter) === squareIndex;
                    const isTargetLetter = isCompleted && item.correctOptions.includes(letter);

                    return (
                      <Pressable
                        key={`${item.id}-sq-${squareIndex}`}
                        onPress={() => handleMatchOptionPress(itemIndex, item.id, letter)}
                        disabled={!isEnabled || isCompleted}
                        hitSlop={4}
                        style={[
                          styles.letterSquare,
                          isWrongSquare ? styles.letterSquareWrong : null,
                          isCompleted ? styles.letterSquareFilled : null,
                          isCompleted && isTargetLetter ? styles.letterSquareTarget : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.letterSquareText,
                            isCompleted ? styles.letterSquareTextFilled : null,
                            isCompleted && isTargetLetter ? styles.letterSquareTextTarget : null,
                          ]}
                        >
                          {isCompleted ? letter : ''}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      );
    }

    if (screen.screenTemplate === 'exercise-mark-images') {
      return (
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseTopRow}>
            <Text style={styles.exerciseTitle}>
              {screen.exercise.instructionText || 'Marque as imagens corretas para continuar.'}
            </Text>
            {isInstructionAudioButtonVisible(screen.exercise) ? (
              <SpeakerButton
                onPress={handleInstructionAudioPress}
                active={playingAudioKey === `instruction-${screen.id}`}
              />
            ) : null}
          </View>

          <Text style={styles.selectionHint}>
            Selecione {expectedSelections} imagem(ns). Selecionado: {selectedImageCount}
          </Text>

          <View style={styles.markGrid}>
            {screen.exercise.items.map((item, itemIndex) => {
              const isSelected = selectedImageIds.includes(item.id);
              const visibleLabel = getLearnerVisibleExerciseLabel(item.label, itemIndex);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleToggleMarkImageItem(item.id)}
                  disabled={isInteractionLocked}
                  hitSlop={8}
                  style={[styles.markItem, isSelected ? styles.markItemSelected : null]}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.markItemImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.markItemFallback}>
                      <Text style={styles.markItemFallbackText}>
                        {(visibleLabel || `Imagem ${itemIndex + 1}`).slice(0, 1)}
                      </Text>
                    </View>
                  )}
                  {visibleLabel ? <Text style={styles.markItemLabel}>{visibleLabel}</Text> : null}
                  <View style={[styles.markIndicator, isSelected ? styles.markIndicatorSelected : null]} />
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <LearnerScreenLayout
      activeMenu="acompanhar"
      onMenuHome={() => navigation.navigate('LearnerHome')}
      onMenuTrack={() => navigation.navigate('LearnerHome')}
      onMenuTutorial={() => navigation.navigate('LearnerHome')}
      onMenuScore={() => navigation.navigate('LearnerHome')}
      onMenuProfile={() => navigation.navigate('LearnerHome')}
      roleLabel="alfabetizando"
      isSessionLocked={learnerSession.isLocked}
      onRequestHelp={() => learnerSession.requestHelp('Preciso de ajuda para continuar nesta tela.', buildHelpSnapshot())}
      helpAcknowledgedAt={learnerSession.helpAcknowledgedAt}
      isHelpPending={learnerSession.isHelpPending}
      sessionErrorMessage={learnerSession.errorMessage}
    >
      <View style={styles.wrapper}>
        <View style={styles.progressHeader}>
          <Text style={styles.path}>{moduleLabel} - {lesson.title}</Text>
          <Text style={styles.count}>
            {safeIndex + 1} de {totalScreens}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <Text style={styles.title}>{screen.title}</Text>

        {shouldRenderDefaultMedia && screen.mediaUrl && screen.mediaKind === 'image' && !didFailImageLoad ? (
          <Image
            source={{ uri: screen.mediaUrl }}
            style={styles.imageMedia}
            resizeMode="cover"
            onError={() => setDidFailImageLoad(true)}
          />
        ) : null}

        {shouldRenderDefaultMedia && screen.mediaKind === 'image' && didFailImageLoad ? (
          <View style={styles.mediaCard}>
            <Text style={styles.mediaLabel}>Imagem da aula</Text>
            <Text style={styles.mediaErrorText}>Nao foi possivel carregar este asset. Verifique o link no CMS.</Text>
          </View>
        ) : null}

        {shouldRenderDefaultMedia && screen.mediaUrl && (screen.mediaKind === 'video' || screen.mediaKind === 'audio') ? (
          <View style={styles.mediaCard}>
            <Text style={styles.mediaLabel}>{screen.mediaKind === 'video' ? 'Video da aula' : 'Audio da aula'}</Text>
            {screen.mediaKind === 'video' ? (
              <View style={[styles.videoFrame, { aspectRatio: mediaAspectRatio }]}>
                {renderVideoPlayer(screen.mediaUrl)}
              </View>
            ) : (
              renderAudioPlayer(screen.mediaUrl)
            )}
            {didFailMediaLoad ? <Text style={styles.mediaErrorText}>Nao foi possivel carregar esta midia automaticamente.</Text> : null}
          </View>
        ) : null}

        {screen.learnerSpeech && !screen.exercise ? (
          <View style={styles.studentCard}>
            <Text style={styles.studentText}>{screen.learnerSpeech}</Text>
          </View>
        ) : null}

        {renderExerciseContent()}

        {screen.highlightMessage ? (
          <View style={styles.highlightCard}>
            <Text style={styles.highlightText}>{screen.highlightMessage}</Text>
          </View>
        ) : null}

        {isLocked ? (
          <View style={styles.lockCard}>
            <Text style={styles.lockTitle}>Tela bloqueada</Text>
            <Text style={styles.lockText}>{resolveLockMessage(screen.lockReason, screen.lockMessage)}</Text>
            {screen.lockAudioUrl ? (
              <Pressable
                onPress={() => void playAudioUrl(screen.lockAudioUrl, resolveLockMessage(screen.lockReason, screen.lockMessage), 'lock')}
                style={styles.lockAudioButton}
              >
                <Text style={styles.lockAudioButtonText}>Ouvir orientacao</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {showReinforcement ? (
          <View style={styles.reinforcementCard}>
            <Text style={styles.reinforcementTitle}>Reforco de orientacao</Text>
            <Text style={styles.reinforcementText}>
              {reinforcementMessage || 'Revendo instrucoes. Aguarde para tentar novamente.'}
            </Text>
            {screen.exercise?.errorReinforcement?.instructionAudioUrl ? (
              <Pressable
                onPress={() =>
                  void playAudioUrl(
                    screen.exercise?.errorReinforcement?.instructionAudioUrl,
                    reinforcementMessage || screen.exercise?.errorReinforcement?.instructionText,
                    'reinforcement',
                  )
                }
                style={styles.reinforcementAudioButton}
              >
                <Text style={styles.reinforcementAudioButtonText}>Reproduzir audio</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {exerciseFeedback ? (
          <View
            style={[
              styles.feedbackCard,
              exerciseFeedback.type === 'ok' ? styles.feedbackCardSuccess : styles.feedbackCardError,
            ]}
          >
            <Text style={styles.feedbackText}>{exerciseFeedback.message}</Text>
          </View>
        ) : null}

        <LearnerActionButtons onBack={goBack} onNext={onNext} />
      </View>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  error: {
    color: learnerTheme.danger,
    fontSize: 14,
  },
  progressHeader: {
    display: 'none',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  path: {
    color: learnerTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  count: {
    color: learnerTheme.text,
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    display: 'none',
    height: 10,
    borderRadius: 8,
    backgroundColor: learnerTheme.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: learnerTheme.primary,
  },
  title: {
    marginTop: 2,
    fontSize: 18,
    color: learnerTheme.textStrong,
    fontWeight: '700',
  },
  imageMedia: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: learnerTheme.border,
  },
  mediaCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surface,
    padding: 12,
    gap: 6,
  },
  videoFrame: {
    width: '100%',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000000',
    minHeight: 180,
  },
  videoMedia: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
  },
  audioMedia: {
    width: '100%',
    height: 52,
    borderRadius: 8,
    backgroundColor: learnerTheme.surfaceMuted,
  },
  mediaLabel: {
    color: learnerTheme.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  mediaErrorText: {
    color: learnerTheme.textMuted,
    fontSize: 12,
  },
  tutorCard: {
    borderRadius: 14,
    backgroundColor: learnerTheme.tutorCardBg,
    borderWidth: 1,
    borderColor: learnerTheme.tutorCardBorder,
    padding: 12,
    gap: 4,
  },
  cardTitle: {
    color: learnerTheme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  cardText: {
    color: learnerTheme.text,
    fontSize: 14,
    lineHeight: 22,
  },
  studentCard: {
    borderRadius: 14,
    backgroundColor: learnerTheme.learnerCardBg,
    borderWidth: 1,
    borderColor: learnerTheme.learnerCardBorder,
    padding: 12,
    gap: 4,
  },
  studentTitle: {
    color: learnerTheme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  studentText: {
    color: learnerTheme.textStrong,
    fontSize: 14,
    lineHeight: 22,
  },
  highlightCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: learnerTheme.selectedBorder,
    backgroundColor: learnerTheme.selectedBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  highlightText: {
    textAlign: 'center',
    color: learnerTheme.selectedText,
    fontWeight: '700',
    fontSize: 14,
  },
  exerciseCard: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 4,
    gap: 14,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseTitle: {
    flex: 1,
    color: learnerTheme.text,
    fontSize: 13,
    fontWeight: '700',
  },
  audioButton: {
    width: 38,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioButtonText: {
    color: learnerTheme.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  // exercise-match-letter: botão de instrução grande centralizado
  instructionAudioRow: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 12,
  },
  largeAudioBtn: {
    width: 86,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioBtnActive: {
    opacity: 0.78,
    transform: [{ scale: 1.04 }],
  },
  audioBtnPressed: {
    opacity: 0.62,
    transform: [{ scale: 0.96 }],
  },
  audioBtnDisabled: {
    opacity: 0.35,
  },
  soundIcon: {
    minWidth: 30,
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundIconLarge: {
    minWidth: 56,
    height: 48,
  },
  soundCore: {
    width: 9,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#92d78b',
    marginRight: 2,
  },
  soundCoreLarge: {
    width: 15,
    height: 26,
    marginRight: 4,
    backgroundColor: '#35a632',
  },
  soundBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  soundBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: '#b8e4b3',
  },
  soundBarOne: {
    height: 10,
  },
  soundBarTwo: {
    height: 16,
  },
  soundBarThree: {
    height: 22,
  },
  soundBarLargeOne: {
    width: 4,
    height: 18,
    backgroundColor: '#52bb4d',
  },
  soundBarLargeTwo: {
    width: 4,
    height: 28,
    backgroundColor: '#35a632',
  },
  soundBarLargeThree: {
    width: 4,
    height: 38,
    backgroundColor: '#258b22',
  },
  // exercise-match-letter: item (imagem + quadrados)
  matchItem: {
    paddingHorizontal: 44,
    paddingVertical: 4,
    gap: 5,
    backgroundColor: 'transparent',
  },
  matchItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  matchImageWrap: {
    width: 54,
    height: 46,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchItemImage: {
    width: 54,
    height: 46,
  },
  matchItemImageFallback: {
    width: 48,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchItemImageFallbackText: {
    fontSize: 22,
    color: learnerTheme.primary,
    fontWeight: '700',
  },
  itemStatusBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: learnerTheme.surface,
  },
  itemStatusBadgeOk: {
    backgroundColor: learnerTheme.successBorder,
  },
  itemStatusBadgeErr: {
    backgroundColor: '#ef4444',
  },
  itemStatusBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 13,
  },
  itemSpeakerBtn: {
    width: 48,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Quadrados posicionais
  squaresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginLeft: 52,
  },
  letterSquare: {
    width: 29,
    height: 29,
    borderWidth: 1.5,
    borderColor: learnerTheme.border,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: learnerTheme.surface,
  },
  letterSquareWrong: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  letterSquareFilled: {
    borderColor: learnerTheme.successBorder,
    backgroundColor: learnerTheme.successBg,
  },
  letterSquareTarget: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef3c7',
  },
  letterSquareText: {
    fontSize: 15,
    fontWeight: '700',
    color: 'transparent',
  },
  letterSquareTextFilled: {
    color: learnerTheme.successText,
  },
  letterSquareTextTarget: {
    color: '#92400e',
  },
  selectionHint: {
    color: learnerTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  markGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  markItem: {
    width: '48%',
    borderWidth: 1,
    borderColor: learnerTheme.border,
    borderRadius: 10,
    backgroundColor: learnerTheme.surface,
    padding: 8,
    gap: 6,
    alignItems: 'center',
  },
  markItemSelected: {
    borderColor: learnerTheme.selectedBorder,
    backgroundColor: learnerTheme.selectedBg,
  },
  markItemImage: {
    width: 78,
    height: 78,
  },
  markItemFallback: {
    width: 78,
    height: 78,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markItemFallbackText: {
    fontSize: 24,
    color: learnerTheme.primary,
    fontWeight: '700',
  },
  markItemLabel: {
    color: learnerTheme.text,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  markIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surfaceMuted,
  },
  markIndicatorSelected: {
    borderColor: learnerTheme.primary,
    backgroundColor: learnerTheme.primary,
  },
  lockCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5b0b0',
    backgroundColor: '#fff2f2',
    padding: 12,
    gap: 4,
  },
  lockTitle: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '700',
  },
  lockText: {
    color: '#7f1d1d',
    fontSize: 13,
    lineHeight: 20,
  },
  lockAudioButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#f2b2b2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff8f8',
  },
  lockAudioButtonText: {
    color: '#9f1239',
    fontSize: 12,
    fontWeight: '700',
  },
  reinforcementCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: learnerTheme.selectedBorder,
    backgroundColor: learnerTheme.selectedBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  reinforcementTitle: {
    color: learnerTheme.selectedText,
    fontSize: 13,
    fontWeight: '700',
  },
  reinforcementText: {
    color: learnerTheme.text,
    fontSize: 12,
    lineHeight: 18,
  },
  reinforcementAudioButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: learnerTheme.selectedBorder,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: learnerTheme.surface,
  },
  reinforcementAudioButtonText: {
    color: learnerTheme.selectedText,
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  feedbackCardSuccess: {
    borderColor: '#9bc844',
    backgroundColor: '#f2f9df',
  },
  feedbackCardError: {
    borderColor: '#f5b0b0',
    backgroundColor: '#fff2f2',
  },
  feedbackText: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '600',
  },
});
