import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAssets } from 'expo-asset';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { EducatorRootStackParamList } from '../../types';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorLinkConfirm'>;

interface PendingLink {
  id: string;
  learnerProfile: {
    id: string;
    displayName: string;
    cpfOrPassport?: string | null;
    phoneDigits?: string | null;
    birthDate?: string | null;
    uf?: string | null;
    city?: string | null;
  };
}

function formatPhone(digits?: string | null) {
  if (!digits) return '—';
  const d = digits.replace(/\D/g, '').slice(0, 11);
  if (d.length < 10) return d;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function EducatorLinkConfirmView({ navigation, route }: Props) {
  const { educatorId, fullName } = route.params;

  const [assets] = useAssets([
    require('../../../assets/Logo-LETRAS.svg'),
    require('../../../assets/nao-confirmar.svg'),
    require('../../../assets/confirmar.svg'),
  ]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const negarUri = assets?.[1]?.localUri ?? assets?.[1]?.uri;
  const confirmarUri = assets?.[2]?.localUri ?? assets?.[2]?.uri;

  const [link, setLink] = useState<PendingLink | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchPendingLink = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await httpClient.get<PendingLink[]>(
        `/cadastros/vinculos?status=PENDING&educatorId=${educatorId}`,
      );
      setLink(data[0] ?? null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar solicitação.');
    } finally {
      setIsLoading(false);
    }
  }, [educatorId]);

  useEffect(() => {
    void fetchPendingLink();
  }, [fetchPendingLink]);

  const handleReject = async () => {
    if (!link || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await httpClient.patch(`/cadastros/vinculos/${link.id}`, {
        status: 'REJECTED',
        actorEducatorId: educatorId,
      });
      navigation.goBack();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao rejeitar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!link || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await httpClient.patch(`/cadastros/vinculos/${link.id}`, {
        status: 'CONFIRMED',
        actorEducatorId: educatorId,
      });
      navigation.replace('EducatorLinkSuccess', {
        learnerName: link.learnerProfile.displayName,
        educatorId,
        fullName,
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao confirmar.');
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          {logoUri ? (
            <SvgUri uri={logoUri} width={84} height={50} />
          ) : (
            <ActivityIndicator size="small" color="#111827" />
          )}
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color="#101010" />
          </View>
        ) : errorMessage ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : !link ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Nenhuma solicitação de vínculo pendente.</Text>
          </View>
        ) : (
          <View style={styles.body}>
            <Text style={styles.title}>
              O Alfabetizando enviou uma notificação para se vincular a você. Confirma a vinculação?
            </Text>

            <View style={styles.card}>
              <InfoRow label="Nome" value={link.learnerProfile.displayName} />
              <InfoRow label="CPF / Passaporte" value={link.learnerProfile.cpfOrPassport ?? '—'} />
              <InfoRow label="Celular" value={formatPhone(link.learnerProfile.phoneDigits)} />
              <InfoRow label="Data de Nascimento" value={link.learnerProfile.birthDate ?? '—'} />
              <InfoRow label="Cidade" value={link.learnerProfile.city ?? '—'} />
              <InfoRow label="UF" value={link.learnerProfile.uf ?? '—'} />
            </View>

            <View style={styles.actions}>
              <View style={styles.actionItem}>
                <Pressable
                  style={[styles.iconButton, isSubmitting && styles.iconButtonDisabled]}
                  disabled={isSubmitting}
                  onPress={() => void handleReject()}
                >
                  {negarUri ? (
                    <SvgUri uri={negarUri} width={56} height={56} />
                  ) : (
                    <ActivityIndicator size="small" color="#e01b24" />
                  )}
                </Pressable>
                <Text style={styles.actionLabel}>NÃO CONFIRMAR</Text>
              </View>

              <View style={styles.actionItem}>
                <Pressable
                  style={[styles.iconButton, isSubmitting && styles.iconButtonDisabled]}
                  disabled={isSubmitting}
                  onPress={() => void handleConfirm()}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#111111" />
                  ) : confirmarUri ? (
                    <SvgUri uri={confirmarUri} width={56} height={56} />
                  ) : (
                    <ActivityIndicator size="small" color="#111111" />
                  )}
                </Pressable>
                <Text style={styles.actionLabel}>CONFIRMAR</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingBottom: 60,
    backgroundColor: '#ededed',
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  centered: {
    marginTop: 80,
    alignItems: 'center',
  },
  errorText: {
    color: '#9e1b1b',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyText: {
    color: '#444444',
    fontSize: 14,
    textAlign: 'center',
  },
  body: {
    marginTop: 32,
    gap: 24,
  },
  title: {
    fontSize: 16,
    lineHeight: 24,
    color: '#141414',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  infoRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ececec',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#141414',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: 0.4,
  },
});
