import { createElement, useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ResizeMode, Video } from 'expo-av';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import { LearnerRootStackParamList } from '../../types';
import { LearnerActionButtons } from './components/LearnerActionButtons';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { learnerTheme } from './learnerTheme';
import { useLearnerFlowData } from './learnerFlowData';
import { useLearnerSession } from './learnerSessionContext';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLessonActivity'>;

function clampAspectRatio(width: number, height: number) {
  if (width <= 0 || height <= 0) {
    return null;
  }

  const ratio = width / height;
  return Math.max(1.2, Math.min(2, ratio));
}

export function LearnerLessonActivityView({ navigation, route }: Props) {
  const { moduleId, lessonId, screenIndex, moduleLabel, moduleTitle } = route.params;
  const { getLesson } = useLearnerFlowData();
  const learnerSession = useLearnerSession();
  const lesson = getLesson(moduleId, lessonId);
  const [didFailImageLoad, setDidFailImageLoad] = useState(false);
  const [didFailMediaLoad, setDidFailMediaLoad] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState(16 / 9);

  if (!lesson) {
    return (
      <LearnerScreenLayout activeMenu="acompanhar" onMenuHome={() => navigation.navigate('LearnerHome')}>
        <Text style={styles.error}>Atividade nao encontrada.</Text>
      </LearnerScreenLayout>
    );
  }

  const totalScreens = lesson.screens.length;
  const safeIndex = Math.min(Math.max(screenIndex, 0), totalScreens - 1);
  const screen = lesson.screens[safeIndex];
  const activity = screen.followUpActivity;

  useFocusEffect(
    useCallback(() => {
      void learnerSession.syncCurrentState({
        currentView: 'LearnerLessonActivity',
        currentActivityId: activity?.id ?? screen.id,
        statePayload: {
          moduleId,
          lessonId,
          screenIndex: safeIndex,
        },
      });
    }, [activity?.id, learnerSession, lessonId, moduleId, safeIndex, screen.id]),
  );

  useEffect(() => {
    if (!activity) {
      navigation.replace('LearnerLessonScreen', {
        moduleId,
        lessonId,
        screenIndex: safeIndex,
        moduleLabel,
        moduleTitle,
      });
    }
  }, [activity, lessonId, moduleId, moduleLabel, moduleTitle, navigation, safeIndex]);

  useEffect(() => {
    setDidFailImageLoad(false);
    setDidFailMediaLoad(false);
    setMediaAspectRatio(16 / 9);
  }, [activity?.id, activity?.mediaKind, activity?.mediaUrl]);

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
          const nextRatio = clampAspectRatio(width, height);
          if (!nextRatio) return;
          setMediaAspectRatio(nextRatio);
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

  if (!activity) return null;

  const onBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('LearnerLessonScreen', {
      moduleId,
      lessonId,
      screenIndex: safeIndex,
      moduleLabel,
      moduleTitle,
    });
  };

  const onContinue = () => {
    if (learnerSession.isLocked) {
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
      onRequestHelp={() => learnerSession.requestHelp('Preciso de ajuda na atividade complementar.')}
      helpAcknowledgedAt={learnerSession.helpAcknowledgedAt}
      sessionErrorMessage={learnerSession.errorMessage}
    >
      <View style={styles.wrapper}>
        <Text style={styles.title}>{activity.title}</Text>

        {activity.mediaUrl && activity.mediaKind === 'image' && !didFailImageLoad ? (
          <Image
            source={{ uri: activity.mediaUrl }}
            style={styles.imageMedia}
            resizeMode="cover"
            onError={() => setDidFailImageLoad(true)}
          />
        ) : null}

        {activity.mediaKind === 'image' && didFailImageLoad ? (
          <View style={styles.mediaCard}>
            <Text style={styles.mediaLabel}>Imagem da atividade</Text>
            <Text style={styles.mediaErrorText}>Nao foi possivel carregar este asset. Verifique o link no CMS.</Text>
          </View>
        ) : null}

        {activity.mediaUrl && (activity.mediaKind === 'video' || activity.mediaKind === 'audio') ? (
          <View style={styles.mediaCard}>
            <Text style={styles.mediaLabel}>{activity.mediaKind === 'video' ? 'Video da atividade' : 'Audio da atividade'}</Text>
            {activity.mediaKind === 'video' ? (
              <View style={[styles.videoFrame, { aspectRatio: mediaAspectRatio }]}>
                {renderVideoPlayer(activity.mediaUrl)}
              </View>
            ) : (
              <Video
                source={{ uri: activity.mediaUrl }}
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

        {activity.completionMessage ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Muito bem!</Text>
            <Text style={styles.successText}>{activity.completionMessage}</Text>
          </View>
        ) : null}

        <LearnerActionButtons onBack={onBack} onNext={onContinue} nextLabel="CONTINUAR" />
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
  title: {
    marginTop: 6,
    fontSize: 21,
    color: learnerTheme.textStrong,
    fontWeight: '700',
  },
  imageMedia: {
    width: '100%',
    height: 220,
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
  tutorTitle: {
    color: learnerTheme.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  tutorText: {
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
  successCard: {
    borderRadius: 14,
    backgroundColor: learnerTheme.successBg,
    borderWidth: 1,
    borderColor: learnerTheme.successBorder,
    padding: 12,
    gap: 4,
  },
  successTitle: {
    color: learnerTheme.successText,
    fontSize: 17,
    fontWeight: '700',
  },
  successText: {
    color: learnerTheme.textStrong,
    fontSize: 14,
    lineHeight: 22,
  },
});
