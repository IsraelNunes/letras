import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LearnerRootStackParamList } from '../../types';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { useLearnerFlowData } from './learnerFlowData';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLessonIntro'>;

export function LearnerLessonIntroView({ navigation, route }: Props) {
  const { moduleId, lessonId } = route.params;
  const { getLesson } = useLearnerFlowData();
  const lesson = getLesson(moduleId, lessonId);

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
      onMenuProfile={() => navigation.navigate('LearnerHome')}
      roleLabel="alfabetizador"
    >
      <View style={styles.wrapper}>
        <Text style={styles.path}>{lesson.moduleLabel} · AULA 1</Text>
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
          <Text style={styles.infoSub}>Avance no seu ritmo — sem pressa!</Text>
        </View>

        <Pressable
          style={styles.startButton}
          onPress={() =>
            navigation.navigate('LearnerLessonScreen', {
              moduleId,
              lessonId,
              screenIndex: 0,
            })
          }
        >
          <Text style={styles.startArrow}>→</Text>
          <Text style={styles.startLabel}>INICIAR AULA</Text>
        </Pressable>
      </View>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
  },
  path: {
    color: '#5f6f8c',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 36 / 1.6,
    fontWeight: '700',
    color: '#111827',
  },
  objectiveCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7dce4',
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 4,
  },
  objectiveLabel: {
    color: '#5f6f8c',
    fontSize: 11,
    fontWeight: '700',
  },
  objectiveText: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 22,
  },
  messageCard: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dce4',
    padding: 14,
  },
  messageText: {
    color: '#374151',
    fontSize: 16,
    lineHeight: 24,
  },
  infoCard: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dce4',
    padding: 14,
  },
  infoTitle: {
    color: '#17335B',
    fontSize: 16,
    fontWeight: '700',
  },
  infoSub: {
    marginTop: 2,
    color: '#374151',
    fontSize: 13,
  },
  startButton: {
    marginTop: 6,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
  },
  startArrow: {
    color: '#17335B',
    fontSize: 44,
    lineHeight: 44,
    fontWeight: '700',
  },
  startLabel: {
    color: '#17335B',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
