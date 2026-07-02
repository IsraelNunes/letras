import { useCallback, useEffect, useState } from 'react';
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
import { useAssets } from 'expo-asset';
import { SvgUri, SvgXml } from 'react-native-svg';
import { httpClient } from '../../infra/api/http-client';
import { EducatorRootStackParamList } from '../../types';
import { EducatorBell } from '../shared/EducatorBell';
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

// Copy exata do Figma (Etapa 1/2/3 - Orientações), com os negritos indicados.
type CopySegment = { text: string; bold?: boolean };
type CopyParagraph = CopySegment[];

const FIGMA_COPY: Record<number, CopyParagraph[]> = {
  1: [
    [
      { text: 'Na Etapa 1, você irá conduzir todo o processo ' },
      { text: 'presencialmente', bold: true },
      { text: '.' },
    ],
    [
      { text: 'Somente você', bold: true },
      { text: ' irá acessar a plataforma.' },
    ],
    [{ text: 'Siga cada passo indicado nesta plataforma.' }],
    [
      {
        text:
          'Se tiver dúvidas, reveja os tutoriais de orientação. A seguir, segue o link do tutorial específico sobre essa primeira Etapa. Ele é bem curto e didático.',
      },
    ],
    [{ text: 'Só continue se estiver seguro sobre como conduzir esta etapa.' }],
  ],
  2: [
    [
      {
        text:
          'Esta Etapa deve ser feita presencialmente, porém, o(s) alfabetizando(s) irão aprender pelo celular dele e não mais com o seu ensinamento.',
      },
    ],
    [
      {
        text:
          'É importante que ele aprenda a usar a plataforma, pois toda a próxima Etapa, a terceira, será on-line e sem a sua presença física.',
      },
    ],
    [{ text: 'Assista ao vídeo tutorial abaixo para melhor compreender esta etapa.' }],
  ],
  3: [
    [
      {
        text:
          'Esta Etapa é totalmente on-line. Você irá apenas acompanhar à distância e tirar dúvidas.',
      },
    ],
    [
      {
        text:
          'Assista ao vídeo tutorial abaixo para melhor compreender os procedimentos nesta Etapa.',
      },
    ],
  ],
};

// Seta AVANÇAR navy (mesmo desenho do Figma).
const NEXT_ARROW_DARK = `
<svg width="55" height="46" viewBox="0 0 55 46" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 17H30V8L51 23L30 38V29H4V17Z" stroke="#1e3a5f" stroke-width="4" stroke-linejoin="round"/>
</svg>`;

export function EducatorEtapaOrientacoesView({ navigation, route }: Props) {
  const { stageNumber, learnerId, learnerName, educatorId, fullName, themeId } = route.params;

  const [logoAsset] = useAssets([require('../../../assets/Logo-LETRAS.svg')]);
  const logoUri = logoAsset?.[0]?.localUri ?? logoAsset?.[0]?.uri;

  const [introVideo, setIntroVideo] = useState<StageIntroVideo | null>(null);

  const educatorName = fullName?.trim() || 'Alfabetizador';
  const paragraphs = FIGMA_COPY[stageNumber] ?? FIGMA_COPY[1];

  const loadStageInfo = useCallback(async () => {
    try {
      const params = themeId ? `?themeId=${themeId}` : '';
      const stages = await httpClient.get<StageInfo[]>(`/painel/conteudo/etapas${params}`);
      const stage = stages.find((s) => s.stage_number === stageNumber) ?? stages[stageNumber - 1] ?? null;

      if (stage?.intro_video_id) {
        const allMedia = await httpClient.get<StageIntroVideo[]>('/painel/conteudo/media-biblioteca?kind=intro-etapa');
        setIntroVideo(allMedia.find((v) => v.id === stage.intro_video_id) ?? null);
      }
    } catch {
      // Sem vídeo da API — o thumbnail permanece (RN037: o elemento é fixo).
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

  const handleAvancar = () => {
    navigation.navigate('EducatorLearningMode', {
      fullName: educatorName,
      educatorId,
      learnerName,
      learnerId,
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header: logo + sino (Figma) */}
        <View style={styles.header}>
          <View style={styles.logoWrap}>
            {logoUri
              ? <SvgUri uri={logoUri} width={84} height={50} />
              : <ActivityIndicator size="small" color="#111827" />}
          </View>
          <EducatorBell educatorId={educatorId} />
        </View>

        {/* Título (Figma: texto simples, sem badge) */}
        <Text style={styles.title}>ALFABETIZAÇÃO - ETAPA {stageNumber}</Text>

        {/* Texto corrido com a copy exata do Figma */}
        <View style={styles.copyBlock}>
          {paragraphs.map((segments, i) => (
            <Text key={i} style={styles.copyParagraph}>
              {segments.map((seg, j) => (
                <Text key={j} style={seg.bold ? styles.copyBold : undefined}>
                  {seg.text}
                </Text>
              ))}
            </Text>
          ))}
        </View>

        {/* Vídeo tutorial: thumbnail full-width com play embutido (RN037/051/064 —
            sempre presente; toca o vídeo da etapa quando cadastrado). */}
        <Pressable
          style={styles.videoThumbWrap}
          onPress={() => void handleOpenVideo()}
          accessibilityRole="button"
          accessibilityLabel={`Assistir vídeo tutorial da Etapa ${stageNumber}`}
        >
          <Image
            source={require('../../../assets/orientacoes-video.png')}
            style={styles.videoThumb}
            resizeMode="cover"
          />
        </Pressable>

        {/* CTA (Figma): seta navy + INICIAR ALFABETIZAÇÃO (Etapa 1) / AVANÇAR (2 e 3) */}
        <Pressable style={styles.cta} onPress={handleAvancar} accessibilityRole="button">
          <SvgXml xml={NEXT_ARROW_DARK} width={55} height={46} />
          <Text style={styles.ctaLabel}>
            {stageNumber === 1 ? 'INICIAR\nALFABETIZAÇÃO' : 'AVANÇAR'}
          </Text>
        </Pressable>
      </ScrollView>

      <EducatorBottomMenu
        active="inicio"
        onInicioPress={() => navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })}
        onTutorialPress={() => navigation.navigate('EducatorTutorials', { educatorId })}
        onPontuacaoPress={() => navigation.navigate('EducatorScore', { educatorId: educatorId ?? '', fullName: educatorName })}
        onPerfilPress={() => navigation.navigate('EducatorProfile' as never)}
        onAcompanharPress={() => navigation.navigate('EducatorHome', { fullName: educatorName, educatorId })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 96,
    backgroundColor: '#ffffff',
    gap: 18,
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
  title: {
    fontSize: 16,
    color: '#111111',
    fontWeight: '500',
    letterSpacing: 0.3,
    marginTop: 4,
  },
  copyBlock: {
    gap: 2,
  },
  copyParagraph: {
    fontSize: 15,
    color: '#111111',
    lineHeight: 23,
  },
  copyBold: {
    fontWeight: '700',
  },
  videoThumbWrap: {
    marginTop: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  videoThumb: {
    width: '100%',
    aspectRatio: 1500 / 1120,
    height: undefined,
  },
  cta: {
    marginTop: 18,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
  },
  ctaLabel: {
    fontSize: 13,
    color: '#111111',
    fontWeight: '600',
    letterSpacing: 0.4,
    textAlign: 'center',
    lineHeight: 18,
  },
});
