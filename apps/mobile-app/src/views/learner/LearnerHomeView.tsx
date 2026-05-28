import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LearnerRootStackParamList } from '../../types';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { learnerTheme } from './learnerTheme';
import { useLearnerFlowData } from './learnerFlowData';
import { useLearnerSession } from './learnerSessionContext';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerHome'>;

export function LearnerHomeView({ navigation }: Props) {
  const { modules, loading, error, refresh } = useLearnerFlowData();
  const learnerSession = useLearnerSession();

  useFocusEffect(
    useCallback(() => {
      void learnerSession.syncCurrentState({
        currentView: 'LearnerHome',
        statePayload: {
          modulesCount: modules.length,
        },
      });
    }, [learnerSession, modules.length]),
  );

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
      onRequestHelp={() => learnerSession.requestHelp('Preciso de apoio para seguir na aula inicial.')}
      helpAcknowledgedAt={learnerSession.helpAcknowledgedAt}
      isHelpPending={learnerSession.isHelpPending}
      sessionErrorMessage={learnerSession.errorMessage}
    >
      <View style={styles.wrapper}>
        {loading ? <Text style={styles.helper}>Carregando aulas...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && modules.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Nenhum conteúdo publicado</Text>
            <Text style={styles.emptyStateText}>
              Crie no painel um tema, depois um módulo e as telas da aula com os áudios, imagens e interações.
            </Text>
            <Pressable style={styles.retryButton} onPress={() => void refresh()}>
              <Text style={styles.retryText}>Recarregar conteúdo</Text>
            </Pressable>
          </View>
        ) : null}

        {modules.map((moduleItem, moduleIndex) => {
          const firstLesson = moduleItem.lessons[0] ?? null;
          const moduleLabel = firstLesson?.moduleLabel ?? `MÓDULO ${moduleIndex + 1}`;
          return (
            <View key={moduleItem.id} style={styles.moduleBlock}>
              <Text style={styles.moduleLabel}>{moduleLabel}</Text>
              <Text style={styles.moduleTitle}>{moduleItem.title}</Text>
              <Text style={styles.moduleSubtitle}>{moduleItem.subtitle}</Text>

              {firstLesson ? (
                <Pressable
                  style={styles.lessonCard}
                  hitSlop={8}
                  onPress={() =>
                    navigation.navigate('LearnerLessonIntro', {
                      moduleId: moduleItem.id,
                      lessonId: firstLesson.id,
                      moduleLabel,
                      moduleTitle: moduleItem.title,
                    })
                  }
                >
                  <View style={styles.lessonBody}>
                    <Text style={styles.lessonTitle}>{firstLesson.title}</Text>
                    <Text style={styles.lessonSubtitle}>{firstLesson.objective}</Text>
                    <Text style={styles.lessonCount}>{firstLesson.screens.length} telas</Text>
                  </View>
                  <View style={styles.lessonAction}>
                    <Text style={styles.lessonActionText}>Abrir</Text>
                  </View>
                </Pressable>
              ) : null}
            </View>
          );
        })}

        <View style={styles.motivationBox}>
          <Text style={styles.motivationText}>Cada aula é um passo a mais na sua jornada.</Text>
        </View>
      </View>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 18,
  },
  helper: {
    color: learnerTheme.textStrong,
    fontSize: 14,
  },
  error: {
    color: learnerTheme.danger,
    fontSize: 13,
  },
  emptyState: {
    borderRadius: 14,
    backgroundColor: learnerTheme.surface,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    paddingHorizontal: 14,
    paddingVertical: 16,
    gap: 10,
  },
  emptyStateTitle: {
    color: learnerTheme.textStrong,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyStateText: {
    color: learnerTheme.text,
    fontSize: 14,
    lineHeight: 20,
  },
  moduleBlock: {
    gap: 4,
  },
  moduleLabel: {
    color: learnerTheme.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  moduleTitle: {
    color: learnerTheme.textStrong,
    fontSize: 36 / 1.6,
    fontWeight: '700',
  },
  moduleSubtitle: {
    color: learnerTheme.text,
    fontSize: 16,
  },
  lessonCard: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: learnerTheme.surface,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lessonBody: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    color: learnerTheme.textStrong,
    fontSize: 19 / 1.2,
    fontWeight: '700',
  },
  lessonSubtitle: {
    color: learnerTheme.text,
    fontSize: 13,
  },
  lessonCount: {
    color: learnerTheme.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  lessonAction: {
    marginLeft: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: learnerTheme.selectedBorder,
    backgroundColor: learnerTheme.selectedBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  lessonActionText: {
    color: learnerTheme.selectedText,
    fontSize: 12,
    fontWeight: '700',
  },
  motivationBox: {
    borderRadius: 12,
    backgroundColor: learnerTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  motivationText: {
    textAlign: 'center',
    color: learnerTheme.textMuted,
    fontSize: 15,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: learnerTheme.primary,
  },
  retryText: {
    color: learnerTheme.primary,
    fontWeight: '700',
  },
});
