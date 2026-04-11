import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LearnerRootStackParamList } from '../../types';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { useLearnerFlowData } from './learnerFlowData';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLessonConclusion'>;

export function LearnerLessonConclusionView({ navigation, route }: Props) {
  const { moduleId, lessonId } = route.params;
  const { getLesson } = useLearnerFlowData();
  const lesson = getLesson(moduleId, lessonId);

  if (!lesson) {
    return (
      <LearnerScreenLayout activeMenu="acompanhar" onMenuHome={() => navigation.navigate('LearnerHome')}>
        <Text style={styles.error}>Conclusao indisponivel.</Text>
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
      onMenuProfile={() => navigation.navigate('LearnerHome')}
      roleLabel="alfabetizador"
    >
      <View style={styles.wrapper}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>T</Text>
        </View>

        <Text style={styles.title}>{lesson.conclusionTitle}</Text>
        <Text style={styles.subtitle}>{lesson.title}</Text>

        <View style={styles.messageCard}>
          <Text style={styles.messageText}>{lesson.conclusionMessage}</Text>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>{lesson.moduleTitle.toUpperCase()}</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>1 de 1 aulas</Text>
        </View>

        <View style={styles.pointsCard}>
          <Text style={styles.pointsText}>+50 pontos conquistados</Text>
        </View>

        <Text style={styles.motivation}>Foco e dedicacao levam longe!</Text>

        <Pressable style={styles.finishButton} onPress={() => navigation.navigate('LearnerHome')}>
          <Text style={styles.finishArrow}>→</Text>
          <Text style={styles.finishLabel}>VOLTAR AOS MODULOS</Text>
        </Pressable>
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
    color: '#b91c1c',
    fontSize: 14,
  },
  iconWrap: {
    marginTop: 8,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#d9ffe8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 40,
    color: '#0f8b50',
    fontWeight: '700',
  },
  title: {
    fontSize: 34 / 1.6,
    color: '#111827',
    fontWeight: '700',
  },
  subtitle: {
    color: '#4b5563',
    fontSize: 18 / 1.2,
  },
  messageCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7dce4',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  messageText: {
    color: '#374151',
    fontSize: 18 / 1.2,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7dce4',
    backgroundColor: '#ffffff',
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  progressTitle: {
    color: '#5f6f8c',
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: 8,
    backgroundColor: '#d6dae1',
    overflow: 'hidden',
  },
  progressFill: {
    width: '100%',
    height: 10,
    backgroundColor: '#17335B',
  },
  progressText: {
    color: '#374151',
    fontSize: 14,
  },
  pointsCard: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5d77b',
    backgroundColor: '#fff8db',
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  pointsText: {
    textAlign: 'center',
    color: '#b7791f',
    fontSize: 17 / 1.2,
    fontWeight: '700',
  },
  motivation: {
    marginTop: 4,
    color: '#17335B',
    fontSize: 16,
  },
  finishButton: {
    marginTop: 10,
    alignItems: 'center',
    gap: 6,
  },
  finishArrow: {
    color: '#17335B',
    fontSize: 44,
    lineHeight: 44,
    fontWeight: '700',
  },
  finishLabel: {
    color: '#17335B',
    fontSize: 17,
    fontWeight: '700',
  },
});
