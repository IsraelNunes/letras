import { useAssets } from 'expo-asset';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { SessionStorage } from '../../infra/storage/session-storage';
import { LearnerRootStackParamList } from '../../types';
import { useOptionalLearnerSession } from './learnerSessionContext';
import { learnerTheme } from './learnerTheme';

type Props = NativeStackScreenProps<LearnerRootStackParamList, 'LearnerSessionPending'>;

type RequestStatus = 'PENDING' | 'CONFIRMED' | 'DENIED';

interface SessionRequestStatusResponse {
  id: string;
  status: RequestStatus;
  denialReason: string | null;
  respondedAt: string | null;
}

const POLL_INTERVAL_MS = 3000;
const DENIAL_REASONS: Record<string, string> = {
  'Não reconheço esta pessoa': 'Seu alfabetizador informou que não te reconhece.',
  'Desisti da sessão': 'Seu alfabetizador cancelou a sessão.',
  'Outro motivo': 'Seu alfabetizador recusou o acesso.',
};

export function LearnerSessionPendingView({ navigation, route }: Props) {
  const { requestId, learnerProfileId, educatorName } = route.params;
  const session = useOptionalLearnerSession();

  const [status, setStatus] = useState<RequestStatus>('PENDING');
  const [denialReason, setDenialReason] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [assets] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  const checkStatus = useCallback(async () => {
    try {
      const result = await httpClient.get<SessionRequestStatusResponse>(
        `/cadastros/sessoes-confirmacao/${requestId}`,
      );
      if (result.status === 'CONFIRMED') {
        setStatus('CONFIRMED');
        intervalRef.current && clearInterval(intervalRef.current);
        await SessionStorage.setLearnerProfileId(learnerProfileId);
        if (session) await session.initialize();
        navigation.reset({ index: 0, routes: [{ name: 'LearnerHome' }] });
      } else if (result.status === 'DENIED') {
        setStatus('DENIED');
        setDenialReason(result.denialReason);
        intervalRef.current && clearInterval(intervalRef.current);
      }
    } catch {
      // Polling silencioso — não interrompe a espera
    }
  }, [requestId, learnerProfileId, session, navigation]);

  useEffect(() => {
    void checkStatus();
    intervalRef.current = setInterval(() => void checkStatus(), POLL_INTERVAL_MS);
    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, [checkStatus]);

  const handleBack = () => {
    intervalRef.current && clearInterval(intervalRef.current);
    navigation.getParent()?.reset({ index: 0, routes: [{ name: 'UnifiedLogin' }] });
  };

  const denialMessage = denialReason
    ? (DENIAL_REASONS[denialReason] ?? `Acesso recusado: ${denialReason}`)
    : 'Acesso recusado pelo alfabetizador.';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.logoWrap}>
          {logoUri ? (
            <SvgUri uri={logoUri} width={84} height={50} />
          ) : (
            <ActivityIndicator size="small" color="#111827" />
          )}
        </View>

        {status === 'PENDING' && (
          <View style={styles.body}>
            <ActivityIndicator size="large" color={learnerTheme.primary} style={styles.spinner} />
            <Text style={styles.title}>Aguardando confirmação</Text>
            <Text style={styles.subtitle}>
              Seu alfabetizador <Text style={styles.bold}>{educatorName}</Text> precisa confirmar sua sessão no celular dele.
            </Text>
            <Text style={styles.hint}>Esta tela atualiza automaticamente.</Text>
          </View>
        )}

        {status === 'DENIED' && (
          <View style={styles.body}>
            <View style={styles.deniedIcon}>
              <Text style={styles.deniedEmoji}>✕</Text>
            </View>
            <Text style={styles.deniedTitle}>Acesso não autorizado</Text>
            <Text style={styles.deniedMessage}>{denialMessage}</Text>
            <Text style={styles.hint}>
              Entre em contato com seu alfabetizador para mais informações.
            </Text>
            <Pressable style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnLabel}>TENTAR NOVAMENTE</Text>
            </Pressable>
          </View>
        )}

        {status === 'PENDING' && (
          <Pressable style={styles.cancelBtn} onPress={handleBack}>
            <Text style={styles.cancelLabel}>Cancelar</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: learnerTheme.background },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
  },
  logoWrap: { minHeight: 50, justifyContent: 'center', marginBottom: 0 },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 40,
  },
  spinner: { marginBottom: 8 },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: learnerTheme.textStrong,
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 15,
    color: learnerTheme.text,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  bold: { fontWeight: '700', color: learnerTheme.textStrong },
  hint: {
    fontSize: 13,
    color: learnerTheme.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  deniedIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deniedEmoji: { fontSize: 28, color: learnerTheme.danger, fontWeight: '700' },
  deniedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: learnerTheme.danger,
    textAlign: 'center',
  },
  deniedMessage: {
    fontSize: 15,
    color: learnerTheme.text,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: learnerTheme.primary,
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 28,
  },
  backBtnLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
  },
  cancelLabel: {
    fontSize: 14,
    color: learnerTheme.textMuted,
  },
});
