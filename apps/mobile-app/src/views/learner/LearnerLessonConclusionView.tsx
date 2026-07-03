import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useCallback, useRef } from 'react';
import { LearnerRootStackParamList } from '../../types';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { learnerTheme } from './learnerTheme';
import { useLearnerFlowData } from './learnerFlowData';
import { useLearnerSession } from './learnerSessionContext';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLessonConclusion'>;

// O Figma NÃO tem tela de conclusão por aula — só por etapa ("Etapa N -
// Conclusão"). Esta rota é uma transição: grava o progresso da aula e
// encaminha para a Conclusão de etapa (quando a etapa fechou) ou de volta
// aos módulos, sem UI própria além de um breve indicador.
const TRANSITION_DELAY_MS = 700;

export function LearnerLessonConclusionView({ navigation, route }: Props) {
  const { moduleId, lessonId } = route.params;
  const { getLesson, modules, completedLessonIds } = useLearnerFlowData();
  const learnerSession = useLearnerSession();

  const lesson = getLesson(moduleId, lessonId);
  // Garante que o POST /progress e a navegação rodem uma única vez por
  // entrada na tela, mesmo com múltiplos disparos do useFocusEffect.
  const completedRecordedRef = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolveNextStep = useCallback(() => {
    if (!lesson) {
      navigation.navigate('LearnerHome');
      return;
    }

    const stageNumber = lesson.stageNumber;
    if (stageNumber) {
      const allLessonsInStage =
        modules.find((m) => m.id === moduleId)?.lessons.filter((l) => l.stageNumber === stageNumber) ?? [];
      const alreadyCompleted = new Set([...completedLessonIds, lesson.progressId]);
      const stageFullyDone =
        allLessonsInStage.length > 0 && allLessonsInStage.every((l) => alreadyCompleted.has(l.progressId));

      if (stageFullyDone) {
        navigation.replace('LearnerStageConclusion', {
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
  }, [completedLessonIds, lesson, moduleId, modules, navigation]);

  useFocusEffect(
    useCallback(() => {
      void learnerSession.syncCurrentState({
        currentView: 'LearnerLessonConclusion',
        currentActivityId: lessonId,
        statePayload: {
          moduleId,
          lessonId,
          // Snapshot parcial (Fase 1): sinaliza ao espelho do educador que o
          // aprendiz concluiu a aula.
          snapshot: {
            moduleId,
            lessonId,
            lessonTitle: lesson?.title ?? null,
            screenTitle: lesson?.conclusionTitle ?? 'Aula concluída',
            totalScreens: lesson?.screens.length,
            stage: lesson?.stageNumber ? String(lesson.stageNumber) : undefined,
            screenTemplate: 'lesson-conclusion',
          },
        },
      });

      if (completedRecordedRef.current !== lessonId) {
        completedRecordedRef.current = lessonId;
        void learnerSession.recordProgress({
          activityId: lesson?.progressId ?? lessonId,
          status: 'COMPLETED',
        });
      }

      // (Re)arma a navegação em TODA execução do efeito: o registro do
      // progresso atualiza o estado do fluxo, o efeito re-executa e o
      // cleanup cancela o timeout anterior — sem rearmar aqui a tela
      // ficava carregando para sempre.
      navigationTimeoutRef.current = setTimeout(resolveNextStep, TRANSITION_DELAY_MS);

      return () => {
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
      };
    }, [learnerSession, lesson, lessonId, moduleId, resolveNextStep]),
  );

  if (!lesson) {
    return (
      <LearnerScreenLayout activeMenu="inicio" onMenuHome={() => navigation.navigate('LearnerHome')}>
        <Text style={styles.error}>Conclusão indisponível.</Text>
      </LearnerScreenLayout>
    );
  }

  return (
    <LearnerScreenLayout minimalChrome>
      <View style={styles.wrapper}>
        <ActivityIndicator color={learnerTheme.primary} size="large" />
      </View>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 120,
    alignItems: 'center',
  },
  error: {
    color: learnerTheme.danger,
    fontSize: 14,
  },
});
