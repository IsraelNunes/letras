import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpClient } from '../../infra/api/http-client';

export type LearnerMediaKind = 'video' | 'audio' | 'image' | null;

export interface LearnerFlowActivity {
  id: string;
  title: string;
  educatorGuidance: string | null;
  learnerSpeech: string | null;
  mediaUrl: string | null;
  mediaKind: LearnerMediaKind;
  completionMessage: string | null;
}

export interface LearnerFlowScreen {
  id: string;
  title: string;
  educatorGuidance: string | null;
  learnerSpeech: string | null;
  mediaUrl: string | null;
  mediaKind: LearnerMediaKind;
  highlightMessage: string | null;
  followUpActivity: LearnerFlowActivity | null;
}

export interface LearnerFlowLesson {
  id: string;
  title: string;
  objective: string;
  moduleLabel: string;
  moduleTitle: string;
  screens: LearnerFlowScreen[];
  conclusionTitle: string;
  conclusionMessage: string;
}

export interface LearnerFlowModule {
  id: string;
  title: string;
  subtitle: string;
  lessons: LearnerFlowLesson[];
}

interface PainelAsset {
  id: string;
  kind: string;
  sourceUrl: string;
  title: string | null;
}

interface PainelActivityAsset {
  role: string | null;
  asset: PainelAsset;
}

interface PainelActivity {
  id: string;
  order: number;
  title: string | null;
  prompt: string;
  instructorGuidance: string | null;
  learnerGuidance: string | null;
  assets: PainelActivityAsset[];
}

interface PainelLearningUnit {
  id: string;
  order: number;
  title: string;
  description: string | null;
  activities: PainelActivity[];
}

interface PainelTheme {
  id: string;
  name: string;
  description: string | null;
  learningUnits: PainelLearningUnit[];
}

interface PainelConteudoResponse {
  themes: PainelTheme[];
}

