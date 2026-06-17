import { useAssets } from 'expo-asset';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri, SvgXml } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { HelpAlert, useEducatorHomeRealtime } from '../../hooks/useEducatorHomeRealtime';
import { EducatorRootStackParamList } from '../../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorHome'>;

interface LearnerItem {
  id: string;
  displayName: string;
  phoneDigits: string | null;
  learnerThemes: Array<{ theme: { name: string } }>;
}

interface LockedSession {
  id: string;
  displayName: string;
  phoneDigits: string | null;
  session: {
    sessionState: { currentView: string; updatedAt: string } | null;
  } | null;
}

const ICON_PLUS = `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M10 1H6V6L1 6V10H6V15H10V10H15V6L10 6V1Z" fill="#111111"/></svg>`;

const ICON_SEARCH = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="#111111" stroke-width="2"/><line x1="16.5" y1="16.5" x2="21" y2="21" stroke="#111111" stroke-width="2" stroke-linecap="round"/></svg>`;

const ICON_PHONE = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M6.6 10.8c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1H5.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.24 1.02L6.6 10.8z" fill="#111111"/></svg>`;

const ICON_WHATSAPP = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="#111111"/></svg>`;

const ICON_GROUP = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#555" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="#555" stroke-width="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#555" stroke-width="2" stroke-linecap="round"/><path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#555" stroke-width="2" stroke-linecap="round"/></svg>`;

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function EducatorHomeView({ navigation, route }: Props) {
  const [logoAsset] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = logoAsset?.[0]?.localUri ?? logoAsset?.[0]?.uri;

  const educatorName = route.params?.fullName?.trim() || 'Alfabetizador';
  const [educatorId, setEducatorId] = useState<string | undefined>(route.params?.educatorId);

  const [learners, setLearners] = useState<LearnerItem[]>([]);
  const [lockedSessions, setLockedSessions] = useState<LockedSession[]>([]);
  const [dismissedLockedIds, setDismissedLockedIds] = useState(new Set<string>());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(Boolean(route.params?.openNotifications));

  // Restaura educatorId do AsyncStorage se não veio nos params (ex: navegação por URL)
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
    if (!educatorId) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const raw = await httpClient.get<LearnerItem[] | { items: LearnerItem[] }>(
        `/cadastros/alfabetizandos?educatorId=${educatorId}`,
      );
      const items = Array.isArray(raw) ? raw : (raw as { items?: LearnerItem[] }).items ?? [];
      setLearners(items);
    } catch { /* ignora — lista permanece vazia */ }
    setIsLoading(false);
  }, [educatorId]);

  const fetchLockedSessions = useCallback(async () => {
    if (!educatorId) return;
    try {
      const data = await httpClient.get<LockedSession[]>(`/cadastros/sessoes-bloqueadas?educatorId=${educatorId}`);
      setLockedSessions(data);
    } catch { /* ignora */ }
  }, [educatorId]);

  useEffect(() => {
    void fetchLearners();
    void fetchLockedSessions();
  }, [fetchLearners, fetchLockedSessions]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      void fetchLearners();
      void fetchLockedSessions();
    });
    return unsubscribe;
  }, [fetchLearners, fetchLockedSessions, navigation]);

  // Mapa de lookup learnerId → {displayName, phoneDigits} para o hook de socket
  const learnerMap = useMemo(
    () => new Map(learners.map((l) => [l.id, { displayName: l.displayName, phoneDigits: l.phoneDigits }])),
    [learners],
  );

  const { helpAlerts, clearHelpAlert, onlineLearnerIds } = useEducatorHomeRealtime({
    educatorId,
    getLearnerInfo: (id) => learnerMap.get(id),
    onLockEvent: () => { void fetchLockedSessions(); },
  });

  function dismissLockedSession(sessionId: string) {
    setDismissedLockedIds((prev) => new Set([...prev, sessionId]));
  }

  async function handleUnlockSession(learnerId: string) {
    try {
      await httpClient.put(`/sessions/${learnerId}/lock`, { isLocked: false });
      dismissLockedSession(learnerId);
      void fetchLockedSessions();
    } catch { /* ignora — estado será reconciliado no próximo fetch */ }
  }

  const visibleLockedSessions = lockedSessions.filter((s) => !dismissedLockedIds.has(s.id));
  const notificationCount = helpAlerts.length + visibleLockedSessions.length;

  useEffect(() => {
    if (route.params?.openNotifications) setIsNotificationsOpen(true);
  }, [route.params?.openNotifications]);

  const filteredLearners = searchQuery
    ? learners.filter((l) => l.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    : learners;

  const handleNewLearner = () => {
    navigation.navigate('LearnerOnboardingStep1', { isEducatorFlow: true });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {logoUri
              ? <SvgUri uri={logoUri} width={84} height={50} />
              : <ActivityIndicator size="small" color="#111827" />}
          </View>
          <Pressable
            style={styles.notificationButton}
            onPress={() => setIsNotificationsOpen((current) => !current)}
          >
            <Image source={require('../../../assets/notificacao.png')} style={styles.notificationIcon} />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Alertas — bloqueios (HTTP) + pedidos de ajuda (socket). Só aparece quando há itens */}
        {false && (
          <View style={styles.alertsSection}>
            <Text style={styles.alertsTitle}>
              Pedidos de apoio e bloqueios preventivos de tela:
            </Text>

            {/* Pedidos de ajuda em tempo real (via socket, não persistidos) */}
            {helpAlerts.map((item: HelpAlert) => (
              <AlertRow
                key={`help-${item.learnerId}`}
                name={item.displayName}
                date={formatDate(item.timestamp)}
                desc="Clique para ver a tela em que este alfabetizando precisa de apoio. Em seguida, ligue por telefone ou Whatsapp."
                phoneDigits={item.phoneDigits}
                onContactPress={() => clearHelpAlert(item.learnerId)}
                onPress={() => {
                  clearHelpAlert(item.learnerId);
                  navigation.navigate('EducatorLearningMode', {
                    fullName: educatorName,
                    educatorId,
                    learnerName: item.displayName,
                    learnerId: item.learnerId,
                  });
                }}
              />
            ))}

            {/* Sessões bloqueadas (via HTTP, persistidas, atualizadas em tempo real via socket) */}
            {visibleLockedSessions.map((item) => (
              <AlertRow
                key={`lock-${item.id}`}
                name={item.displayName}
                date={item.session?.sessionState?.updatedAt
                  ? formatDate(item.session.sessionState.updatedAt)
                  : undefined}
                desc="Clique para ver a tela em que este alfabetizando teve a tela bloqueada. Em seguida, ligue por telefone ou Whatsapp."
                phoneDigits={item.phoneDigits}
                onContactPress={() => dismissLockedSession(item.id)}
                onPress={() =>
                  navigation.navigate('EducatorLearningMode', {
                    fullName: educatorName,
                    educatorId,
                    learnerName: item.displayName,
                    learnerId: item.id,
                  })
                }
              />
            ))}
          </View>
        )}

        {/* Botão novo alfabetizando */}
        {isNotificationsOpen && (
          <View style={styles.notificationsPanel}>
            <View style={styles.notificationsHeader}>
              <View style={styles.notificationsTitleBlock}>
                <Text style={styles.notificationsTitle}>Notificacoes</Text>
                <Text style={styles.notificationsSubtitle}>
                  Pedidos de apoio e bloqueios preventivos aparecem no sino.
                </Text>
              </View>
              <Pressable style={styles.notificationsClose} onPress={() => setIsNotificationsOpen(false)}>
                <Text style={styles.notificationsCloseText}>Fechar</Text>
              </Pressable>
            </View>

            {notificationCount === 0 ? (
              <View style={styles.notificationEmpty}>
                <Text style={styles.notificationEmptyTitle}>Nenhum pedido agora</Text>
                <Text style={styles.notificationEmptyText}>Quando um alfabetizando precisar de apoio, o aviso aparece aqui.</Text>
              </View>
            ) : (
              <>
                {helpAlerts.map((item: HelpAlert) => (
                  <NotificationRow
                    key={`help-${item.learnerId}`}
                    name={item.displayName}
                    date={formatDate(item.timestamp)}
                    title="Pedido de apoio"
                    desc="Verifique a tela atual do alfabetizando e entre em contato se necessario."
                    phoneDigits={item.phoneDigits}
                    onContactPress={() => clearHelpAlert(item.learnerId)}
                    onPress={() => {
                      clearHelpAlert(item.learnerId);
                      setIsNotificationsOpen(false);
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
                      setIsNotificationsOpen(false);
                      navigation.navigate('EducatorLearningMode', {
                        fullName: educatorName,
                        educatorId,
                        learnerName: item.displayName,
                        learnerId: item.id,
                      });
                    }}
                  />
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

        <Pressable style={styles.newLearnerBtn} onPress={handleNewLearner}>
          <SvgXml xml={ICON_PLUS} width={14} height={14} />
          <Text style={styles.newLearnerLabel}>NOVO ALFABETIZANDO</Text>
        </Pressable>

        {/* Cabeçalho da lista */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alfabetizandos</Text>
          <Pressable
            hitSlop={12}
            style={styles.searchToggle}
            onPress={() => {
              setIsSearchVisible((v) => !v);
              if (isSearchVisible) setSearchQuery('');
            }}
          >
            {isSearchVisible
              ? <Text style={styles.searchClose}>✕</Text>
              : <SvgXml xml={ICON_SEARCH} width={22} height={22} />
            }
          </Pressable>
        </View>

        {isSearchVisible && (
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nome..."
            placeholderTextColor="#888"
            autoFocus
            returnKeyType="search"
            onSubmitEditing={() => setIsSearchVisible(searchQuery.length > 0)}
          />
        )}

        {/* Lista de alfabetizandos */}
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color="#111111" />
        ) : (
          <View>
            {filteredLearners.map((item) => {
              const themeName = item.learnerThemes?.[0]?.theme?.name;
              return (
                <Pressable
                  key={item.id}
                  style={styles.learnerRow}
                  onPress={() =>
                    navigation.navigate('EducatorLearningMode', {
                      fullName: educatorName,
                      educatorId,
                      learnerName: item.displayName,
                      learnerId: item.id,
                    })
                  }
                >
                  <View style={[styles.presenceDot, onlineLearnerIds.has(item.id) ? styles.presenceDotOnline : styles.presenceDotOffline]} />
                  <Text style={styles.learnerName}>
                    {item.displayName}
                    {themeName ? ` (${themeName})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Botão + na base da lista */}
        <Pressable style={styles.bottomPlus} onPress={handleNewLearner}>
          <SvgXml xml={ICON_PLUS} width={20} height={20} />
        </Pressable>

      </ScrollView>

      <EducatorBottomMenu
        active="inicio"
        onTutorialPress={() =>
          navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })
        }
        onAcompanharPress={() =>
          navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })
        }
        onPontuacaoPress={() =>
          navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })
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
              onPress={(e) => { e.stopPropagation?.(); onUnlockPress(); }}
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

function AlertRow({
  name,
  date,
  desc,
  phoneDigits,
  onPress,
  onContactPress,
}: {
  name: string;
  date?: string;
  desc: string;
  phoneDigits: string | null;
  onPress: () => void;
  onContactPress?: () => void;
}) {
  return (
    <View style={styles.alertRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ver tela de ${name}`}
        style={styles.alertTextBlock}
        onPress={onPress}
      >
        <Text style={styles.alertName}>
          {name}{date ? `, dia ${date}.` : '.'}
        </Text>
        <Text style={styles.alertDesc}>{desc}</Text>
        <View style={styles.alertOpenButton}>
          <Text style={styles.alertOpenButtonText}>VER TELA</Text>
        </View>
      </Pressable>
      <View style={styles.alertIcons}>
        <Pressable
          hitSlop={10}
          onPress={() => {
            if (phoneDigits) {
              void Linking.openURL(`tel:+55${phoneDigits}`);
              onContactPress?.();
            }
          }}
        >
          <SvgXml xml={ICON_PHONE} width={24} height={24} />
        </Pressable>
        <Pressable
          hitSlop={10}
          onPress={() => {
            if (phoneDigits) {
              void Linking.openURL(`https://wa.me/55${phoneDigits}`);
              onContactPress?.();
            }
          }}
        >
          <SvgXml xml={ICON_WHATSAPP} width={24} height={24} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ededed',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 130,
    backgroundColor: '#ededed',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  logoWrap: { minHeight: 50, justifyContent: 'center' },
  notificationButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  notificationIcon: { width: 22, height: 22, resizeMode: 'contain' },
  badge: {
    position: 'absolute',
    right: 1,
    top: 2,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#ffffff', fontSize: 9, fontWeight: '700' },

  // Alertas
  alertsSection: { marginBottom: 24 },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 14,
    lineHeight: 20,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  alertTextBlock: { flex: 1, paddingVertical: 4 },
  alertName: { fontSize: 14, fontWeight: '600', color: '#111111', lineHeight: 20 },
  alertDesc: { fontSize: 13, lineHeight: 19, color: '#222222', marginTop: 2 },
  alertOpenButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#111111',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ffffff',
  },
  alertOpenButtonText: {
    color: '#111111',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  alertIcons: { gap: 14, alignItems: 'center' },
  notificationsPanel: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d8d8d8',
    borderRadius: 8,
    padding: 14,
    marginBottom: 22,
  },
  notificationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  notificationsTitleBlock: { flex: 1 },
  notificationsTitle: { color: '#111111', fontSize: 18, fontWeight: '800' },
  notificationsSubtitle: { color: '#555555', fontSize: 13, lineHeight: 18, marginTop: 3 },
  notificationsClose: {
    borderWidth: 1,
    borderColor: '#c8d0dd',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  notificationsCloseText: { color: '#20385f', fontSize: 12, fontWeight: '700' },
  notificationEmpty: { paddingVertical: 18 },
  notificationEmptyTitle: { color: '#111111', fontSize: 15, fontWeight: '700' },
  notificationEmptyText: { color: '#666666', fontSize: 13, lineHeight: 19, marginTop: 4 },
  notificationRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  notificationTextBlock: { flex: 1 },
  notificationMetaLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  notificationType: {
    color: '#20385f',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  notificationDate: { color: '#777777', fontSize: 11 },
  notificationName: { color: '#111111', fontSize: 15, fontWeight: '800', lineHeight: 21 },
  notificationDesc: { color: '#333333', fontSize: 13, lineHeight: 19, marginTop: 3 },
  notificationLink: { color: '#20385f', fontSize: 12, fontWeight: '800' },
  notificationRowActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  unlockButton: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#15803d',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f0fdf4',
  },
  unlockButtonText: {
    color: '#15803d',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  notificationActions: { gap: 8, alignItems: 'center', justifyContent: 'center' },
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

  // Botão NOVO ALFABETIZANDO
  newLearnerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#f0e8b8',
    borderRadius: 6,
    paddingVertical: 13,
    marginBottom: 24,
  },
  newLearnerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.4,
  },

  // Cabeçalho da seção
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111111' },
  searchToggle: {
    width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#ebebeb',
  },
  searchClose: { fontSize: 14, color: '#111111', fontWeight: '700' },

  // Busca
  searchInput: {
    height: 38,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    paddingHorizontal: 12,
    color: '#111111',
    fontSize: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#c0c0c0',
  },

  // Linha da lista
  learnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#bdbdbd',
  },
  learnerName: { flex: 1, fontSize: 14, color: '#111111' },
  presenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  presenceDotOnline: { backgroundColor: '#22c55e' },
  presenceDotOffline: { backgroundColor: '#9ca3af' },

  loader: { marginTop: 20 },

  // Botão + da base
  bottomPlus: {
    marginTop: 28,
    alignSelf: 'center',
    padding: 8,
  },
});
