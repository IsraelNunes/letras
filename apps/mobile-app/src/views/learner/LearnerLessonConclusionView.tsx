import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { useCallback, useRef } from 'react';
import { LearnerRootStackParamList } from '../../types';
import { LearnerActionButtons } from './components/LearnerActionButtons';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { learnerTheme } from './learnerTheme';
import { useLearnerFlowData } from './learnerFlowData';
import { useLearnerSession } from './learnerSessionContext';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLessonConclusion'>;

export function LearnerLessonConclusionView({ navigation, route }: Props) {
  const { moduleId, lessonId, moduleLabel, moduleTitle } = route.params;
  const { getLesson, modules, completedLessonIds } = useLearnerFlowData();
  const learnerSession = useLearnerSession();

  const moduleData = modules.find((m) => m.id === moduleId);
  const totalLessons = moduleData?.lessons.length ?? 1;
  const lessonIndex = moduleData?.lessons.findIndex((l) => l.id === lessonId) ?? 0;
  // Conta quantas aulas do módulo já estão concluídas (incluindo a atual)
  const completedInModule = moduleData?.lessons.filter((l) => completedLessonIds.has(l.progressId)).length ?? 1;
  const progressPercent = Math.min(100, Math.round((completedInModule / totalLessons) * 100));
  const lesson = getLesson(moduleId, lessonId);
  const stageLabel = lesson?.stageNumber ? `Etapa ${lesson.stageNumber}` : null;
  // Garante que o POST /progress de conclusao da aula seja disparado
  // uma unica vez por entrada na tela de conclusao, mesmo que o
  // useFocusEffect rode multiplas vezes (re-render, foco recuperado).
  const completedRecordedRef = useRef<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void learnerSession.syncCurrentState({
        currentView: 'LearnerLessonConclusion',
        currentActivityId: lessonId,
        statePayload: {
          moduleId,
          lessonId,
        },
      });

      if (completedRecordedRef.current !== lessonId) {
        completedRecordedRef.current = lessonId;
        void learnerSession.recordProgress({
          activityId: lesson?.progressId ?? lessonId,
          status: 'COMPLETED',
        });
      }
    }, [learnerSession, lessonId, moduleId]),
  );

  if (!lesson) {
    return (
      <LearnerScreenLayout activeMenu="acompanhar" onMenuHome={() => navigation.navigate('LearnerHome')}>
        <Text style={styles.error}>Conclusão indisponível.</Text>
      </LearnerScreenLayout>
    );
  }

  const onBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('LearnerLessonScreen', {
      moduleId,
      lessonId,
      screenIndex: Math.max(lesson.screens.length - 1, 0),
      moduleLabel,
      moduleTitle,
    });
  };

  const onFinish = () => {
    if (learnerSession.isLocked) {
      return;
    }

    // Check if this lesson's stage is now fully completed
    const stageNumber = lesson?.stageNumber;
    if (stageNumber) {
      const allLessonsInStage = modules
        .flatMap((m) => m.lessons)
        .filter((l) => l.stageNumber === stageNumber);

      const alreadyCompleted = new Set([...completedLessonIds, lesson.progressId]);
      const stageFullyDone = allLessonsInStage.every((l) => alreadyCompleted.has(l.progressId));

      if (stageFullyDone) {
        navigation.navigate('LearnerStageConclusion', {
          stageNumber,
          stageTitle: `Etapa ${stageNumber}`,
        });
        return;
      }
    }

    if (navigation.canGoBack()) {
      navigation.popToTop();
      return;
    }
    navigation.navigate('LearnerHome');
  };

  return (
    <LearnerScreenLayout
      activeMenu="acompanhar"
      onMenuHome={() => navigation.navigate('LearnerHome')}
      onMenuTrack={() => navigation.navigate('LearnerHome')}
      onMenuTutorial={() => navigation.navigate('LearnerTutorials')}
      onMenuScore={() => navigation.navigate('LearnerScore')}
      onMenuProfile={() => navigation.navigate('LearnerProfile')}
      roleLabel="alfabetizando"
      learnerName={learnerSession.learnerName}
      stageLabel={stageLabel}
      isSessionLocked={learnerSession.isLocked}
      onRequestHelp={() => learnerSession.requestHelp('Preciso de ajuda para encerrar a aula.')}
      helpAcknowledgedAt={learnerSession.helpAcknowledgedAt}
      isHelpPending={learnerSession.isHelpPending}
      sessionErrorMessage={learnerSession.errorMessage}
    >
      <View style={styles.wrapper}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>★</Text>
        </View>

        <Text style={styles.title}>{lesson.conclusionTitle}</Text>
        <Text style={styles.subtitle}>{lesson.title}</Text>

        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{lesson.conclusionMessage}</Text>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{moduleTitle.toUpperCase()}</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {lessonIndex + 1} de {totalLessons} {totalLessons === 1 ? 'aula' : 'aulas'}
          </Text>
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.pointsText}>Aula concluída!</Text>
        </View>

        <Text style={styles.motivation}>Foco e dedicação levam longe!</Text>

        <LearnerActionButtons
          onBack={onBack}
          onNext={onFinish}
          nextLabel="VOLTAR AOS MÓDULOS"
        />
      </View>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
    alignItems: 'center',
  },
  error: {
    color: learnerTheme.danger,
    fontSize: 14,
  },
  iconWrap: {
    marginTop: 8,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: learnerTheme.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
    color: learnerTheme.successText,
    fontWeight: '700',
  },
  title: {
    fontSize: 34 / 1.6,
    color: learnerTheme.textStrong,
    fontWeight: '700',
  },
  subtitle: {
    color: learnerTheme.text,
    fontSize: 18 / 1.2,
  },
  messageCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surface,
    padding: 14,
  },
  messageText: {
    color: learnerTheme.text,
    fontSize: 18 / 1.2,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    backgroundColor: learnerTheme.surface,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    color: learnerTheme.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 8,
    backgroundColor: learnerTheme.border,
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: 10,
    backgroundColor: learnerTheme.primary,
  },
  progressText: {
    color: learnerTheme.text,
    fontSize: 14,
  },
  pointsCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: learnerTheme.warningBorder,
    backgroundColor: learnerTheme.warningBg,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  pointsText: {
    textAlign: 'center',
    color: learnerTheme.warningText,
    fontSize: 17 / 1.2,
    fontWeight: '700',
  },
  motivation: {
    marginTop: 4,
    color: learnerTheme.primary,
    fontSize: 16,
  },
});


