import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LearnerRootStackParamList } from '../../types';
import { LearnerActionButtons } from './components/LearnerActionButtons';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { useLearnerFlowData } from './learnerFlowData';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerLessonScreen'>;

export function LearnerLessonScreenView({ navigation, route }: Props) {
  const { moduleId, lessonId, screenIndex } = route.params;
  const { getLesson } = useLearnerFlowData();
  const lesson = getLesson(moduleId, lessonId);

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

  const goBack = () => {
    if (safeIndex === 0) {
      navigation.goBack();
      return;
    }

    navigation.replace('LearnerLessonScreen', {
      moduleId,
      lessonId,
      screenIndex: safeIndex - 1,
    });
  };

  const goNext = () => {
    if (screen.followUpActivity) {
      navigation.replace('LearnerLessonActivity', {
        moduleId,
        lessonId,
        screenIndex: safeIndex,
      });
      return;
    }

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
        <View style={styles.progressHeader}>
          <Text style={styles.path}>{lesson.moduleLabel} · Aula 1</Text>
          <Text style={styles.count}>{safeIndex + 1} de {totalScreens}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
        </View>

        <Text style={styles.title}>{screen.title}</Text>

        {screen.mediaUrl && screen.mediaKind === 'image' ? (
          <Image source={{ uri: screen.mediaUrl }} style={styles.imageMedia} resizeMode="cover" />
        ) : null}

        {screen.mediaUrl && (screen.mediaKind === 'video' || screen.mediaKind === 'audio') ? (
          <View style={styles.mediaCard}>
            <Text style={styles.mediaLabel}>{screen.mediaKind === 'video' ? 'Video da aula' : 'Audio da aula'}</Text>
            <Text style={styles.mediaUrl} numberOfLines={2}>{screen.mediaUrl}</Text>
          </View>
        ) : null}

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

        <LearnerActionButtons onBack={goBack} onNext={goNext} />
      </View>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  path: {
    color: '#5f6f8c',
    fontSize: 12,
    fontWeight: '700',
  },
  count: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 10,
    borderRadius: 8,
    backgroundColor: '#d6dae1',
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: '#17335B',
  },
  title: {
    marginTop: 8,
    fontSize: 34 / 1.6,
    color: '#111827',
    fontWeight: '700',
  },
  imageMedia: {
    width: '100%',
    height: 200,
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
  cardTitle: {
    color: '#17335B',
    fontSize: 12,
    fontWeight: '700',
  },
  cardText: {
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
  highlightCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f5d77b',
    backgroundColor: '#fff8db',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  highlightText: {
    textAlign: 'center',
    color: '#b7791f',
    fontWeight: '700',
    fontSize: 14,
  },
});
