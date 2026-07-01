import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LearnerRootStackParamList } from '../../types';
import { LearnerScreenLayout } from './components/LearnerScreenLayout';
import { learnerTheme } from './learnerTheme';
import { useLearnerSession } from './learnerSessionContext';
import { httpClient } from '../../infra/api/http-client';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerScore'>;

interface ScoreData {
  totalPoints: number;
  completedCount: number;
  totalActivities: number;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <Text style={[styles.star, filled && styles.starFilled]}>★</Text>
  );
}

export function LearnerPontuacaoView({ navigation }: Props) {
  const learnerSession = useLearnerSession();
  const [scoreData, setScoreData] = useState<ScoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const learnerId = learnerSession.learnerProfileId;
    if (!learnerId) {
      setIsLoading(false);
      return;
    }
    void (async () => {
      try {
        const data = await httpClient.get<ScoreData>(`/painel/score/${learnerId}`);
        setScoreData(data);
      } catch {
        setScoreData(null);
      }
      setIsLoading(false);
    })();
  }, [learnerSession.learnerProfileId]);

  const completionPercent =
    scoreData && scoreData.totalActivities > 0
      ? Math.round((scoreData.completedCount / scoreData.totalActivities) * 100)
      : 0;

  const filledStars = Math.min(5, Math.floor((completionPercent / 100) * 5));

  return (
    <LearnerScreenLayout
      activeMenu="pontuacao"
      onMenuHome={() => navigation.navigate('LearnerHome')}
      onMenuTrack={() => navigation.navigate('LearnerHome')}
      onMenuTutorial={() => navigation.navigate('LearnerTutorials')}
      onMenuScore={() => navigation.navigate('LearnerScore')}
      onMenuProfile={() => navigation.navigate('LearnerProfile')}
      roleLabel="alfabetizando"
      learnerName={learnerSession.learnerName}
      isSessionLocked={learnerSession.isLocked}
      sessionErrorMessage={learnerSession.errorMessage}
    >
      <ScrollView contentContainerStyle={styles.wrapper}>
        {/* Heading */}
        <View style={styles.headingBlock}>
          <Text style={styles.headingMain}>PESSOA QUE</Text>
          <Text style={styles.headingMain}>TRANSFORMA</Text>
          <Text style={styles.headingMain}>PESSOA</Text>
        </View>

        {/* Learner name */}
        {learnerSession.learnerName ? (
          <Text style={styles.learnerName}>{learnerSession.learnerName}</Text>
        ) : null}

        {/* Stars */}
        <View style={styles.starsRow}>
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon key={i} filled={i < filledStars} />
          ))}
        </View>

        {/* Score card */}
        {isLoading ? (
          <ActivityIndicator color={learnerTheme.primary} style={styles.loader} />
        ) : scoreData ? (
          <>
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>PONTOS TOTAIS</Text>
              <Text style={styles.scoreValue}>
                {scoreData.totalPoints > 0
                  ? scoreData.totalPoints.toLocaleString('pt-BR')
                  : '—'}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{scoreData.completedCount}</Text>
                <Text style={styles.statLabel}>telas concluídas</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBlock}>
                <Text style={styles.statValue}>{completionPercent}%</Text>
                <Text style={styles.statLabel}>do conteúdo</Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
            </View>

            <Text style={styles.motivationText}>
              {completionPercent === 0
                ? 'Comece sua jornada de alfabetização!'
                : completionPercent < 50
                ? 'Você está no caminho certo. Continue!'
                : completionPercent < 100
                ? 'Ótimo progresso! Siga em frente!'
                : 'Incrível! Você concluiu todo o conteúdo!'}
            </Text>
          </>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhuma pontuação registrada ainda.</Text>
            <Text style={styles.emptySubtext}>Comece as aulas para acumular pontos.</Text>
          </View>
        )}

        <Pressable
          style={styles.homeBtn}
          onPress={() => navigation.navigate('LearnerHome')}
          accessibilityRole="button"
          accessibilityLabel="Ir para início"
        >
          <Text style={styles.homeBtnText}>IR PARA INÍCIO</Text>
        </Pressable>
      </ScrollView>
    </LearnerScreenLayout>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 18,
    alignItems: 'center',
    paddingBottom: 24,
  },
  loader: {
    marginTop: 24,
  },

  // Heading
  headingBlock: {
    marginTop: 8,
    alignItems: 'center',
  },
  headingMain: {
    fontSize: 28,
    fontWeight: '900',
    color: learnerTheme.textStrong,
    letterSpacing: 1.5,
    lineHeight: 34,
    textAlign: 'center',
  },

  // Learner name
  learnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: learnerTheme.text,
    textAlign: 'center',
  },

  // Stars
  starsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  star: {
    fontSize: 28,
    color: learnerTheme.border,
  },
  starFilled: {
    color: '#f59e0b',
  },

  // Score card
  scoreCard: {
    width: '100%',
    backgroundColor: learnerTheme.primary,
    borderRadius: 16,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 6,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  scoreValue: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
    lineHeight: 56,
  },

  // Stats
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: learnerTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: learnerTheme.border,
    paddingVertical: 16,
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: learnerTheme.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: learnerTheme.textStrong,
  },
  statLabel: {
    fontSize: 11,
    color: learnerTheme.textMuted,
    fontWeight: '600',
  },

  // Progress bar
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: learnerTheme.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: learnerTheme.successText,
    borderRadius: 4,
  },

  // Motivation
  motivationText: {
    color: learnerTheme.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Empty state
  emptyCard: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: learnerTheme.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: learnerTheme.border,
  },
  emptyText: {
    color: learnerTheme.textStrong,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtext: {
    color: learnerTheme.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },

  // Home button
  homeBtn: {
    width: '100%',
    backgroundColor: learnerTheme.primary,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
