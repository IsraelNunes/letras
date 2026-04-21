import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ResizeMode, Video } from 'expo-av';
import { Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { LearnerRootStackParamList } from '../../types';
import { LearnerActionButtons } from './components/LearnerActionButtons';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { learnerTheme } from './learnerTheme';
import { useLearnerFlowData } from './learnerFlowData';
import { LearnerExerciseConfig } from './learnerFlowMapper';
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
  return Boolean(exercise?.instructionAudioUrl);
}

function clampAspectRatio(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const ratio = width / height;
  return Math.max(1.2, Math.min(2, ratio));
}

export function LearnerLessonScreenView({ navigation, route }: Props) {
  const { moduleId, lessonId, screenIndex, moduleLabel, moduleTitle } = route.params;
  const { getLesson } = useLearnerFlowData();
  const learnerSession = useLearnerSession();
  const lesson = getLesson(moduleId, lessonId);
  const wrongSelectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reinforcementTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [didFailImageLoad, setDidFailImageLoad] = useState(false);
  const [didFailMediaLoad, setDidFailMediaLoad] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState(16 / 9);

  const [matchSelectedOptions, setMatchSelectedOptions] = useState<Record<string, string>>({});
  const [matchCompletedIds, setMatchCompletedIds] = useState<string[]>([]);
  const [matchUnlockedIndex, setMatchUnlockedIndex] = useState(0);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [exerciseAttempts, setExerciseAttempts] = useState(0);
  const [exerciseLocked, setExerciseLocked] = useState(false);
  const [exerciseFeedback, setExerciseFeedback] = useState<ExerciseFeedback | null>(null);
  const [showReinforcement, setShowReinforcement] = useState(false);
  const [reinforcementMessage, setReinforcementMessage] = useState<string | null>(null);

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
    }, [learnerSession, lessonId, moduleId, safeIndex, screen.id, screen.screenTemplate]),
  );

  useEffect(() => {
    setDidFailImageLoad(false);
    setDidFailMediaLoad(false);
    setMediaAspectRatio(16 / 9);
    setMatchSelectedOptions({});
    setMatchCompletedIds([]);
    setMatchUnlockedIndex(0);
    setSelectedImageIds([]);
    setExerciseAttempts(0);
    setExerciseLocked(false);
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
  }, [screen.id, screen.mediaKind, screen.mediaUrl, screen.screenTemplate]);

  useEffect(() => {
    return () => {
      if (wrongSelectionTimeoutRef.current) {
        clearTimeout(wrongSelectionTimeoutRef.current);
      }
      if (reinforcementTimeoutRef.current) {
        clearTimeout(reinforcementTimeoutRef.current);
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
      void Linking.openURL(config.instructionAudioUrl);
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
        message: screen.exercise.successFeedback || 'Resposta correta. Continue.',
      });
      return;
    }

    if (wrongSelectionTimeoutRef.current) {
      clearTimeout(wrongSelectionTimeoutRef.current);
    }
    wrongSelectionTimeoutRef.current = setTimeout(() => {
      setMatchSelectedOptions((previous) => {
        const next = { ...previous };
        delete next[itemId];
        return next;
      });
    }, 800);

    const nextAttempts = exerciseAttempts + 1;
    setExerciseAttempts(nextAttempts);
    if (nextAttempts >= screen.exercise.maxAttemptsBeforeLock) {
      setExerciseLocked(true);
      setExerciseFeedback({
        type: 'error',
        message: resolveLockMessage(screen.lockReason, screen.lockMessage),
      });
      return;
    }

    const fallbackMessage = screen.exercise.errorFeedback || 'Resposta incorreta. Tente novamente.';
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
    if (!screen.exercise?.instructionAudioUrl) {
      return;
    }
    void Linking.openURL(screen.exercise.instructionAudioUrl);
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
        setExerciseLocked(true);
        setExerciseFeedback({
          type: 'error',
          message: resolveLockMessage(screen.lockReason, screen.lockMessage),
        });
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
          <View style={styles.exerciseTopRow}>
            <Text style={styles.exerciseTitle}>
              {screen.exercise.instructionText || 'Escute o audio e marque a letra correta.'}
            </Text>
            {isInstructionAudioButtonVisible(screen.exercise) ? (
              <Pressable onPress={handleInstructionAudioPress} style={styles.audioButton}>
                <Text style={styles.audioButtonText}>AUDIO</Text>
              </Pressable>
            ) : null}
          </View>

          {screen.exercise.items.map((item, itemIndex) => {
            const selectedOption = matchSelectedOptions[item.id];
            const isCompleted = completedMatchSet.has(item.id);
            const isEnabled =
              !isInteractionLocked &&
              (!screen.exercise?.progressiveUnlock || itemIndex <= matchUnlockedIndex);
            const itemOptions = item.options.length > 0 ? item.options : ['A'];
            const wordAudioUrl = item.wordAudioUrl || item.audioUrl;
            const spellingAudioUrl = item.spellingAudioUrl;

            return (
              <View key={item.id} style={[styles.matchRow, !isEnabled ? styles.rowDisabled : null]}>
                <View style={styles.matchMediaColumn}>
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.matchImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.matchImageFallback}>
                      <Text style={styles.matchImageFallbackText}>{item.label.slice(0, 1)}</Text>
                    </View>
                  )}
                  <Text style={styles.matchWord}>{item.label}</Text>
                </View>

                <View style={styles.matchOptions}>
                  {itemOptions.map((option) => {
                    const normalizedOption = String(option).toUpperCase();
                    const isOptionSelected = selectedOption === normalizedOption;
                    const isOptionCorrect = item.correctOptions.includes(normalizedOption);
                    return (
                      <Pressable
                        key={`${item.id}-${normalizedOption}`}
                        onPress={() => handleMatchOptionPress(itemIndex, item.id, normalizedOption)}
                        disabled={!isEnabled}
                        style={[
                          styles.optionButton,
                          isOptionSelected ? styles.optionButtonSelected : null,
                          isOptionSelected && isOptionCorrect ? styles.optionButtonCorrect : null,
                        ]}
                      >
                        <Text style={styles.optionText}>{normalizedOption}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.matchStatusColumn}>
                  {wordAudioUrl ? (
                    <Pressable onPress={() => void Linking.openURL(wordAudioUrl)} style={styles.smallAudioButton}>
                      <Text style={styles.smallAudioButtonText}>PAL</Text>
                    </Pressable>
                  ) : null}
                  {spellingAudioUrl ? (
                    <Pressable
                      onPress={() => void Linking.openURL(spellingAudioUrl)}
                      style={[styles.smallAudioButton, styles.smallAudioButtonSecondary]}
                    >
                      <Text style={[styles.smallAudioButtonText, styles.smallAudioButtonTextSecondary]}>LET</Text>
                    </Pressable>
                  ) : null}
                  {isCompleted ? (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>OK</Text>
                    </View>
                  ) : null}
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
              <Pressable onPress={handleInstructionAudioPress} style={styles.audioButton}>
                <Text style={styles.audioButtonText}>AUDIO</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.selectionHint}>
            Selecione {expectedSelections} imagem(ns). Selecionado: {selectedImageCount}
          </Text>

          <View style={styles.markGrid}>
            {screen.exercise.items.map((item) => {
              const isSelected = selectedImageIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => handleToggleMarkImageItem(item.id)}
                  disabled={isInteractionLocked}
                  style={[styles.markItem, isSelected ? styles.markItemSelected : null]}
                >
                  {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.markItemImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.markItemFallback}>
                      <Text style={styles.markItemFallbackText}>{item.label.slice(0, 1)}</Text>
                    </View>
                  )}
                  <Text style={styles.markItemLabel}>{item.label}</Text>
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
      roleLabel="alfabetizador"
      isSessionLocked={learnerSession.isLocked}
      onRequestHelp={() => learnerSession.requestHelp('Preciso de ajuda para continuar nesta tela.')}
      helpAcknowledgedAt={learnerSession.helpAcknowledgedAt}
      sessionErrorMessage={learnerSession.errorMessage}
    >
      <View style={styles.wrapper}>
        <View style={styles.progressHeader}>
          <Text style={styles.path}>{moduleLabel} - Aula 1</Text>
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
              <Video
                source={{ uri: screen.mediaUrl }}
                style={styles.audioMedia}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={false}
                isLooping={false}
                onError={() => setDidFailMediaLoad(true)}
              />
            )}
            {didFailMediaLoad ? <Text style={styles.mediaErrorText}>Nao foi possivel carregar esta midia automaticamente.</Text> : null}
          </View>
        ) : null}

        {renderExerciseContent()}

        {screen.educatorGuidance ? (
          <View style={styles.tutorCard}>
            <Text style={styles.cardTitle}>Orientacao para o Alfabetizador</Text>
            <Text style={styles.cardText}>{screen.educatorGuidance}</Text>
          </View>
        ) : null}

        {screen.learnerSpeech ? (
          <View style={styles.studentCard}>
            <Text style={styles.studentTitle}>Fala sugerida para o Alfabetizando</Text>
            <Text style={styles.studentText}>{screen.learnerSpeech}</Text>
          </View>
        ) : null}

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
              <Pressable onPress={() => void Linking.openURL(screen.lockAudioUrl!)} style={styles.lockAudioButton}>
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
                onPress={() => void Linking.openURL(screen.exercise?.errorReinforcement?.instructionAudioUrl!)}
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
    gap: 10,
  },
  error: {
    color: learnerTheme.danger,
    fontSize: 14,
  },
  progressHeader: {
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
    marginTop: 8,
    fontSize: 21,
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
    color: learnerTheme.warningText,
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
    borderColor: learnerTheme.warningBorder,
    backgroundColor: learnerTheme.warningBg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  highlightText: {
    textAlign: 'center',
    color: learnerTheme.warningText,
    fontWeight: '700',
    fontSize: 14,
  },
  exerciseCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surface,
    padding: 12,
    gap: 10,
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
    borderWidth: 1,
    borderColor: learnerTheme.primary,
    backgroundColor: learnerTheme.primarySoft,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  audioButtonText: {
    color: learnerTheme.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  matchRow: {
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surface,
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowDisabled: {
    opacity: 0.58,
  },
  matchMediaColumn: {
    width: 74,
    alignItems: 'center',
    gap: 4,
  },
  matchImage: {
    width: 60,
    height: 60,
  },
  matchImageFallback: {
    width: 60,
    height: 60,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchImageFallbackText: {
    fontSize: 24,
    color: learnerTheme.primary,
    fontWeight: '700',
  },
  matchWord: {
    fontSize: 11,
    color: learnerTheme.textMuted,
    fontWeight: '600',
    textAlign: 'center',
  },
  matchOptions: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  optionButton: {
    minWidth: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonSelected: {
    borderColor: learnerTheme.warningBorder,
    backgroundColor: learnerTheme.warningBg,
  },
  optionButtonCorrect: {
    borderColor: learnerTheme.successBorder,
    backgroundColor: learnerTheme.successBg,
  },
  optionText: {
    color: learnerTheme.text,
    fontSize: 14,
    fontWeight: '700',
  },
  matchStatusColumn: {
    width: 42,
    alignItems: 'center',
    gap: 4,
  },
  smallAudioButton: {
    minWidth: 34,
    height: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: learnerTheme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: learnerTheme.primarySoft,
    paddingHorizontal: 4,
  },
  smallAudioButtonText: {
    color: learnerTheme.primary,
    fontSize: 9,
    fontWeight: '700',
  },
  smallAudioButtonSecondary: {
    borderColor: learnerTheme.warningBorder,
    backgroundColor: learnerTheme.warningBg,
  },
  smallAudioButtonTextSecondary: {
    color: learnerTheme.warningText,
  },
  doneBadge: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: learnerTheme.successBorder,
    backgroundColor: learnerTheme.successBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  doneBadgeText: {
    color: learnerTheme.successText,
    fontSize: 10,
    fontWeight: '700',
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
    borderColor: learnerTheme.warningBorder,
    backgroundColor: learnerTheme.warningBg,
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
    borderColor: '#f5d38b',
    backgroundColor: '#fff8df',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  reinforcementTitle: {
    color: '#7a4b00',
    fontSize: 13,
    fontWeight: '700',
  },
  reinforcementText: {
    color: '#5c3a00',
    fontSize: 12,
    lineHeight: 18,
  },
  reinforcementAudioButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#f1c15e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#fff2cc',
  },
  reinforcementAudioButtonText: {
    color: '#6b4700',
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
    borderColor: '#f2b58d',
    backgroundColor: '#fff2e8',
  },
  feedbackText: {
    color: '#1f2937',
    fontSize: 13,
    fontWeight: '600',
  },
});
