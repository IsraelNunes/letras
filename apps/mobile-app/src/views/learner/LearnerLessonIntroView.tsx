import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { LearnerRootStackParamList } from '../../types';
import { LearnerActionButtons } from './components/LearnerActionButtons';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { learnerTheme } from './learnerTheme';
import { useLearnerFlowData } from './learnerFlowData';
import { useLearnerSession } from './learnerSessionContext';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLessonIntro'>;

export function LearnerLessonIntroView({ navigation, route }: Props) {
  const { moduleId, lessonId, moduleLabel, moduleTitle } = route.params;
  const { getLesson } = useLearnerFlowData();
  const learnerSession = useLearnerSession();
  const lesson = getLesson(moduleId, lessonId);

  useFocusEffect(
    useCallback(() => {
      void learnerSession.syncCurrentState({
        currentView: 'LearnerLessonIntro',
        currentActivityId: lessonId,
        statePayload: {
          moduleId,
          lessonId,
        },
      });
    }, [learnerSession, lessonId, moduleId]),
  );

  const startLesson = () => {
    if (learnerSession.isLocked) {
      return;
    }

    navigation.push('LearnerLessonScreen', {
      moduleId,
      lessonId,
      screenIndex: 0,
      moduleLabel,
      moduleTitle,
    });
  };

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('LearnerHome');
  };

  if (!lesson) {
    return (
      <LearnerScreenLayout activeMenu="acompanhar" onMenuHome={() => navigation.navigate('LearnerHome')}>
        <Text style={styles.error}>Aula nao encontrada.</Text>
      </LearnerScreenLayout>
    );
  }

  return (
    <LearnerScreenLayout
      activeMenu="acompanhar"
      onMenuHome={() => navigation.navigate('LearnerHome')}
      onMenuTrack={() => navigation.navigate('LearnerHome')}
      onMenuTutorial={() => navigation.navigate('LearnerHome')}
      onMenuScore={() => navigation.navigate('LearnerHome')}
      onMenuProfile={() => navigation.navigate('LearnerProfile')}
      roleLabel="alfabetizando"
      isSessionLocked={learnerSession.isLocked}
      onRequestHelp={() => learnerSession.requestHelp('Preciso de ajuda antes de iniciar esta aula.')}
      helpAcknowledgedAt={learnerSession.helpAcknowledgedAt}
      isHelpPending={learnerSession.isHelpPending}
      sessionErrorMessage={learnerSession.errorMessage}
    >
      <View style={styles.wrapper}>
        <Text style={styles.path}>{moduleLabel} - AULA 1</Text>
        <Text style={styles.title}>{lesson.title}</Text>

        <View style={styles.objectiveCard}>
          <Text style={styles.objectiveLabel}>OBJETIVO</Text>
          <Text style={styles.objectiveText}>{lesson.objective}</Text>
        </View>

        <View style={styles.messageCard}>
          <Text style={styles.messageText}>Bem-vindo a aula! Vamos comecar uma jornada incrivel pelo mundo das letras.</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{lesson.screens.length} telas nesta aula</Text>
          <Text style={styles.infoSub}>Avance no seu ritmo - sem pressa!</Text>
        </View>

        <LearnerActionButtons onBack={goBack} onNext={startLesson} nextLabel="INICIAR AULA" />
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
  path: {
    color: learnerTheme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 36 / 1.6,
    fontWeight: '700',
    color: learnerTheme.textStrong,
  },
  objectiveCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surface,
    padding: 14,
    gap: 4,
  },
  objectiveLabel: {
    color: learnerTheme.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  objectiveText: {
    color: learnerTheme.text,
    fontSize: 16,
    lineHeight: 22,
  },
  messageCard: {
    borderRadius: 14,
    backgroundColor: learnerTheme.surface,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    padding: 14,
  },
  messageText: {
    color: learnerTheme.text,
    fontSize: 16,
    lineHeight: 24,
  },
  infoCard: {
    borderRadius: 14,
    backgroundColor: learnerTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    padding: 14,
  },
  infoTitle: {
    color: learnerTheme.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  infoSub: {
    marginTop: 2,
    color: learnerTheme.text,
    fontSize: 13,
  },
});
