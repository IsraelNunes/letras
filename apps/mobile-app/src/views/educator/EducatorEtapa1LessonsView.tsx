import { createContext, useCallback, useContext, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  NativeStackScreenProps,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { EducatorRootStackParamList, LearnerRootStackParamList } from '../../types';
import { LearnerChromeContext, LearnerSessionProvider } from '../learner/learnerSessionContext';
import { useLearnerFlowData, LearnerFlowLesson } from '../learner/learnerFlowData';
import { LearnerLessonIntroView } from '../learner/LearnerLessonIntroView';
import { LearnerLessonScreenView } from '../learner/LearnerLessonScreenView';
import { LearnerLessonActivityView } from '../learner/LearnerLessonActivityView';
import { LearnerLessonConclusionView } from '../learner/LearnerLessonConclusionView';
import { LearnerPhotoReviewView } from '../learner/LearnerPhotoReviewView';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorEtapa1Lessons'>;

// Contexto interno do runner: os componentes próprios (lista da Etapa 1 e
// interstício de conclusão) precisam do tema do aluno e de como sair de volta
// ao EducatorHome; as telas reaproveitadas do learner não precisam de nada.
interface RunnerContextValue {
  learnerId: string;
  learnerName: string;
  themeId?: string;
  exitToHome: () => void;
}

const RunnerContext = createContext<RunnerContextValue | null>(null);

function useRunner() {
  const ctx = useContext(RunnerContext);
  if (!ctx) throw new Error('Runner da Etapa 1 sem contexto.');
  return ctx;
}

const RunnerStack = createNativeStackNavigator<LearnerRootStackParamList>();

// ── Lista das aulas da Etapa 1 (ocupa o slot "LearnerHome" do navegador aninhado
// para que a conclusão de aula, que navega para LearnerHome, volte para cá). ──
function Etapa1LessonListScreen({
  navigation,
}: NativeStackScreenProps<LearnerRootStackParamList, 'LearnerHome'>) {
  const runner = useRunner();
  const { modules, loading, error, completedLessonIds, refresh } = useLearnerFlowData();

  // A "Etapa 1" conduzida pelo educador = menor etapa presente no tema (mesma
  // semântica do painel: "menor etapa"), não o número 1 fixo.
  const etapa1Modules = useMemo(() => {
    const scoped = modules.filter((m) => !runner.themeId || m.id === runner.themeId);
    const stageNumbers = scoped.flatMap((m) => m.lessons.map((l) => l.stageNumber));
    const firstStage = stageNumbers.length ? Math.min(...stageNumbers) : 1;
    return scoped
      .map((m) => ({ ...m, lessons: m.lessons.filter((l) => l.stageNumber === firstStage) }))
      .filter((m) => m.lessons.length > 0);
  }, [modules, runner.themeId]);

  function isLessonUnlocked(lessons: LearnerFlowLesson[], index: number): boolean {
    if (index === 0) return true;
    return completedLessonIds.has(lessons[index - 1].progressId);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Etapa 1 — {runner.learnerName}</Text>
        <Text style={styles.subtitle}>
          Conduza cada aula presencialmente. O progresso é gravado no perfil do alfabetizando.
        </Text>

        {loading ? <ActivityIndicator style={styles.loader} color="#111" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!loading && etapa1Modules.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Etapa 1 sem aulas publicadas</Text>
            <Text style={styles.emptyText}>
              Configure a Etapa 1 deste tema no painel (aulas publicadas) para começar.
            </Text>
            <Pressable style={styles.retryBtn} onPress={() => void refresh()}>
              <Text style={styles.retryText}>Recarregar</Text>
            </Pressable>
          </View>
        ) : null}

        {etapa1Modules.map((moduleItem) => (
          <View key={moduleItem.id} style={styles.moduleBlock}>
            <Text style={styles.moduleTitle}>{moduleItem.title}</Text>
            {moduleItem.lessons.map((lesson, lessonIndex) => {
              const unlocked = isLessonUnlocked(moduleItem.lessons, lessonIndex);
              const done = completedLessonIds.has(lesson.progressId);
              if (!unlocked) {
                return (
                  <View key={lesson.id} style={[styles.lessonCard, styles.lessonLocked]}>
                    <View style={styles.dotMuted} />
                    <Text style={styles.lessonTitleMuted}>{lesson.title}</Text>
                    <Text style={styles.lessonHint}>Conclua a aula anterior</Text>
                  </View>
                );
              }
              return (
                <Pressable
                  key={lesson.id}
                  style={styles.lessonCard}
                  onPress={() =>
                    navigation.navigate('LearnerLessonIntro', {
                      moduleId: moduleItem.id,
                      lessonId: lesson.id,
                      moduleLabel: lesson.moduleLabel,
                      moduleTitle: moduleItem.title,
                    })
                  }
                >
                  <View style={[styles.dot, done ? styles.dotDone : styles.dotOpen]} />
                  <View style={styles.lessonBody}>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonCount}>{lesson.screens.length} telas</Text>
                  </View>
                  <Text style={styles.chevron}>{done ? '✓' : '›'}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        <Pressable style={styles.exitBtn} onPress={runner.exitToHome}>
          <Text style={styles.exitText}>SAIR DA ETAPA 1</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Interstício ao concluir a Etapa 1 (ocupa o slot "LearnerStageConclusion",
// para onde a conclusão de aula navega quando a etapa fecha). ──
function Etapa1DoneScreen(_: NativeStackScreenProps<LearnerRootStackParamList, 'LearnerStageConclusion'>) {
  const runner = useRunner();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.doneWrap}>
        <Text style={styles.doneTitle}>Etapa 1 concluída!</Text>
        <Text style={styles.doneText}>
          Espelhamento e Etapa 2 liberados para {runner.learnerName}.
        </Text>
        <Pressable style={styles.doneBtn} onPress={runner.exitToHome}>
          <Text style={styles.doneBtnText}>VOLTAR AO INÍCIO</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Slots do menu inferior das telas reaproveitadas: no modo educador não há
// tutoriais/pontuação/perfil do aluno — apenas voltam para a lista da Etapa 1.
function BackToListScreen({
  navigation,
}: NativeStackScreenProps<LearnerRootStackParamList, 'LearnerTutorials' | 'LearnerScore' | 'LearnerProfile'>) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.doneWrap}>
        <Text style={styles.doneText}>Indisponível no modo alfabetizador.</Text>
        <Pressable style={styles.doneBtn} onPress={() => navigation.navigate('LearnerHome')}>
          <Text style={styles.doneBtnText}>VOLTAR À ETAPA 1</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export function EducatorEtapa1LessonsView({ navigation, route }: Props) {
  const { learnerId, learnerName, educatorId, themeId } = route.params;

  const exitToHome = useCallback(() => {
    navigation.navigate('EducatorHome', { fullName: undefined, educatorId });
  }, [navigation, educatorId]);

  const runnerValue = useMemo<RunnerContextValue>(
    () => ({ learnerId, learnerName: learnerName ?? 'Alfabetizando', themeId, exitToHome }),
    [learnerId, learnerName, themeId, exitToHome],
  );

  return (
    <LearnerSessionProvider overrideLearnerProfileId={learnerId} overrideLearnerName={learnerName}>
      <LearnerChromeContext.Provider value={{ hideBottomMenu: true }}>
        <RunnerContext.Provider value={runnerValue}>
          <RunnerStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="LearnerHome">
          <RunnerStack.Screen name="LearnerHome" component={Etapa1LessonListScreen} />
          <RunnerStack.Screen name="LearnerLessonIntro" component={LearnerLessonIntroView} />
          <RunnerStack.Screen name="LearnerLessonScreen" component={LearnerLessonScreenView} />
          <RunnerStack.Screen name="LearnerLessonActivity" component={LearnerLessonActivityView} />
          <RunnerStack.Screen name="LearnerLessonConclusion" component={LearnerLessonConclusionView} />
          <RunnerStack.Screen name="LearnerStageConclusion" component={Etapa1DoneScreen} />
          <RunnerStack.Screen name="LearnerPhotoReview" component={LearnerPhotoReviewView} />
          <RunnerStack.Screen name="LearnerTutorials" component={BackToListScreen} />
          <RunnerStack.Screen name="LearnerScore" component={BackToListScreen} />
          <RunnerStack.Screen name="LearnerProfile" component={BackToListScreen} />
          </RunnerStack.Navigator>
        </RunnerContext.Provider>
      </LearnerChromeContext.Provider>
    </LearnerSessionProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  container: { padding: 20, paddingBottom: 60, gap: 14 },
  title: { fontSize: 20, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#555', lineHeight: 20 },
  loader: { marginTop: 20 },
  error: { color: '#b3261e', fontSize: 13 },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    backgroundColor: '#fafafa',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  emptyText: { fontSize: 14, color: '#555', lineHeight: 20 },
  retryBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#1e3a5f',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  retryText: { color: '#1e3a5f', fontWeight: '700' },
  moduleBlock: { gap: 8 },
  moduleTitle: { fontSize: 16, fontWeight: '700', color: '#222' },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  lessonLocked: { opacity: 0.6 },
  lessonBody: { flex: 1, gap: 2 },
  lessonTitle: { fontSize: 15, fontWeight: '700', color: '#111' },
  lessonTitleMuted: { flex: 1, fontSize: 15, fontWeight: '700', color: '#888' },
  lessonCount: { fontSize: 12, color: '#888', fontWeight: '600' },
  lessonHint: { fontSize: 12, color: '#aaa' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotDone: { backgroundColor: '#2e7d32' },
  dotOpen: { backgroundColor: '#1e3a5f' },
  dotMuted: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#c8c8c8' },
  chevron: { fontSize: 18, color: '#1e3a5f', fontWeight: '700' },
  exitBtn: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 999,
  },
  exitText: { color: '#444', fontWeight: '700', letterSpacing: 0.4 },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 16 },
  doneTitle: { fontSize: 22, fontWeight: '700', color: '#1e3a5f', textAlign: 'center' },
  doneText: { fontSize: 16, color: '#333', textAlign: 'center', lineHeight: 24 },
  doneBtn: {
    marginTop: 8,
    backgroundColor: '#1e3a5f',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  doneBtnText: { color: '#fff', fontWeight: '700', letterSpacing: 0.4 },
});
