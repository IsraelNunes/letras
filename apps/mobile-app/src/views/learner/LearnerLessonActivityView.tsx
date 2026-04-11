import { useEffect } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LearnerRootStackParamList } from '../../types';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { useLearnerFlowData } from './learnerFlowData';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLessonActivity'>;

export function LearnerLessonActivityView({ navigation, route }: Props) {
  const { moduleId, lessonId, screenIndex } = route.params;
  const { getLesson } = useLearnerFlowData();
  const lesson = getLesson(moduleId, lessonId);

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

  useEffect(() => {
    if (!activity) {
      navigation.replace('LearnerLessonScreen', {
        moduleId,
        lessonId,
        screenIndex: safeIndex,
      });
    }
  }, [activity, lessonId, moduleId, navigation, safeIndex]);

  if (!activity) return null;

  const onContinue = () => {
    if (safeIndex + 1 < totalScreens) {
      navigation.replace('LearnerLessonScreen', {
        moduleId,
        lessonId,
        screenIndex: safeIndex + 1,
      });
      return;
    }

    navigation.replace('LearnerLessonConclusion', { moduleId, lessonId });
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
    >
      <View style={styles.wrapper}>
        <Text style={styles.title}>{activity.title}</Text>

        {activity.mediaUrl && activity.mediaKind === 'image' ? (
          <Image source={{ uri: activity.mediaUrl }} style={styles.imageMedia} resizeMode="cover" />
        ) : null}

        {activity.mediaUrl && (activity.mediaKind === 'video' || activity.mediaKind === 'audio') ? (
          <View style={styles.mediaCard}>
            <Text style={styles.mediaLabel}>{activity.mediaKind === 'video' ? 'Video da atividade' : 'Audio da atividade'}</Text>
            <Text style={styles.mediaUrl} numberOfLines={2}>{activity.mediaUrl}</Text>
          </View>
        ) : null}

        {activity.educatorGuidance ? (
          <View style={styles.tutorCard}>
            <Text style={styles.tutorTitle}>Orientacao para o Alfabetizador</Text>
            <Text style={styles.tutorText}>{activity.educatorGuidance}</Text>
          </View>
        ) : null}

        {activity.learnerSpeech ? (
          <View style={styles.studentCard}>
            <Text style={styles.studentTitle}>Fala sugerida para o Alfabetizando</Text>
            <Text style={styles.studentText}>{activity.learnerSpeech}</Text>
          </View>
        ) : null}

        {activity.completionMessage ? (
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>Muito bem!</Text>
            <Text style={styles.successText}>{activity.completionMessage}</Text>
          </View>
        ) : null}

        <Pressable style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueArrow}>→</Text>
          <Text style={styles.continueLabel}>CONTINUAR</Text>
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
  title: {
    marginTop: 6,
    fontSize: 34 / 1.6,
    color: '#111827',
    fontWeight: '700',
  },
  imageMedia: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dce4',
  },
  mediaCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7dce4',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 4,
  },
  mediaLabel: {
    color: '#17335B',
    fontSize: 13,
    fontWeight: '700',
  },
  mediaUrl: {
    color: '#374151',
    fontSize: 12,
  },
  tutorCard: {
    borderRadius: 14,
    backgroundColor: '#dfe3ea',
    borderWidth: 1,
    borderColor: '#d0d6de',
    padding: 12,
    gap: 4,
  },
  tutorTitle: {
    color: '#17335B',
    fontSize: 12,
    fontWeight: '700',
  },
  tutorText: {
    color: '#374151',
    fontSize: 17 / 1.2,
    lineHeight: 24,
  },
  studentCard: {
    borderRadius: 14,
    backgroundColor: '#dff6e8',
    borderWidth: 1,
    borderColor: '#91d5a8',
    padding: 12,
    gap: 4,
  },
  studentTitle: {
    color: '#138a4f',
    fontSize: 12,
    fontWeight: '700',
  },
  studentText: {
    color: '#1f2937',
    fontSize: 17 / 1.2,
    lineHeight: 24,
  },
  successCard: {
    borderRadius: 14,
    backgroundColor: '#dbf5e4',
    borderWidth: 1,
    borderColor: '#5ad187',
    padding: 12,
    gap: 4,
  },
  successTitle: {
    color: '#0f8b50',
    fontSize: 20 / 1.2,
    fontWeight: '700',
  },
  successText: {
    color: '#1f2937',
    fontSize: 16,
    lineHeight: 24,
  },
  continueButton: {
    marginTop: 10,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
  },
  continueArrow: {
    color: '#17335B',
    fontSize: 44,
    lineHeight: 44,
    fontWeight: '700',
  },
  continueLabel: {
    color: '#17335B',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
