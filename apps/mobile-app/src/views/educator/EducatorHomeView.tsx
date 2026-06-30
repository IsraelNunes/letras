import { useAssets } from 'expo-asset';
import { createElement, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri, SvgXml } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { HelpAlert, useEducatorHomeRealtime } from '../../hooks/useEducatorHomeRealtime';
import { EducatorRootStackParamList } from '../../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';
import { getCompletedTutorialCount, isTutorialUnlocked, sortTutorials, Tutorial } from './components/tutorialPresentation';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorHome'>;

interface LearnerItem {
  id: string;
  displayName: string;
  phoneDigits: string | null;
  learnerThemes: Array<{ theme: { name: string } }>;
  grupo?: string | null;
  etapa?: string | null;
}

interface LockedSession {
  id: string;
  displayName: string;
  phoneDigits: string | null;
  session: {
    sessionState: { currentView: string; updatedAt: string } | null;
  } | null;
}

const ICON_YT_PLAY = `<svg viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg"><path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#FF0000"/><path d="M45.02 23.97L27.04 13.46v21.08z" fill="#FFFFFF"/></svg>`;

const ICON_BELL = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" fill="#111111"/></svg>`;

const LOGO_THUMBNAIL = require('../../../assets/logo-letras-2.png');

const ICON_PLUS = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z" fill="#111111"/></svg>`;

const ICON_SEARCH = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="#111111" stroke-width="2"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#111111" stroke-width="2" stroke-linecap="round"/></svg>`;

const ICON_PHONE = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.6 10.8c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1H5.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02L6.6 10.8z" fill="#111111"/></svg>`;

const ICON_WHATSAPP = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#111111"/></svg>`;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function normalizeGroupName(value: string | null | undefined) {
  const normalized = String(value ?? '').trim();
  if (!normalized || normalized.toLowerCase() === 'sem grupo') {
    return null;
  }
  return normalized;
}

function normalizeStageLabel(value: string | null | undefined) {
  const normalized = String(value ?? '').trim();
  return normalized || 'Etapa 1';
}

function TutorialPreviewMedia({
  tutorial,
  label,
  large = false,
}: {
  tutorial: Tutorial | null;
  label: string;
  large?: boolean;
}) {
  const hasVideo = Boolean(tutorial?.public_url);

  return (
    <View style={[styles.tutorialPreviewFrame, large ? styles.tutorialPreviewFrameLarge : null]}>
      {hasVideo && Platform.OS === 'web' ? (
        createElement('video', {
          src: tutorial?.public_url ?? undefined,
          muted: true,
          autoPlay: true,
          loop: true,
          playsInline: true,
          preload: 'metadata',
          style: {
            width: '100%',
            height: '100%',
            display: 'block',
            backgroundColor: '#d9d9d9',
            objectFit: 'cover',
            pointerEvents: 'none',
          },
        })
      ) : (
        <View style={styles.tutorialPreviewFallback} />
      )}

      <View style={styles.tutorialPreviewShade} />

      <View style={styles.tutorialPreviewPlayWrap}>
        <SvgXml xml={ICON_YT_PLAY} width={large ? 68 : 54} height={large ? 48 : 38} />
      </View>

      <View style={styles.tutorialPreviewLogoWrap}>
        <Image
          source={LOGO_THUMBNAIL}
          style={large ? styles.tutorialPreviewLogoLarge : styles.tutorialPreviewLogoSmall}
          resizeMode="contain"
        />
      </View>
      <View style={styles.tutorialPreviewChip}>
        <Text style={styles.tutorialPreviewChipText}>{label}</Text>
      </View>
    </View>
  );
}

