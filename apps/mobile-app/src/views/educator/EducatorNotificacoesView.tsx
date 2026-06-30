import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAssets } from 'expo-asset';
import { SvgUri } from 'react-native-svg';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { EducatorRootStackParamList } from '../../types';
import { httpClient } from '../../infra/api/http-client';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';
import { BellIcon } from '../shared/BellIcon';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorNotificacoes'>;

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  createdAt: string;
}

function formatStamp(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString('pt-BR');
  const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${data}, às ${hora}.`;
}

// Tipos com linha de timestamp separada (Figma). SUPPORT_DEADLINE e MILESTONE
// já trazem o tempo embutido no corpo, então não repetem a linha.
const STAMPED = new Set(['HELP_REQUEST', 'AUTO_LOCK', 'POINTS_EARNED']);

export function EducatorNotificacoesView({ navigation, route }: Props) {
  const [educatorId, setEducatorId] = useState<string | undefined>(route.params?.educatorId);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brand] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = brand?.[0]?.localUri ?? brand?.[0]?.uri;

  useEffect(() => {
    if (educatorId) return;
    void (async () => {
      const { EducatorStorage } = await import('../../infra/storage/educator-storage');
      const profile = await EducatorStorage.getAuthProfile();
      if (profile?.id) setEducatorId(profile.id);
    })();
  }, [educatorId]);

  const fetchNotifs = useCallback(async () => {
    if (!educatorId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await httpClient.get<{ items: NotificationItem[] }>(`/painel/notificacoes?educatorId=${educatorId}`);
      setItems(res?.items ?? []);
      void httpClient.post('/painel/notificacoes/marcar-lidas', { educatorId });
    } catch {
      setError('Não foi possível carregar as notificações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }, [educatorId]);

  useEffect(() => { void fetchNotifs(); }, [fetchNotifs]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          {logoUri ? <SvgUri uri={logoUri} width={84} height={50} /> : <View style={styles.logoPh} />}
        </View>
        <BellIcon size={22} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Suas notificações:</Text>

        {isLoading ? (
          <ActivityIndicator color="#111111" style={styles.loader} />
        ) : error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retry} onPress={() => void fetchNotifs()}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <Text style={styles.empty}>Nenhuma notificação por enquanto.</Text>
        ) : (
          <View style={styles.list}>
            {items.map((n) => (
              <View key={n.id} style={styles.item}>
                <Text style={styles.itemTitle}>{n.title}</Text>
                {n.body ? <Text style={styles.itemBody}>{n.body}</Text> : null}
                {STAMPED.has(n.type) ? <Text style={styles.itemStamp}>{formatStamp(n.createdAt)}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <EducatorBottomMenu
        active="inicio"
        onInicioPress={() => navigation.navigate('EducatorHome', {})}
        onTutorialPress={() => navigation.navigate('EducatorTutorials', { educatorId })}
        onPerfilPress={() => navigation.navigate('EducatorProfile')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  logoWrap: { minHeight: 50, justifyContent: 'center' },
  logoPh: { width: 84, height: 50 },
  scroll: { paddingHorizontal: 22, paddingBottom: 120, paddingTop: 4 },
  pageTitle: { color: '#111111', fontSize: 16, fontWeight: '800', marginBottom: 18 },
  list: { gap: 22 },
  item: { gap: 2 },
  itemTitle: { color: '#111111', fontSize: 15, fontWeight: '700', lineHeight: 22 },
  itemBody: { color: '#111111', fontSize: 14, lineHeight: 21 },
  itemStamp: { color: '#888888', fontSize: 14, lineHeight: 21 },
  loader: { marginTop: 40 },
  empty: { marginTop: 40, color: '#888888', fontSize: 14 },
  errorWrap: { marginTop: 40, alignItems: 'center', gap: 14 },
  errorText: { color: '#7d1f1f', fontSize: 14, textAlign: 'center' },
  retry: { borderRadius: 8, borderWidth: 1, borderColor: '#111111', paddingHorizontal: 18, paddingVertical: 10 },
  retryText: { color: '#111111', fontSize: 14, fontWeight: '700' },
});
