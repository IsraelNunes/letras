import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LearnerRootStackParamList } from '../../types';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { useLearnerFlowData } from './learnerFlowData';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerHome'>;

export function LearnerHomeView({ navigation }: Props) {
  const { modules, loading, error, refresh } = useLearnerFlowData();

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
        {loading ? <Text style={styles.helper}>Carregando aulas...</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {modules.map((moduleItem, moduleIndex) => {
          const firstLesson = moduleItem.lessons[0] ?? null;
          return (
            <View key={moduleItem.id} style={styles.moduleBlock}>
              <Text style={styles.moduleLabel}>MODULO {moduleIndex + 1}</Text>
              <Text style={styles.moduleTitle}>{moduleItem.title}</Text>
              <Text style={styles.moduleSubtitle}>{moduleItem.subtitle}</Text>

              {firstLesson ? (
                <Pressable
                  style={styles.lessonCard}
                  onPress={() =>
                    navigation.navigate('LearnerLessonIntro', {
                      moduleId: moduleItem.id,
                      lessonId: firstLesson.id,
                    })
                  }
                >
                  <View style={styles.lessonIcon}>
                    <Text style={styles.lessonIconText}>▶</Text>
                  </View>
                  <View style={styles.lessonBody}>
                    <Text style={styles.lessonTitle}>Aula 1 - {firstLesson.title}</Text>
                    <Text style={styles.lessonSubtitle}>{firstLesson.objective}</Text>
                    <Text style={styles.lessonCount}>{firstLesson.screens.length} telas</Text>
                  </View>
                  <Text style={styles.lessonArrow}>›</Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}

        <View style={styles.motivationBox}>
          <Text style={styles.motivationText}>Cada aula e um passo a mais na sua jornada.</Text>
        </View>

        {!loading && modules.length === 0 ? (
          <Pressable style={styles.retryButton} onPress={() => void refresh()}>
            <Text style={styles.retryText}>Recarregar conteudo</Text>
          </Pressable>
        ) : null}
      </View>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 18,
  },
  helper: {
    color: '#1f2937',
    fontSize: 14,
  },
  error: {
    color: '#b91c1c',
    fontSize: 13,
  },
  moduleBlock: {
    gap: 4,
  },
  moduleLabel: {
    color: '#5f6f8c',
    fontSize: 13,
    fontWeight: '700',
  },
  moduleTitle: {
    color: '#111827',
    fontSize: 36 / 1.6,
    fontWeight: '700',
  },
  moduleSubtitle: {
    color: '#374151',
    fontSize: 16,
  },
  lessonCard: {
    marginTop: 10,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7dce4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  lessonIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#d9e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonIconText: {
    color: '#17335B',
    fontWeight: '700',
    marginLeft: 1,
  },
  lessonBody: {
    flex: 1,
    marginLeft: 10,
    gap: 2,
  },
  lessonTitle: {
    color: '#111827',
    fontSize: 19 / 1.2,
    fontWeight: '700',
  },
  lessonSubtitle: {
    color: '#374151',
    fontSize: 13,
  },
  lessonCount: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '600',
  },
  lessonArrow: {
    color: '#17335B',
    fontSize: 26,
    fontWeight: '700',
    marginLeft: 8,
  },
  motivationBox: {
    borderRadius: 12,
    backgroundColor: '#dfe4eb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  motivationText: {
    textAlign: 'center',
    color: '#5a6478',
    fontSize: 15,
  },
  retryButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#17335B',
  },
  retryText: {
    color: '#17335B',
    fontWeight: '700',
  },
});
