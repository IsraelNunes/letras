import { useCallback, useEffect, useState } from 'react';
import { useAssets } from 'expo-asset';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { EducatorRootStackParamList } from '../../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorLearningMode'>;

interface LearnerDetail {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  cpf?: string;
  tutor?: string;
  grupo?: string;
  etapa?: string;
  status?: string;
  progresso?: Array<{ etapa: string; progresso: number; atividades: number; concluidas: number }>;
  historico?: Array<{ id: string; tipo: string; data: string; obs: string; status: string }>;
}

function normalizeDigits(value?: string | null) {
  return String(value ?? '').replace(/\D/g, '');
}

function formatPhone(phone?: string | null) {
  const digits = normalizeDigits(phone).slice(0, 11);
  if (digits.length !== 11) return phone || '-';
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function fallbackValue(value?: string | null) {
  const normalized = String(value ?? '').trim();
  return normalized.length > 0 ? normalized : '-';
}

export function EducatorLearningModeView({ navigation, route }: Props) {
  const [learner, setLearner] = useState<LearnerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(route.params?.learnerId));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [assets] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  const educatorName = route.params?.fullName?.trim() || 'Educador';
  const educatorId = route.params?.educatorId;
  const learnerId = route.params?.learnerId;
  const learnerName = route.params?.learnerName?.trim() || 'O alfabetizando';

  const goHome = () => navigation.navigate('EducatorHome', { fullName: educatorName, educatorId });

  const loadLearner = useCallback(async () => {
    if (!learnerId) {
      setIsLoading(false);
      return;
    }

    try {
      setErrorMessage(null);
      setIsLoading(true);
      const data = await httpClient.get<LearnerDetail>(`/cadastros/alfabetizandos/${learnerId}`);
      setLearner(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nao foi possivel carregar o alfabetizando.');
    } finally {
      setIsLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    void loadLearner();
  }, [loadLearner]);

  const titleName = learner?.nome || learnerName;
  const phoneDigits = normalizeDigits(learner?.telefone);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => (navigation.canGoBack() ? navigation.goBack() : goHome())} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {logoUri ? (
              <SvgUri uri={logoUri} width={84} height={50} />
            ) : (
              <ActivityIndicator size="small" color="#111827" />
            )}
          </View>
          <Pressable style={styles.notificationButton} onPress={() => {}}>
            <Image source={require('../../../assets/notificacao.png')} style={styles.notificationIcon} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.screenTitle}>Detalhes do alfabetizando</Text>
          <Text style={styles.learnerTitle}>{titleName}</Text>

          {isLoading ? (
            <ActivityIndicator style={styles.loader} color="#111827" />
          ) : errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : (
            <>
              <View style={styles.infoCard}>
                <InfoRow label="CPF ou passaporte" value={fallbackValue(learner?.cpf)} />
                <InfoRow label="Celular" value={formatPhone(learner?.telefone)} />
                <InfoRow label="Email" value={fallbackValue(learner?.email)} />
                <InfoRow label="Tutor" value={fallbackValue(learner?.tutor || educatorName)} />
                <InfoRow label="Etapa" value={fallbackValue(learner?.etapa || 'Etapa 1')} />
                <InfoRow label="Status" value={fallbackValue(learner?.status)} />
              </View>

              <View style={styles.actions}>
                <Pressable
                  style={[styles.actionButton, !phoneDigits ? styles.actionButtonDisabled : null]}
                  disabled={!phoneDigits}
                  onPress={() => phoneDigits && Linking.openURL(`tel:+55${phoneDigits}`)}
                >
                  <Text style={styles.actionText}>LIGAR</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, !phoneDigits ? styles.actionButtonDisabled : null]}
                  disabled={!phoneDigits}
                  onPress={() => phoneDigits && Linking.openURL(`https://wa.me/55${phoneDigits}`)}
                >
                  <Text style={styles.actionText}>WHATSAPP</Text>
                </Pressable>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progresso</Text>
                {learner?.progresso?.length ? (
                  learner.progresso.map((item) => (
                    <View key={item.etapa} style={styles.progressRow}>
                      <Text style={styles.progressLabel}>{item.etapa}</Text>
                      <Text style={styles.progressValue}>{item.progresso}%</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.mutedText}>Ainda nao ha progresso registrado.</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Historico recente</Text>
                {learner?.historico?.length ? (
                  learner.historico.slice(0, 3).map((item) => (
                    <View key={item.id} style={styles.historyItem}>
                      <Text style={styles.historyType}>{item.tipo}</Text>
                      <Text style={styles.historyObs}>{item.obs}</Text>
                      <Text style={styles.historyDate}>{item.data}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.mutedText}>Nenhum historico recente.</Text>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <EducatorBottomMenu
        active="acompanhar"
        onInicioPress={goHome}
        onTutorialPress={goHome}
        onAcompanharPress={goHome}
        onPontuacaoPress={goHome}
        onPerfilPress={() => navigation.navigate('EducatorProfile')}
      />
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
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
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 130,
    backgroundColor: '#ededed',
  },
  backButton: { paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 4 },
  backText: { fontSize: 15, color: '#20385f', fontWeight: '500' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  notificationButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
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
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  body: {
    marginTop: 28,
  },
  loader: {
    marginTop: 32,
  },
  screenTitle: {
    color: '#505050',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  learnerTitle: {
    color: '#1a1a1a',
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 20,
  },
  errorText: {
    color: '#b42318',
    fontSize: 14,
    lineHeight: 21,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d8d8d8',
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  infoLabel: {
    fontSize: 13,
    color: '#646464',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#111111',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.35,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '700',
    marginBottom: 10,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#d8d8d8',
    paddingVertical: 9,
  },
  progressLabel: {
    color: '#111111',
    fontSize: 14,
  },
  progressValue: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  mutedText: {
    color: '#666666',
    fontSize: 14,
    lineHeight: 20,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#d8d8d8',
    paddingVertical: 10,
  },
  historyType: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },
  historyObs: {
    color: '#333333',
    fontSize: 13,
    marginTop: 2,
  },
  historyDate: {
    color: '#666666',
    fontSize: 12,
    marginTop: 4,
  },
});
