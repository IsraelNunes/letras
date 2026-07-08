import { useAssets } from 'expo-asset';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SvgUri } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { EducatorRootStackParamList } from '../../types';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorLinkPending'>;

type LinkStatus = 'PENDING' | 'CONFIRMED' | 'DENIED';

// GET /cadastros/sessoes-confirmacao/:id já traduz o status pt→EN na API de produção.
interface VinculoStatusResponse {
  id: string;
  status: LinkStatus;
  learnerProfileId: string;
  educatorId: string;
  denialReason: string | null;
}

const POLL_INTERVAL_MS = 3000;

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
}

export function EducatorLinkPendingView({ navigation, route }: Props) {
  const { linkId, educatorId, educatorName, educatorPhone, learnerId, learnerName } = route.params;

  const [status, setStatus] = useState<LinkStatus>('PENDING');
  const [responseReason, setResponseReason] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [assets] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = assets?.[0]?.localUri ?? assets?.[0]?.uri;

  const checkStatus = useCallback(async () => {
    try {
      const result = await httpClient.get<VinculoStatusResponse>(`/cadastros/sessoes-confirmacao/${linkId}`);
      if (result.status === 'CONFIRMED') {
        intervalRef.current && clearInterval(intervalRef.current);
        setStatus('CONFIRMED');
      } else if (result.status === 'DENIED') {
        intervalRef.current && clearInterval(intervalRef.current);
        setResponseReason(result.denialReason);
        setStatus('DENIED');
      }
    } catch {
      // Polling silencioso — mantém o estado atual em caso de falha de rede.
    }
  }, [linkId]);

  useEffect(() => {
    void checkStatus();
    intervalRef.current = setInterval(() => void checkStatus(), POLL_INTERVAL_MS);
    return () => {
      intervalRef.current && clearInterval(intervalRef.current);
    };
  }, [checkStatus]);

  const handleCancel = async () => {
    intervalRef.current && clearInterval(intervalRef.current);
    try {
      await httpClient.patch(`/cadastros/sessoes-confirmacao/${linkId}`, {
        status: 'DENIED',
        denialReason: 'Cadastro cancelado pelo alfabetizador',
        decidedBy: educatorId,
      });
    } catch {
      // Mesmo que a recusa remota falhe, voltamos para a tela de dados.
    }
    navigation.goBack();
  };

  const handleStart = () => {
    navigation.replace('LearnerThemeSelect', {
      learnerId,
      learnerName,
      educatorId,
    });
  };

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
            <Text style={styles.pendingTitle}>Notificação enviada para o celular</Text>
            {educatorPhone ? (
              <Text style={styles.phoneText}>{formatPhone(educatorPhone)}</Text>
            ) : (
              <Text style={styles.phoneText}>(XX) XXXXX-XXXX</Text>
            )}
            <Text style={styles.pendingHint}>Faça a confirmação no número indicado.</Text>
            <Pressable style={styles.cancelBtn} onPress={() => void handleCancel()}>
              <Text style={styles.cancelLabel}>Cancelar</Text>
            </Pressable>
          </View>
        )}

        {status === 'CONFIRMED' && (
          <View style={styles.body}>
            <Text style={styles.successTitle}>Vinculação realizada com sucesso.</Text>

            <Text style={styles.successBody}>
              {'O alfabetizando '}
              <Text style={styles.bold}>{learnerName}</Text>
              {'\nestá vinculado ao\nalfabetizador '}
              <Text style={styles.bold}>{educatorName}</Text>
            </Text>

            <View style={styles.attentionBox}>
              <Text style={styles.attentionLabel}>ATENÇÃO:</Text>
              <Text style={styles.attentionText}>
                {' esta é a última tela gerenciada por você no celular do alfabetizando.\nA partir de agora, você deve auxiliar o alfabetizando à distância, sempre o acompanhando pelo seu celular.'}
              </Text>
            </View>

            <Pressable style={styles.startBtn} onPress={handleStart}>
              <Image source={require('../../../assets/avancar.png')} style={styles.arrowIcon} resizeMode="contain" />
              <Text style={styles.startLabel}>INICIAR{'\n'}ALFABETIZAÇÃO</Text>
            </Pressable>
          </View>
        )}

        {status === 'DENIED' && (
          <View style={styles.body}>
            <Text style={styles.deniedTitle}>Vinculação não confirmada</Text>
            <Text style={styles.deniedMessage}>
              {responseReason ?? 'O alfabetizador não confirmou a vinculação.'}
            </Text>
            <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelLabel}>VOLTAR</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 40,
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
    marginBottom: 0,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 18,
    paddingBottom: 40,
  },

  // --- PENDING ---
  pendingTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#111111',
    lineHeight: 26,
  },
  phoneText: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '400',
    lineHeight: 24,
  },
  pendingHint: {
    fontSize: 16,
    color: '#111111',
    lineHeight: 24,
  },

  // --- CONFIRMED ---
  successTitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#111111',
    lineHeight: 26,
  },
  successBody: {
    fontSize: 16,
    color: '#111111',
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
  },
  attentionBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  attentionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 22,
  },
  attentionText: {
    fontSize: 14,
    color: '#111111',
    lineHeight: 22,
    flexShrink: 1,
  },
  startBtn: {
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  arrowIcon: {
    width: 64,
    height: 54,
  },
  startLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#101010',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 19,
  },

  // --- DENIED ---
  deniedTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9e1b1b',
    textAlign: 'center',
  },
  deniedMessage: {
    fontSize: 15,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 22,
  },

  // --- SHARED ---
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },
  cancelLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
});