let cachedModules: LearnerFlowModule[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

function mapAssetKind(kind: string | null | undefined): LearnerMediaKind {
  const normalized = String(kind || '').toUpperCase();
  if (normalized === 'VIDEO') return 'video';
  if (normalized === 'AUDIO') return 'audio';
  if (normalized === 'IMAGE' || normalized === 'SVG') return 'image';
  return null;
}

function normalizeText(value: string | null | undefined, fallback: string): string {
  const text = String(value || '').trim();
  return text.length > 0 ? text : fallback;
}

function buildFallbackModules(): LearnerFlowModule[] {
  return [
    {
      id: 'fallback-modulo-1',
      title: 'Vogais',
      subtitle: '1 aula disponivel',
      lessons: [
        {
          id: 'fallback-aula-1',
          title: 'Introducao geral',
          objective: 'Acolhimento e introducao do metodo',
          moduleLabel: 'MODULO 1',
          moduleTitle: 'Vogais',
          screens: [
            {
              id: 'fallback-tela-1',
              title: 'A importancia das palavras',
              educatorGuidance: 'Explique, com suas proprias palavras, o que se segue.',
              learnerSpeech:
                'As palavras sao essenciais para a comunicacao humana. Elas nos permitem expressar ideias, sentimentos e construir dialogos no dia a dia.',
              mediaUrl: null,
              mediaKind: null,
              highlightMessage: null,
              followUpActivity: null,
            },
            {
              id: 'fallback-tela-2',
              title: 'O Alfabeto',
              educatorGuidance: 'Informe ao alfabetizando.',
              learnerSpeech: 'O alfabeto possui 26 letras. Ele e formado por vogais e consoantes.',
              mediaUrl: null,
              mediaKind: null,
              highlightMessage: 'Metade da aula! Continue assim!',
              followUpActivity: null,
            },
            {
              id: 'fallback-tela-3',
              title: 'Conhecendo as Vogais',
              educatorGuidance:
                'Apresente as vogais e peca para repetir cada som cinco vezes.',
              learnerSpeech: null,
              mediaUrl: null,
              mediaKind: null,
              highlightMessage: null,
              followUpActivity: null,
            },
            {
              id: 'fallback-tela-4',
              title: 'A letra A - Aranha',
              educatorGuidance:
                'Nesta unidade vamos conhecer a letra A. Peca para o alfabetizando pensar em uma aranha e repetir a palavra.',
              learnerSpeech: null,
              mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
              mediaKind: 'video',
              highlightMessage: null,
              followUpActivity: {
                id: 'fallback-atividade-1',
                title: 'Formas de escrever a letra A',
                educatorGuidance: 'Apresente as formas de escrever a letra A.',
                learnerSpeech: 'Veja como a letra A pode ser escrita de diferentes formas. Tente copiar cada uma!',
                mediaUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
                mediaKind: 'video',
                completionMessage: 'Muito bem! Voce conheceu as diferentes formas de escrever a letra A.',
              },
            },
          ],
          conclusionTitle: 'Aula Concluida!',
          conclusionMessage:
            'Parabens! Voce completou a introducao. Agora ja conhece as vogais e esta pronto para avancar.',
        },
      ],
    },
  ];
}

function mapPainelToModules(payload: PainelConteudoResponse): LearnerFlowModule[] {
  const themes = payload.themes || [];
  if (themes.length === 0) {
    return buildFallbackModules();
  }

  const mapped = themes.map((theme, themeIndex) => {
    const learningUnits = [...(theme.learningUnits || [])].sort((a, b) => a.order - b.order);

    const lessons: LearnerFlowLesson[] = learningUnits.map((unit) => {
      const activities = [...(unit.activities || [])].sort((a, b) => a.order - b.order);

      const screens: LearnerFlowScreen[] = activities.map((activity, activityIndex) => {
        const normalizedAssets = (activity.assets || [])
          .map((item) => item.asset)
          .filter((item): item is PainelAsset => Boolean(item && item.sourceUrl));

        const mainAsset = normalizedAssets[0] ?? null;
        const followUpAsset = normalizedAssets[1] ?? null;

        return {
          id: activity.id,
          title: normalizeText(activity.title, normalizeText(activity.prompt, `Tela ${activityIndex + 1}`)),
          educatorGuidance: normalizeText(activity.instructorGuidance, normalizeText(activity.prompt, '')).trim() || null,
          learnerSpeech: normalizeText(activity.learnerGuidance, '').trim() || null,
          mediaUrl: mainAsset?.sourceUrl ?? null,
          mediaKind: mapAssetKind(mainAsset?.kind),
          highlightMessage: activityIndex === Math.floor((activities.length - 1) / 2) && activities.length > 2 ? 'Metade da aula! Continue assim!' : null,
          followUpActivity: followUpAsset
            ? {
                id: `${activity.id}-followup`,
                title: `Atividade - ${normalizeText(activity.title, `Tela ${activityIndex + 1}`)}`,
                educatorGuidance: normalizeText(activity.instructorGuidance, '').trim() || null,
                learnerSpeech: normalizeText(activity.learnerGuidance, '').trim() || null,
                mediaUrl: followUpAsset.sourceUrl,
                mediaKind: mapAssetKind(followUpAsset.kind),
                completionMessage: 'Muito bem! Continue para a proxima etapa da aula.',
              }
            : null,
        };
      });

      const safeScreens = screens.length > 0
        ? screens
        : [
            {
              id: `${unit.id}-screen-1`,
              title: normalizeText(unit.title, 'Aula'),
              educatorGuidance: normalizeText(unit.description, 'Siga a orientacao desta aula.').trim(),
              learnerSpeech: null,
              mediaUrl: null,
              mediaKind: null,
              highlightMessage: null,
              followUpActivity: null,
            },
          ];

      return {
        id: unit.id,
        title: normalizeText(unit.title, 'Aula'),
        objective: normalizeText(unit.description, 'Objetivo da aula em configuracao.'),
        moduleLabel: `MODULO ${themeIndex + 1}`,
        moduleTitle: normalizeText(theme.name, 'Modulo'),
        screens: safeScreens,
        conclusionTitle: 'Aula Concluida!',
        conclusionMessage:
          'Parabens! Voce concluiu esta aula. Continue praticando para avancar no modulo.',
      };
    });

    return {
      id: theme.id,
      title: normalizeText(theme.name, `Modulo ${themeIndex + 1}`),
      subtitle: `${lessons.length} ${lessons.length === 1 ? 'aula disponivel' : 'aulas disponiveis'}`,
      lessons,
    };
  });

  const modulesWithLessons = mapped.filter((item) => item.lessons.length > 0);
  if (modulesWithLessons.length === 0) {
    return buildFallbackModules();
  }

  return modulesWithLessons;
}

async function fetchLearnerModules(): Promise<LearnerFlowModule[]> {
  try {
    const payload = await httpClient.get<PainelConteudoResponse>('/painel/conteudo');
    return mapPainelToModules(payload);
  } catch {
    return buildFallbackModules();
  }
}

export function useLearnerFlowData() {
  const [modules, setModules] = useState<LearnerFlowModule[]>(cachedModules ?? []);
  const [loading, setLoading] = useState(cachedModules === null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const now = Date.now();
    if (cachedModules && now - cacheTimestamp < CACHE_TTL_MS) {
      setModules(cachedModules);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetched = await fetchLearnerModules();
      cachedModules = fetched;
      cacheTimestamp = now;
      setModules(fetched);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Falha ao carregar conteudo.';
      setError(message);
      const fallback = buildFallbackModules();
      setModules(fallback);
      cachedModules = fallback;
      cacheTimestamp = now;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const moduleMap = useMemo(() => new Map(modules.map((item) => [item.id, item])), [modules]);

  const getLesson = useCallback(
    (moduleId: string, lessonId: string): LearnerFlowLesson | null => {
      const moduleItem = moduleMap.get(moduleId);
      if (!moduleItem) return null;
      return moduleItem.lessons.find((lesson) => lesson.id === lessonId) ?? null;
    },
    [moduleMap],
  );

  return {
    modules,
    loading,
    error,
    refresh: load,
    getLesson,
  };
}
