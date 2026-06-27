import { useFocusEffect } from '@react-navigation/native';
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

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorSessionConfirm'>;

interface PendingRequest {
  id: string;
  requestedAt: string;
  learnerProfile: {
    id: string;
    displayName: string;
    cpfOrPassport: string | null;
  };
}

const DENIAL_REASONS = [
  'Não reconheço esta pessoa',
  'Desisti da sessão',
  'Outro motivo',
];

export function EducatorSessionConfirmView({ navigation, route }: Props) {
  const { educatorId, fullName } = route.params;

  const [assets] = useAssets([
    require('../../../assets/Logo-LETRAS.svg'),
    require('../../../assets/nao-confirmar.svg'),
    require('../../../assets/confirmar.svg'),
  ]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;
  const negarUri = assets?.[1]?.localUri ?? assets?.[1]?.uri;
  const confirmarUri = assets?.[2]?.localUri ?? assets?.[2]?.uri;

  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showReasonPicker, setShowReasonPicker] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await httpClient.get<PendingRequest[]>(
        `/cadastros/sessoes-confirmacao?educatorId=${educatorId}`,
      );
      setRequests(data);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao carregar solicitações.');
    } finally {
      setIsLoading(false);
    }
  }, [educatorId]);

  useEffect(() => {
    void fetchPending();
  }, [fetchPending]);

  useFocusEffect(
    useCallback(() => {
      void fetchPending();
    }, [fetchPending]),
  );

  const handleConfirm = async (requestId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(requestId);
    try {
      await httpClient.patch(`/cadastros/sessoes-confirmacao/${requestId}`, {
        status: 'CONFIRMED',
      });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao confirmar.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleDeny = async (requestId: string, reason: string) => {
    if (isSubmitting) return;
    setIsSubmitting(requestId);
    setShowReasonPicker(null);
    try {
      await httpClient.patch(`/cadastros/sessoes-confirmacao/${requestId}`, {
        status: 'DENIED',
        denialReason: reason,
      });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao recusar.');
    } finally {
      setIsSubmitting(null);
    }
  };

  const goBack = () => {
    navigation.navigate('EducatorHome', { fullName, educatorId });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={goBack} style={styles.backButton}>
          <Text style={styles.backText}>← Voltar</Text>
        </Pressable>

        <View style={styles.logoWrap}>
          {logoUri ? (
            <SvgUri uri={logoUri} width={84} height={50} />
          ) : (
            <ActivityIndicator size="small" color="#111827" />
          )}
        </View>

        <Text style={styles.heading}>Confirmações de sessão</Text>
        <Text style={styles.subheading}>
          Confirme ou recuse o acesso de cada alfabetizando abaixo.
        </Text>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color="#101010" />
          </View>
        ) : errorMessage ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <Pressable onPress={() => void fetchPending()} style={styles.retryBtn}>
              <Text style={styles.retryLabel}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Nenhuma solicitação pendente.</Text>
          </View>
        ) : (
          <View style={styles.requestList}>
            {requests.map((req) => (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.requestInfo}>
                  <Text style={styles.learnerName}>{req.learnerProfile.displayName}</Text>
                  {req.learnerProfile.cpfOrPassport && (
                    <Text style={styles.learnerCpf}>
                      CPF: {req.learnerProfile.cpfOrPassport}
                    </Text>
                  )}
                  <Text style={styles.requestTime}>
                    Solicitado às {new Date(req.requestedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                {showReasonPicker === req.id ? (
                  <View style={styles.reasonPicker}>
                    <Text style={styles.reasonPickerTitle}>Motivo da recusa:</Text>
                    {DENIAL_REASONS.map((reason) => (
                      <Pressable
                        key={reason}
                        style={styles.reasonOption}
                        onPress={() => void handleDeny(req.id, reason)}
                        disabled={isSubmitting === req.id}
                      >
                        <Text style={styles.reasonOptionText}>{reason}</Text>
                      </Pressable>
                    ))}
                    <Pressable
                      style={styles.reasonCancelBtn}
                      onPress={() => setShowReasonPicker(null)}
                    >
                      <Text style={styles.reasonCancelText}>Cancelar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.actions}>
                    <View style={styles.actionItem}>
                      <Pressable
                        style={[styles.iconButton, isSubmitting === req.id && styles.iconButtonDisabled]}
                        disabled={!!isSubmitting}
                        onPress={() => setShowReasonPicker(req.id)}
                      >
                        {negarUri ? (
                          <SvgUri uri={negarUri} width={56} height={56} />
                        ) : (
                          <ActivityIndicator size="small" color="#e01b24" />
                        )}
                      </Pressable>
                      <Text style={styles.actionLabel}>RECUSAR</Text>
                    </View>

                    <View style={styles.actionItem}>
                      <Pressable
                        style={[styles.iconButton, isSubmitting === req.id && styles.iconButtonDisabled]}
                        disabled={!!isSubmitting}
                        onPress={() => void handleConfirm(req.id)}
                      >
                        {isSubmitting === req.id ? (
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
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#ededed' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 60,
    backgroundColor: '#ededed',
  },
  backButton: { paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 8 },
  backText: { fontSize: 15, color: '#20385f', fontWeight: '500' },
  logoWrap: { minHeight: 50, justifyContent: 'center' },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginTop: 24,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
    marginBottom: 24,
  },
  centered: { marginTop: 60, alignItems: 'center', gap: 12 },
  errorText: { color: '#9e1b1b', fontSize: 13, textAlign: 'center' },
  retryBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  retryLabel: { fontSize: 14, color: '#20385f', fontWeight: '600' },
  emptyText: { color: '#444444', fontSize: 14, textAlign: 'center' },
  requestList: { gap: 16 },
  requestCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    gap: 16,
  },
  requestInfo: { gap: 3 },
  learnerName: { fontSize: 16, fontWeight: '600', color: '#111111' },
  learnerCpf: { fontSize: 13, color: '#666666' },
  requestTime: { fontSize: 12, color: '#888888', marginTop: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  actionItem: { alignItems: 'center', gap: 8 },
  iconButton: { alignItems: 'center', justifyContent: 'center' },
  iconButtonDisabled: { opacity: 0.4 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: '#111111', letterSpacing: 0.4 },
  reasonPicker: {
    gap: 8,
    paddingTop: 4,
  },
  reasonPickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 4,
  },
  reasonOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reasonOptionText: { fontSize: 14, color: '#333333' },
  reasonCancelBtn: {
    alignSelf: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  reasonCancelText: { fontSize: 14, color: '#888888' },
});
