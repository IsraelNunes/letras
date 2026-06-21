import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAssets } from 'expo-asset';
import { SvgUri } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { EducatorRootStackParamList } from '../../types';
import { EducatorBottomMenu } from './components/EducatorBottomMenu';

type Props = NativeStackScreenProps<EducatorRootStackParamList, 'EducatorEtapaOrientacoes'>;

interface StageIntroVideo {
  id: string;
  title: string;
  public_url: string | null;
}

interface StageInfo {
  id: string;
  stage_number: number;
  title: string;
  description: string | null;
  intro_video_id: string | null;
}

const EDUCATOR_GUIDANCE: Record<number, { intro: string; steps: string[] }> = {
  1: {
    intro: 'Antes de começar a Etapa 1 com o alfabetizando, certifique-se de que:',
    steps: [
      'Você assistiu aos tutoriais obrigatórios da plataforma.',
      'O celular do alfabetizando está carregado e com internet.',
      'Vocês estão em um ambiente tranquilo, sem interrupções.',
      'O alfabetizando sabe que vocês vão começar um aprendizado juntos.',
    ],
  },
  2: {
    intro: 'Para iniciar a Etapa 2 com o alfabetizando, verifique:',
    steps: [
      'O alfabetizando concluiu a Etapa 1 com sucesso.',
      'Você revisou o progresso dele na tela de acompanhamento.',
      'O ambiente de estudo está organizado e silencioso.',
      'Vocês têm pelo menos 30 minutos disponíveis para a sessão.',
    ],
  },
  3: {
    intro: 'Antes de iniciar a Etapa 3 com o alfabetizando, confirme:',
    steps: [
      'Etapas 1 e 2 foram concluídas.',
      'O alfabetizando está motivado e engajado.',
      'Você acompanhou o progresso e está ciente das dificuldades.',
      'Há materiais de apoio físicos disponíveis, se necessário.',
    ],
  },
};

function getGuidance(stageNumber: number) {
  return EDUCATOR_GUIDANCE[stageNumber] ?? {
    intro: `Antes de iniciar a Etapa ${stageNumber} com o alfabetizando, verifique se:`,
    steps: [
      'A etapa anterior foi concluída com sucesso.',
      'O celular do alfabetizando está funcional e conectado.',
      'Vocês estão em um ambiente propício ao aprendizado.',
    ],
  };
}

