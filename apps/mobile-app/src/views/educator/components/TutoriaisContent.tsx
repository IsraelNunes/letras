import { createElement, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { httpClient } from '../../../infra/api/http-client';

export interface TutorialCompletion {
  completed_at: string | null;
  position_sec: number;
  watch_count: number;
  is_completed: boolean;
}

export interface Tutorial {
  id: string;
  slug: string | null;
  title: string;
  description: string | null;
  kind: string;
  duration_sec: number | null;
  public_url: string | null;
  tags: string[];
  completion: TutorialCompletion | null;
}

function getTutorialOrder(tags: string[]): number {
  for (const tag of tags) {
    const match = tag.match(/tutorial-(\d+)/);
    if (match) return parseInt(match[1], 10);
  }
  return 999;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} min` : `${m}:${String(s).padStart(2, '0')} min`;
}

interface VideoOverlayProps {
  tutorial: Tutorial;
  educatorId: string;
  onClose: () => void;
  onCompleted: (tutorialId: string) => void;
}

function VideoOverlay({ tutorial, educatorId, onClose, onCompleted }: VideoOverlayProps) {
  const slideX = useRef(new Animated.Value(400)).current;
  const [markedCompleted, setMarkedCompleted] = useState(tutorial.completion?.is_completed === true);

  useEffect(() => {
    Animated.spring(slideX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [slideX]);

  const handleClose = () => {
    Animated.timing(slideX, {
      toValue: -420,
      duration: 260,
      useNativeDriver: true,
    }).start(onClose);
  };

  const markCompleted = useCallback(async () => {
    if (markedCompleted) return;
    setMarkedCompleted(true);
    try {
      await httpClient.post(`/painel/tutoriais/${tutorial.id}/progresso`, {
        educatorId,
        markCompleted: true,
        positionSec: tutorial.duration_sec ?? 0,
      });
      onCompleted(tutorial.id);
    } catch { /* refetch on next open */ }
  }, [educatorId, markedCompleted, onCompleted, tutorial.id, tutorial.duration_sec]);

  return (
    <Animated.View style={[styles.overlay, { transform: [{ translateX: slideX }] }]}>
      <View style={styles.overlayHeader}>
        <Text style={styles.overlayTitle} numberOfLines={1}>{tutorial.title}</Text>
        <Pressable
          onPress={handleClose}
          hitSlop={12}
          style={styles.overlayClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar vídeo"
        >
          <Text style={styles.overlayCloseText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.overlayVideo}>
        {tutorial.public_url ? (
          Platform.OS === 'web'
            ? createElement('video', {
                src: tutorial.public_url,
                controls: true,
                autoPlay: true,
                playsInline: true,
                preload: 'auto',
                style: {
                  width: '100%',
                  height: '100%',
                  display: 'block',
                  backgroundColor: '#000',
                  objectFit: 'contain',
                },
              })
            : (
              <Video
                source={{ uri: tutorial.public_url }}
                style={styles.video}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping={false}
                onPlaybackStatusUpdate={(status) => {
                  if (status.isLoaded && status.didJustFinish) {
                    void markCompleted();
                  }
                }}
              />
            )
        ) : (
          <View style={styles.noVideoWrap}>
            <Text style={styles.noVideoText}>Vídeo não configurado ainda.{'\n'}Acesse o painel web para configurar a URL.</Text>
          </View>
        )}
      </View>

      {markedCompleted ? (
        <View style={styles.overlayCompletedBadge}>
          <Text style={styles.overlayCompletedText}>✓ Marcado como assistido</Text>
        </View>
      ) : (
        <Pressable style={styles.overlayCompleteBtn} onPress={() => void markCompleted()}>
          <Text style={styles.overlayCompleteBtnText}>MARCAR COMO ASSISTIDO</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

interface TutoriaisContentProps {
  educatorId: string | undefined;
  onBack: () => void;
}

export function TutoriaisContent({ educatorId, onBack }: TutoriaisContentProps) {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingTutorial, setPlayingTutorial] = useState<Tutorial | null>(null);

  const fetchTutorials = useCallback(async () => {
    if (!educatorId) return;
    setIsLoading(true);
    setError(null);
    try {
      const raw = await httpClient.get<Tutorial[]>(`/painel/tutoriais?educatorId=${educatorId}`);
      const sorted = [...(raw ?? [])].sort(
        (a, b) => getTutorialOrder(a.tags) - getTutorialOrder(b.tags),
      );
      setTutorials(sorted);
    } catch {
      setError('Não foi possível carregar os tutoriais. Tente novamente.');
    }
    setIsLoading(false);
  }, [educatorId]);

  useEffect(() => {
    void fetchTutorials();
  }, [fetchTutorials]);

  function handleCompleted(tutorialId: string) {
    setTutorials((prev) =>
      prev.map((t) =>
        t.id === tutorialId
          ? {
              ...t,
              completion: {
                completed_at: new Date().toISOString(),
                position_sec: t.duration_sec ?? 0,
                watch_count: (t.completion?.watch_count ?? 0) + 1,
                is_completed: true,
              },
            }
          : t,
      ),
    );
  }

  function isTutorialUnlocked(index: number): boolean {
    if (index === 0) return true;
    return tutorials[index - 1]?.completion?.is_completed === true;
  }

  const completedCount = tutorials.filter((t) => t.completion?.is_completed).length;
  const total = tutorials.length;
  const progressPct = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <Text style={styles.backBtnText}>{'‹ Voltar'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Tutoriais</Text>
        <View style={styles.backBtnPlaceholder} />
      </View>

      {total > 0 ? (
        <View style={styles.progressSection}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {completedCount} de {total} assistidos
          </Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.list}>
        {isLoading ? (
          <ActivityIndicator color="#20385f" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => void fetchTutorials()}>
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : !educatorId ? (
          <Text style={styles.emptyText}>Carregando perfil...</Text>
        ) : tutorials.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum tutorial disponível no momento.</Text>
        ) : (
          tutorials.map((tutorial, index) => {
            const unlocked = isTutorialUnlocked(index);
            const completed = tutorial.completion?.is_completed === true;
            const inProgress = tutorial.completion !== null && !completed;

            return (
              <Pressable
                key={tutorial.id}
                style={[styles.card, !unlocked && styles.cardLocked]}
                onPress={() => {
                  if (unlocked) setPlayingTutorial(tutorial);
                }}
                disabled={!unlocked}
                accessibilityRole="button"
                accessibilityLabel={`Tutorial ${index + 1}: ${tutorial.title}`}
              >
                <View style={[styles.cardIndex, completed && styles.cardIndexDone]}>
                  <Text style={[styles.cardIndexText, completed && styles.cardIndexTextDone]}>
                    {completed ? '✓' : String(index + 1)}
                  </Text>
                </View>

                <View style={styles.cardBody}>
                  <Text
                    style={[styles.cardTitle, !unlocked && styles.cardTitleLocked]}
                    numberOfLines={2}
                  >
                    {tutorial.title}
                  </Text>

                  {tutorial.description ? (
                    <Text style={styles.cardDesc} numberOfLines={3}>
                      {tutorial.description}
                    </Text>
                  ) : null}

                  <View style={styles.cardFooter}>
                    {tutorial.duration_sec ? (
                      <Text style={styles.cardDuration}>{formatDuration(tutorial.duration_sec)}</Text>
                    ) : null}

                    {completed ? (
                      <Text style={styles.badgeDone}>
                        Assistido em {formatDate(tutorial.completion!.completed_at!)}
                      </Text>
                    ) : inProgress ? (
                      <Text style={styles.badgeInProgress}>Em andamento</Text>
                    ) : !unlocked ? (
                      <Text style={styles.badgeLocked}>🔒 Bloqueado</Text>
                    ) : (
                      <Text style={styles.badgePending}>Não assistido</Text>
                    )}
                  </View>
                </View>

                {unlocked && !completed ? (
                  <View style={styles.playIcon}>
                    <Text style={styles.playIconText}>▶</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {playingTutorial && educatorId ? (
        <VideoOverlay
          tutorial={playingTutorial}
          educatorId={educatorId}
          onClose={() => {
            setPlayingTutorial(null);
            void fetchTutorials();
          }}
          onCompleted={handleCompleted}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: {
    minWidth: 70,
  },
  backBtnText: {
    color: '#20385f',
    fontSize: 15,
    fontWeight: '600',
  },
  backBtnPlaceholder: {
    minWidth: 70,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
  },

  // Progress
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    backgroundColor: '#20385f',
    borderRadius: 3,
  },
  progressLabel: {
    marginTop: 6,
    marginBottom: 10,
    color: '#555555',
    fontSize: 12,
    fontWeight: '600',
  },

  // List
  list: {
    padding: 16,
    gap: 12,
  },
  loader: {
    marginTop: 40,
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardLocked: {
    opacity: 0.55,
    backgroundColor: '#f9fafb',
  },
  cardIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  cardIndexDone: {
    backgroundColor: '#20385f',
  },
  cardIndexText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#555555',
  },
  cardIndexTextDone: {
    color: '#ffffff',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 20,
  },
  cardTitleLocked: {
    color: '#888888',
  },
  cardDesc: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  cardDuration: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '500',
  },
  badgeDone: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700',
  },
  badgeInProgress: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '700',
  },
  badgeLocked: {
    fontSize: 11,
    color: '#888888',
    fontWeight: '600',
  },
  badgePending: {
    fontSize: 11,
    color: '#555555',
    fontWeight: '600',
  },
  playIcon: {
    alignSelf: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#20385f',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  playIconText: {
    color: '#ffffff',
    fontSize: 12,
    marginLeft: 2,
  },

  // Error / empty
  errorWrap: {
    marginTop: 40,
    alignItems: 'center',
    gap: 14,
  },
  errorText: {
    color: '#7d1f1f',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#20385f',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryBtnText: {
    color: '#20385f',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    marginTop: 40,
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },

  // Video overlay
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    zIndex: 100,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#111111',
    gap: 12,
  },
  overlayTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  overlayClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCloseText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  overlayVideo: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
    backgroundColor: '#000000',
  },
  noVideoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noVideoText: {
    color: '#aaaaaa',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  overlayCompleteBtn: {
    backgroundColor: '#20385f',
    paddingVertical: 16,
    alignItems: 'center',
  },
  overlayCompleteBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  overlayCompletedBadge: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    alignItems: 'center',
  },
  overlayCompletedText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