export function EducatorHomeView({ navigation, route }: Props) {
  const [brandAssets] = useAssets([
    require('../../../assets/Logo-LETRAS-2.svg'),
  ]);
  const brandLogoUri = brandAssets?.[0]?.localUri ?? brandAssets?.[0]?.uri;

  const educatorName = route.params?.fullName?.trim() || 'Alfabetizador';
  const [educatorId, setEducatorId] = useState<string | undefined>(route.params?.educatorId);

  const [learners, setLearners] = useState<LearnerItem[]>([]);
  const [lockedSessions, setLockedSessions] = useState<LockedSession[]>([]);
  const [dismissedLockedIds, setDismissedLockedIds] = useState(new Set<string>());
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackListOpen, setIsTrackListOpen] = useState(false);
  const [seededAlerts, setSeededAlerts] = useState<HelpAlert[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [tutorialsLoading, setTutorialsLoading] = useState(true);
  const [pendingSessionRequests, setPendingSessionRequests] = useState<Array<{ id: string; requestedAt: string; learnerProfile: { id: string; displayName: string } }>>([]);

  useEffect(() => {
    if (educatorId) return;
    void (async () => {
      const { EducatorStorage } = await import('../../infra/storage/educator-storage');
      const { httpClient: hc } = await import('../../infra/api/http-client');
      const token = await EducatorStorage.getAuthToken();
      const profile = await EducatorStorage.getAuthProfile();
      if (token) hc.setAuthToken(token);
      if (profile?.id) setEducatorId(profile.id);
    })();
  }, [educatorId]);

  const fetchLearners = useCallback(async () => {
    if (!educatorId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const raw = await httpClient.get<LearnerItem[] | { items: LearnerItem[] }>(
        `/cadastros/alfabetizandos?educatorId=${educatorId}`,
      );
      const items = Array.isArray(raw) ? raw : (raw as { items?: LearnerItem[] }).items ?? [];
      setLearners(items);
    } catch {
      // Mantem lista vazia.
    }
    setIsLoading(false);
  }, [educatorId]);

  const fetchLockedSessions = useCallback(async () => {
    if (!educatorId) return;
    try {
      const data = await httpClient.get<LockedSession[]>(`/cadastros/sessoes-bloqueadas?educatorId=${educatorId}`);
      setLockedSessions(data);
    } catch {
      // Mantem bloqueios vazios.
    }
  }, [educatorId]);

  const fetchOpenHelpAlerts = useCallback(async () => {
    // Help alerts chegam via realtime — este fetch HTTP é suplementar
    // e foi removido pois o endpoint /painel/fila retorna TutorLearnerLink
    // (vínculos pendentes) que não corresponde a pedidos de ajuda.
  }, []);

  const fetchPendingSessionRequests = useCallback(async () => {
    if (!educatorId) return;
    try {
      const data = await httpClient.get<Array<{ id: string; requestedAt: string; learnerProfile: { id: string; displayName: string } }>>(
        `/cadastros/sessoes-confirmacao?educatorId=${educatorId}`,
      );
      setPendingSessionRequests(data);
    } catch {
      // Silencioso — não bloqueia o fluxo principal.
    }
  }, [educatorId]);

  const fetchTutorials = useCallback(async () => {
    if (!educatorId) {
      setTutorialsLoading(false);
      return;
    }

    setTutorialsLoading(true);
    try {
      const raw = await httpClient.get<Tutorial[]>(`/painel/tutoriais?educatorId=${educatorId}`);
      setTutorials(sortTutorials(raw ?? []));
    } catch {
      setTutorials([]);
    } finally {
      setTutorialsLoading(false);
    }
  }, [educatorId]);

  useEffect(() => {
    void fetchLearners();
    void fetchLockedSessions();
    void fetchOpenHelpAlerts();
    void fetchTutorials();
    void fetchPendingSessionRequests();
  }, [fetchLearners, fetchLockedSessions, fetchOpenHelpAlerts, fetchTutorials, fetchPendingSessionRequests]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void fetchLearners();
      void fetchLockedSessions();
      void fetchOpenHelpAlerts();
      void fetchTutorials();
      void fetchPendingSessionRequests();
    });
    return unsubscribe;
  }, [fetchLearners, fetchLockedSessions, fetchOpenHelpAlerts, fetchTutorials, fetchPendingSessionRequests, navigation]);

  const learnerMap = useMemo(
    () => new Map(learners.map((learner) => [learner.id, { displayName: learner.displayName, phoneDigits: learner.phoneDigits }])),
    [learners],
  );

  const { helpAlerts, clearHelpAlert, onlineLearnerIds } = useEducatorHomeRealtime({
    educatorId,
    getLearnerInfo: (id) => learnerMap.get(id),
    onLockEvent: () => { void fetchLockedSessions(); },
  });

  const mergedHelpAlerts = useMemo(() => {
    const merged = new Map<string, HelpAlert>();

    for (const alert of seededAlerts) {
      const learnerInfo = learnerMap.get(alert.learnerId);
      if (!learnerInfo && learners.length > 0) continue;
      merged.set(alert.learnerId, {
        ...alert,
        displayName: learnerInfo?.displayName ?? alert.displayName,
        phoneDigits: learnerInfo?.phoneDigits ?? alert.phoneDigits,
      });
    }

    for (const alert of helpAlerts) {
      const learnerInfo = learnerMap.get(alert.learnerId);
      if (!learnerInfo && learners.length > 0) continue;
      merged.set(alert.learnerId, {
        ...alert,
        displayName: learnerInfo?.displayName ?? alert.displayName,
        phoneDigits: learnerInfo?.phoneDigits ?? alert.phoneDigits,
      });
    }

    return [...merged.values()].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [helpAlerts, learnerMap, learners.length, seededAlerts]);

  const handleClearHelpAlert = useCallback((learnerId: string) => {
    clearHelpAlert(learnerId);
    setSeededAlerts((prev) => prev.filter((alert) => alert.learnerId !== learnerId));
  }, [clearHelpAlert]);

  function dismissLockedSession(sessionId: string) {
    setDismissedLockedIds((prev) => new Set([...prev, sessionId]));
  }

  async function handleUnlockSession(learnerId: string) {
    try {
      await httpClient.put(`/sessions/${learnerId}/lock`, { isLocked: false });
      dismissLockedSession(learnerId);
      void fetchLockedSessions();
    } catch {
      // Reconciliado no proximo refresh.
    }
  }

  const visibleLockedSessions = lockedSessions.filter((session) => !dismissedLockedIds.has(session.id));
  const notificationCount = mergedHelpAlerts.length + visibleLockedSessions.length + pendingSessionRequests.length;
  const notificationBadgeLabel = notificationCount > 9 ? '9+' : String(notificationCount);
  const completedTutorialCount = getCompletedTutorialCount(tutorials);
  const obrigatorioTutorials = tutorials.filter((t) => t.tags.includes('tutorial-obrigatorio'));
  const tutorialsReady =
    tutorials.length === 0 ||
    (obrigatorioTutorials.length > 0
      ? obrigatorioTutorials.every((t) => t.completion?.is_completed === true)
      : completedTutorialCount === tutorials.length);
  const shouldGateByTutorials = !tutorialsLoading && tutorials.length > 0 && !tutorialsReady;
  const tutorialProgressPct = tutorials.length > 0 ? (completedTutorialCount / tutorials.length) * 100 : 0;

  useEffect(() => {
    if (!shouldGateByTutorials) return;
    setIsTrackListOpen(false);
  }, [shouldGateByTutorials]);

  const handleNewLearner = () => {
    navigation.navigate('LearnerOnboardingStep1', { isEducatorFlow: true });
  };

  const handleOpenLearner = (item: LearnerItem) => {
    navigation.navigate('EducatorLearningMode', {
      fullName: educatorName,
      educatorId,
      learnerName: item.displayName,
      learnerId: item.id,
    });
  };

  const learnersInProgress = useMemo(() => {
    const groups = new Map<string, { title: string; items: Array<{ id: string; name: string; learner: LearnerItem }> }>();

    for (const learner of learners) {
      const groupName = normalizeGroupName(learner.grupo);
      const stageLabel = normalizeStageLabel(learner.etapa);
      const key = `${groupName ?? 'individual'}-${stageLabel}`;
      const title = groupName ? `${groupName} (${stageLabel})` : `Alfabetização individual (${stageLabel})`;
      const current = groups.get(key) ?? { title, items: [] };
      current.items.push({ id: learner.id, name: learner.displayName, learner });
      groups.set(key, current);
    }

    return [...groups.values()].map((group) => ({
      ...group,
      items: [...group.items].sort((first, second) => first.name.localeCompare(second.name)),
    }));
  }, [learners]);

  const tutorialPreviewLabel = tutorials.length > 0
    ? `VIDEO ${String(Math.min(completedTutorialCount + 1, tutorials.length)).padStart(2, '0')}`
    : 'VIDEO 1';
  const highlightedTutorial = tutorials.find((tutorial, index) => isTutorialUnlocked(tutorials, index)) ?? tutorials[0] ?? null;
  const tutorialPreviewTitle = highlightedTutorial?.title ?? 'Tutoriais obrigatorios';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {brandLogoUri
              ? <SvgUri uri={brandLogoUri} width={84} height={50} />
              : <ActivityIndicator size="small" color="#111827" />}
          </View>

          {!shouldGateByTutorials ? (
            <Pressable
              style={styles.notificationButton}
              onPress={() => setIsTrackListOpen(false)}
            >
              <SvgXml xml={ICON_BELL} width={26} height={26} />
              {notificationCount > 0 && <View style={styles.badge} />}
            </Pressable>
          ) : (
            <View style={styles.notificationButtonPlaceholder} />
          )}
        </View>

        {!shouldGateByTutorials && !isTrackListOpen && (
          <View style={styles.notificationsPanel}>
            <Text style={styles.notificationsTitle}>
              Pedidos de apoio e bloqueios preventivos de tela:
            </Text>

            {notificationCount === 0 ? (
              <View style={styles.notificationEmpty}>
                <Text style={styles.notificationEmptyTitle}>Nenhum pedido agora</Text>
                <Text style={styles.notificationEmptyText}>
                  Quando um alfabetizando precisar de apoio, o aviso aparece aqui.
                </Text>
              </View>
            ) : (
              <>
                {mergedHelpAlerts.map((item) => (
                  <NotificationRow
                    key={`help-${item.learnerId}`}
                    name={item.displayName}
                    date={formatDate(item.timestamp)}
                    title="Pedido de apoio"
                    desc="Verifique a tela atual do alfabetizando e entre em contato se necessario."
                    phoneDigits={item.phoneDigits}
                    onContactPress={() => handleClearHelpAlert(item.learnerId)}
                    onPress={() => {
                      handleClearHelpAlert(item.learnerId);
                      navigation.navigate('EducatorLearningMode', {
                        fullName: educatorName,
                        educatorId,
                        learnerName: item.displayName,
                        learnerId: item.learnerId,
                      });
                    }}
                  />
                ))}

                {visibleLockedSessions.map((item) => (
                  <NotificationRow
                    key={`lock-${item.id}`}
                    name={item.displayName}
                    date={item.session?.sessionState?.updatedAt
                      ? formatDate(item.session.sessionState.updatedAt)
                      : undefined}
                    title="Tela bloqueada"
                    desc="Toque em LIBERAR SESSAO para desbloquear, ou em Ver detalhes para acompanhar a tela."
                    phoneDigits={item.phoneDigits}
                    onContactPress={() => dismissLockedSession(item.id)}
                    onUnlockPress={() => { void handleUnlockSession(item.id); }}
                    onPress={() => {
                      navigation.navigate('EducatorLearningMode', {
                        fullName: educatorName,
                        educatorId,
                        learnerName: item.displayName,
                        learnerId: item.id,
                      });
                    }}
                  />
                ))}

                {pendingSessionRequests.map((req) => (
                  <Pressable
                    key={`session-req-${req.id}`}
                    style={styles.sessionRequestRow}
                    onPress={() => navigation.navigate('EducatorSessionConfirm', {
                      educatorId: educatorId ?? '',
                      fullName: educatorName,
                    })}
                  >
                    <View style={styles.sessionRequestDot} />
                    <View style={styles.sessionRequestBody}>
                      <Text style={styles.sessionRequestTitle}>Confirmação de sessão</Text>
                      <Text style={styles.sessionRequestName}>{req.learnerProfile.displayName}</Text>
                      <Text style={styles.sessionRequestHint}>Toque para confirmar ou recusar o acesso</Text>
                    </View>
                    <Text style={styles.sessionRequestChevron}>›</Text>
                  </Pressable>
                ))}
              </>
            )}

            <Pressable
              style={styles.linkInvitesButton}
              onPress={() => navigation.navigate('EducatorLinkConfirm', {
                educatorId: educatorId ?? '',
                fullName: educatorName,
              })}
            >
              <Text style={styles.linkInvitesText}>VER VINCULOS E CONVITES</Text>
            </Pressable>
          </View>
        )}

        {shouldGateByTutorials ? (
          <View style={styles.tutorialLockedSection}>
            <Text style={styles.tutorialLockedWelcome}>
              Aqui você ajuda pessoas a lerem o mundo à sua volta. O programa é gratuito.
            </Text>
            <Text style={styles.tutorialLockedWelcome2}>
              Alfabetize quantas pessoas quiser. Você ainda ganha pontuação e certificados para mostrar que está transformando a vida das pessoas.
            </Text>
            <View style={styles.tutorialLockedDivider} />
            <Text style={styles.tutorialLockedDescription}>
              Para participar de nosso programa, você precisa assistir aos vídeos tutoriais.
              {tutorials.length > 0 ? ` São apenas ${tutorials.length} vídeos.` : ''} Todos bem curtinhos. E vão ajudá-lo a entender toda a sua trajetória em nosso aplicativo.
            </Text>

            <Pressable
              style={styles.homeTutorialPreview}
              onPress={() => navigation.navigate('EducatorTutorials', { educatorId })}
            >
              <TutorialPreviewMedia tutorial={highlightedTutorial} label={tutorialPreviewLabel} large />
            </Pressable>

            {tutorialsLoading ? (
              <ActivityIndicator color="#111111" style={styles.loader} />
            ) : tutorials.length > 0 ? (
              <Text style={styles.tutorialLockedProgress}>
                {completedTutorialCount} de {tutorials.length} vídeos assistidos
              </Text>
            ) : null}
          </View>
        ) : isTrackListOpen ? (
          <View style={styles.inProgressPanel}>
            <Text style={styles.inProgressTitle}>Alfabetização em andamento:</Text>

            {learnersInProgress.length === 0 ? (
              <View style={styles.inProgressEmptyWrap}>
                <Text style={styles.emptyText}>Nenhum alfabetizando em andamento.</Text>
                <Text style={styles.inProgressEmptyHint}>
                  Cadastre um alfabetizando na tela inicial para começar.
                </Text>
              </View>
            ) : (
              learnersInProgress.map((group) => (
                <View key={group.title} style={styles.inProgressGroup}>
                  <Text style={styles.inProgressGroupTitle}>{group.title}</Text>
                  {group.items.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.inProgressLearnerRow}
                      onPress={() => handleOpenLearner(item.learner)}
                      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}
                    >
                      <View style={[
                        styles.presenceDot,
                        onlineLearnerIds.has(item.id) ? styles.presenceDotOnline : styles.presenceDotOffline,
                      ]} />
                      <Text style={styles.inProgressLearnerName}>{item.name}</Text>
                      <Text style={styles.inProgressChevron}>›</Text>
                    </Pressable>
                  ))}
                </View>
              ))
            )}
          </View>
        ) : (
          <>
            <Pressable style={styles.newLearnerBtn} onPress={handleNewLearner}>
              <SvgXml xml={ICON_PLUS} width={14} height={14} />
              <Text style={styles.newLearnerLabel}>NOVO ALFABETIZANDO</Text>
            </Pressable>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Alfabetizandos</Text>
              <Pressable
                hitSlop={12}
                style={styles.searchToggle}
                onPress={() => {
                  setIsTrackListOpen(true);
                }}
              >
                <SvgXml xml={ICON_SEARCH} width={22} height={22} />
              </Pressable>
            </View>

            {isLoading ? (
              <ActivityIndicator style={styles.loader} color="#111111" />
            ) : learners.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum alfabetizando cadastrado ainda.</Text>
            ) : (
              <View>
                {learners.map((item) => (
                  <Pressable key={item.id} style={styles.learnerRow} onPress={() => handleOpenLearner(item)}>
                    <View style={[styles.presenceDot, onlineLearnerIds.has(item.id) ? styles.presenceDotOnline : styles.presenceDotOffline]} />
                    <Text style={styles.learnerName}>
                      {item.displayName} ({normalizeStageLabel(item.etapa)})
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Pressable style={styles.bottomPlus} onPress={handleNewLearner}>
              <SvgXml xml={ICON_PLUS} width={20} height={20} />
            </Pressable>
          </>
        )}
      </ScrollView>

      <EducatorBottomMenu
        active={isTrackListOpen ? 'acompanhar' : 'inicio'}
        onInicioPress={() => {
          setIsTrackListOpen(false);
        }}
        onTutorialPress={() => navigation.navigate('EducatorTutorials', { educatorId })}
        onAcompanharPress={() => {
          if (shouldGateByTutorials) {
            navigation.navigate('EducatorTutorials', { educatorId });
            return;
          }

          setIsTrackListOpen(true);
        }}
        onPontuacaoPress={() =>
          educatorId
            ? navigation.navigate('EducatorScore', { educatorId, fullName: educatorName })
            : undefined
        }
        onPerfilPress={() => navigation.navigate('EducatorProfile')}
      />
    </SafeAreaView>
  );
}

function NotificationRow({
  name,
  date,
  title,
  desc,
  phoneDigits,
  onPress,
  onContactPress,
  onUnlockPress,
}: {
  name: string;
  date?: string;
  title: string;
  desc: string;
  phoneDigits: string | null;
  onPress: () => void;
  onContactPress?: () => void;
  onUnlockPress?: () => void;
}) {
  return (
    <View style={styles.notificationRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir notificacao de ${name}`}
        style={styles.notificationTextBlock}
        onPress={onPress}
      >
        <View style={styles.notificationMetaLine}>
          <Text style={styles.notificationType}>{title}</Text>
          <Text style={styles.notificationDate}>{date ? `dia ${date}` : 'agora'}</Text>
        </View>
        <Text style={styles.notificationName}>{name}</Text>
        <Text style={styles.notificationDesc}>{desc}</Text>
        <View style={styles.notificationRowActions}>
          <Text style={styles.notificationLink}>Ver detalhes</Text>
          {onUnlockPress && (
            <Pressable
              hitSlop={8}
              style={styles.unlockButton}
              onPress={(event) => {
                event.stopPropagation?.();
                onUnlockPress();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Liberar sessao de ${name}`}
            >
              <Text style={styles.unlockButtonText}>LIBERAR SESSAO</Text>
            </Pressable>
          )}
        </View>
      </Pressable>
      <View style={styles.notificationActions}>
        <Pressable
          hitSlop={10}
          style={styles.notificationIconAction}
          onPress={() => {
            if (phoneDigits) {
              void Linking.openURL(`tel:+55${phoneDigits}`);
              onContactPress?.();
            }
          }}
        >
          <SvgXml xml={ICON_PHONE} width={20} height={20} />
        </Pressable>
        <Pressable
          hitSlop={10}
          style={styles.notificationIconAction}
          onPress={() => {
            if (phoneDigits) {
              void Linking.openURL(`https://wa.me/55${phoneDigits}`);
              onContactPress?.();
            }
          }}
        >
          <SvgXml xml={ICON_WHATSAPP} width={20} height={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 130,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  notificationButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationButtonPlaceholder: {
    width: 36,
    height: 36,
  },
  badge: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  notificationsPanel: {
    marginBottom: 22,
  },
  notificationsTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
  },
  notificationEmpty: {
    paddingVertical: 18,
  },
  notificationEmptyTitle: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },
  notificationEmptyText: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  notificationRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  notificationTextBlock: {
    flex: 1,
  },
  notificationMetaLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  notificationType: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notificationDate: {
    color: '#777777',
    fontSize: 11,
  },
  notificationName: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 21,
  },
  notificationDesc: {
    color: '#333333',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  notificationRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  notificationLink: {
    color: '#111111',
    fontSize: 12,
    fontWeight: '800',
  },
  unlockButton: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#111111',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
  },
  unlockButtonText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  notificationActions: {
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIconAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  linkInvitesButton: {
    marginTop: 14,
    borderRadius: 7,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkInvitesText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  sessionRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginTop: 6,
  },
  sessionRequestDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ea580c',
    flexShrink: 0,
  },
  sessionRequestBody: { flex: 1, gap: 1 },
  sessionRequestTitle: { fontSize: 11, fontWeight: '700', color: '#ea580c', textTransform: 'uppercase', letterSpacing: 0.3 },
  sessionRequestName: { fontSize: 14, fontWeight: '600', color: '#111111' },
  sessionRequestHint: { fontSize: 12, color: '#888888', marginTop: 1 },
  sessionRequestChevron: { fontSize: 20, color: '#888888', lineHeight: 22 },
  tutorialLockedSection: {
    paddingTop: 4,
  },
  tutorialLockedWelcome: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 14,
  },
  tutorialLockedWelcome2: {
    color: '#111111',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 18,
  },
  tutorialLockedDivider: {
    borderTopWidth: 1,
    borderTopColor: '#cccccc',
    borderStyle: 'dashed',
    marginBottom: 18,
  },
  tutorialLockedDescription: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 18,
  },
  homeTutorialPreview: {
    height: 220,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#d9d9d9',
  },
  tutorialPreviewFrame: {
    ...StyleSheet.absoluteFillObject,
  },
  tutorialPreviewFrameLarge: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  tutorialPreviewFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#d9d9d9',
  },
  tutorialPreviewShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 17, 17, 0.06)',
  },
  tutorialPreviewLogoWrap: {
    position: 'absolute',
    top: 14,
    left: 14,
  },
  tutorialPreviewLogoLarge: {
    width: 56,
    height: 34,
  },
  tutorialPreviewLogoSmall: {
    width: 40,
    height: 24,
  },
  tutorialPreviewChip: {
    position: 'absolute',
    left: 14,
    bottom: 14,
    backgroundColor: 'rgba(17,17,17,0.78)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tutorialPreviewChipText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  tutorialPreviewPlayWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tutorialLockedProgress: {
    marginTop: 12,
    color: '#555555',
    fontSize: 13,
    fontWeight: '600',
  },
  newLearnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#111111',
    paddingVertical: 13,
    marginBottom: 22,
  },
  newLearnerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },
  searchToggle: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  learnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#bdbdbd',
  },
  learnerName: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
  },
  presenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  presenceDotOnline: {
    backgroundColor: '#22c55e',
  },
  presenceDotOffline: {
    backgroundColor: '#9ca3af',
  },
  inProgressPanel: {
    paddingTop: 12,
  },
  inProgressTitle: {
    color: '#111111',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 24,
  },
  inProgressEmptyWrap: {
    paddingTop: 8,
    gap: 6,
  },
  inProgressEmptyHint: {
    color: '#888888',
    fontSize: 13,
    lineHeight: 19,
  },
  inProgressGroup: {
    marginBottom: 28,
  },
  inProgressGroupTitle: {
    color: '#777777',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  inProgressLearnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eeeeee',
    gap: 10,
  },
  inProgressLearnerName: {
    flex: 1,
    color: '#111111',
    fontSize: 16,
    lineHeight: 22,
  },
  inProgressChevron: {
    color: '#9ca3af',
    fontSize: 20,
    lineHeight: 22,
    fontWeight: '300',
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  loader: {
    marginTop: 20,
  },
  bottomPlus: {
    marginTop: 28,
    alignSelf: 'center',
    padding: 8,
  },
});