export function EducatorEtapaOrientacoesView({ navigation, route }: Props) {
  const { stageNumber, learnerId, learnerName, educatorId, fullName, themeId } = route.params;

  const [logoAsset] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = logoAsset?.[0]?.localUri ?? logoAsset?.[0]?.uri;

  const [stageInfo, setStageInfo] = useState<StageInfo | null>(null);
  const [introVideo, setIntroVideo] = useState<StageIntroVideo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const educatorName = fullName?.trim() || 'Alfabetizador';
  const guidance = getGuidance(stageNumber);

  const loadStageInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = themeId ? `?themeId=${themeId}` : '';
      const stages = await httpClient.get<StageInfo[]>(`/painel/conteudo/etapas${params}`);
      const stage = stages.find((s) => s.stage_number === stageNumber) ?? stages[stageNumber - 1] ?? null;
      setStageInfo(stage);

      if (stage?.intro_video_id) {
        try {
          const allMedia = await httpClient.get<StageIntroVideo[]>('/painel/conteudo/media-biblioteca?kind=intro-etapa');
          const video = allMedia.find((v) => v.id === stage.intro_video_id) ?? null;
          setIntroVideo(video);
        } catch {
          // Segue sem vídeo — não bloqueia a tela
        }
      }
    } catch {
      setError('Não foi possível carregar as orientações desta etapa.');
    } finally {
      setIsLoading(false);
    }
  }, [stageNumber, themeId]);

  useEffect(() => {
    void loadStageInfo();
  }, [loadStageInfo]);

  const handleOpenVideo = async () => {
    if (!introVideo?.public_url) return;
    const canOpen = await Linking.canOpenURL(introVideo.public_url);
    if (canOpen) await Linking.openURL(introVideo.public_url);
  };

  const handleIniciar = () => {
    navigation.navigate('EducatorLearningMode', {
      fullName: educatorName,
      educatorId,
      learnerName,
      learnerId,
    });
  };

  const stageTitle = stageInfo?.title ?? `Etapa ${stageNumber}`;
  const stageDescription = stageInfo?.description ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {logoUri
              ? <SvgUri uri={logoUri} width={84} height={50} />
              : <ActivityIndicator size="small" color="#111827" />}
          </View>
        </View>

        {/* Título da etapa */}
        <View style={styles.stageBadgeWrap}>
          <View style={styles.stageBadge}>
            <Text style={styles.stageBadgeText}>ETAPA {stageNumber}</Text>
          </View>
        </View>

        <Text style={styles.title}>{stageTitle} — Orientações</Text>
        <Text style={styles.subtitle}>
          Leia as orientações abaixo antes de iniciar esta etapa com o alfabetizando{learnerName ? ` ${learnerName}` : ''}.
        </Text>

        {isLoading ? (
          <ActivityIndicator style={styles.loader} color="#111827" />
        ) : error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={() => void loadStageInfo()}>
              <Text style={styles.retryText}>TENTAR NOVAMENTE</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Descrição da etapa */}
            {stageDescription && (
              <View style={styles.descriptionCard}>
                <Text style={styles.cardLabel}>Sobre esta etapa</Text>
                <Text style={styles.descriptionText}>{stageDescription}</Text>
              </View>
            )}

            {/* Orientações para o alfabetizador */}
            <View style={styles.guidanceCard}>
              <Text style={styles.cardLabel}>Orientações para o alfabetizador</Text>
              <Text style={styles.guidanceIntro}>{guidance.intro}</Text>
              <View style={styles.stepsList}>
                {guidance.steps.map((step, i) => (
                  <View key={i} style={styles.stepRow}>
                    <View style={styles.stepDot} />
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Vídeo de introdução */}
            {introVideo && (
              <View style={styles.videoCard}>
                <Text style={styles.cardLabel}>Vídeo de introdução</Text>
                <Text style={styles.videoTitle}>{introVideo.title}</Text>
                {introVideo.public_url ? (
                  <Pressable style={styles.videoButton} onPress={() => void handleOpenVideo()}>
                    <Text style={styles.videoButtonText}>▶  ASSISTIR VÍDEO DE INTRODUÇÃO</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.videoUnavailable}>Vídeo ainda não disponível.</Text>
                )}
              </View>
            )}
          </>
        )}

        {/* Ações */}
        <View style={styles.actions}>
          <Pressable
            style={styles.backButton}
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('EducatorHome', { fullName: educatorName, educatorId }))}
          >
            <Text style={styles.backText}>← VOLTAR</Text>
          </Pressable>

          <Pressable style={styles.iniciarButton} onPress={handleIniciar}>
            <Text style={styles.iniciarText}>INICIAR ETAPA {stageNumber}</Text>
          </Pressable>
        </View>

      </ScrollView>

      <EducatorBottomMenu
        active="inicio"
        onHome={() => navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })}
        onTutorial={() => navigation.navigate('EducatorTutorials', { educatorId })}
        onScore={() => navigation.navigate('EducatorScore', { educatorId: educatorId ?? '', fullName: educatorName })}
        onProfile={() => navigation.navigate('EducatorProfile' as never)}
        onAcompanhar={() => navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ededed',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 80,
    backgroundColor: '#ededed',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoWrap: {
    minHeight: 50,
    justifyContent: 'center',
  },
  stageBadgeWrap: {
    alignItems: 'flex-start',
    marginTop: 8,
  },
  stageBadge: {
    backgroundColor: '#17335B',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stageBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 20,
    color: '#111111',
    fontWeight: '700',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 20,
  },
  loader: {
    marginTop: 32,
  },
  errorCard: {
    backgroundColor: '#fff0f0',
    borderWidth: 1,
    borderColor: '#f5c6c6',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  errorText: {
    color: '#c0392b',
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#c0392b',
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  descriptionCard: {
    backgroundColor: '#e4e4e4',
    borderRadius: 8,
    padding: 16,
    gap: 6,
  },
  guidanceCard: {
    backgroundColor: '#eef4ff',
    borderWidth: 1,
    borderColor: '#ccd9ef',
    borderRadius: 8,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descriptionText: {
    fontSize: 15,
    color: '#141414',
    lineHeight: 22,
  },
  guidanceIntro: {
    fontSize: 14,
    color: '#17335B',
    fontWeight: '600',
    lineHeight: 20,
  },
  stepsList: {
    gap: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#17335B',
    marginTop: 7,
    flexShrink: 0,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#141414',
    lineHeight: 22,
  },
  videoCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  videoTitle: {
    fontSize: 15,
    color: '#141414',
    fontWeight: '600',
    lineHeight: 20,
  },
  videoButton: {
    backgroundColor: '#15803d',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  videoButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  videoUnavailable: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  backText: {
    fontSize: 14,
    color: '#555555',
    fontWeight: '600',
  },
  iniciarButton: {
    flex: 1,
    backgroundColor: '#17335B',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  iniciarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
