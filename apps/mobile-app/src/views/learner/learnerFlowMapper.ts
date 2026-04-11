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
  activity_id?: string;
  kind?: string;
  storage_path?: string;
  sourceUrl?: string;
  title: string | null;
  created_at?: string;
}

interface PainelActivityAsset {
  role: string | null;
  asset: PainelAsset;
}

interface PainelActivity {
  id: string;
  module_id?: string;
  order?: number;
  sort_order?: number;
  title: string | null;
  prompt?: string;
  instructions?: string | null;
  instructorGuidance?: string | null;
  learnerGuidance?: string | null;
  assets: PainelActivityAsset[];
}

interface PainelLearningUnit {
  id: string;
  theme_id?: string;
  stage_number?: number;
  order?: number;
  sort_order?: number;
  title: string;
  description: string | null;
  activities: PainelActivity[];
}

interface PainelTheme {
  id: string;
  title?: string;
  name: string;
  sort_order?: number;
  description: string | null;
  learningUnits?: PainelLearningUnit[];
}

interface PainelBlueprint {
  id: string;
  module_code?: string | null;
  stage_tag?: string | null;
  slug?: string;
  title?: string;
}

export interface PainelConteudoResponse {
  themes: PainelTheme[];
  modules?: PainelLearningUnit[];
  activities?: PainelActivity[];
  assets?: PainelAsset[];
  blueprints?: PainelBlueprint[];
}

function mapAssetKind(kind: string | null | undefined): LearnerMediaKind {
  const normalized = String(kind || '').trim().toLowerCase();
  if (['video', 'mp4'].includes(normalized)) return 'video';
  if (['audio', 'mp3'].includes(normalized)) return 'audio';
  if (['image', 'svg', 'png', 'jpg', 'jpeg'].includes(normalized)) return 'image';
  return null;
}

function parseGuidance(instructions: string | null | undefined) {
  const normalized = String(instructions || '').trim();
  if (!normalized) {
    return {
      educatorGuidance: null,
      learnerSpeech: null,
    };
  }

  const parts = normalized
    .split(/\n{2,}/g)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return {
      educatorGuidance: null,
      learnerSpeech: null,
    };
  }

  return {
    educatorGuidance: parts[0] || null,
    learnerSpeech: parts[1] || null,
  };
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

export function mapPainelToModules(payload: PainelConteudoResponse): LearnerFlowModule[] {
  const themes = payload.themes || [];
  if (themes.length === 0) {
    return buildFallbackModules();
  }

  const hasNestedShape = themes.some((theme) => Array.isArray(theme.learningUnits) && theme.learningUnits.length > 0);

  if (hasNestedShape) {
    const mappedNested = themes.map((theme, themeIndex) => {
      const learningUnits = [...(theme.learningUnits || [])].sort(
        (a, b) => Number(a.order ?? a.sort_order ?? 0) - Number(b.order ?? b.sort_order ?? 0),
      );

      const lessons: LearnerFlowLesson[] = learningUnits.map((unit) => {
        const activities = [...(unit.activities || [])].sort(
          (a, b) => Number(a.order ?? a.sort_order ?? 0) - Number(b.order ?? b.sort_order ?? 0),
        );

        const screens: LearnerFlowScreen[] = activities.map((activity, activityIndex) => {
          const normalizedAssets = (activity.assets || [])
            .map((item) => item.asset)
            .filter((item): item is PainelAsset => Boolean(item && (item.sourceUrl || item.storage_path)));

          const mainAsset = normalizedAssets[0] ?? null;
          const followUpAsset = normalizedAssets[1] ?? null;
          const guidanceFromInstruction = parseGuidance(activity.instructions);

          return {
            id: activity.id,
            title: normalizeText(activity.title, normalizeText(activity.prompt, `Tela ${activityIndex + 1}`)),
            educatorGuidance:
              normalizeText(
                activity.instructorGuidance,
                guidanceFromInstruction.educatorGuidance || normalizeText(activity.prompt, ''),
              ).trim() || null,
            learnerSpeech:
              normalizeText(activity.learnerGuidance, guidanceFromInstruction.learnerSpeech || '').trim() || null,
            mediaUrl: mainAsset?.sourceUrl || mainAsset?.storage_path || null,
            mediaKind: mapAssetKind(mainAsset?.kind),
            highlightMessage:
              activityIndex === Math.floor((activities.length - 1) / 2) && activities.length > 2
                ? 'Metade da aula! Continue assim!'
                : null,
            followUpActivity: followUpAsset
              ? {
                  id: `${activity.id}-followup`,
                  title: `Atividade - ${normalizeText(activity.title, `Tela ${activityIndex + 1}`)}`,
                  educatorGuidance:
                    normalizeText(activity.instructorGuidance, guidanceFromInstruction.educatorGuidance || '').trim() || null,
                  learnerSpeech:
                    normalizeText(activity.learnerGuidance, guidanceFromInstruction.learnerSpeech || '').trim() || null,
                  mediaUrl: followUpAsset.sourceUrl || followUpAsset.storage_path || null,
                  mediaKind: mapAssetKind(followUpAsset.kind),
                  completionMessage: 'Muito bem! Continue para a proxima etapa da aula.',
                }
              : null,
          };
        });

        const safeScreens =
          screens.length > 0
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
          moduleTitle: normalizeText(theme.name || theme.title, 'Modulo'),
          screens: safeScreens,
          conclusionTitle: 'Aula Concluida!',
          conclusionMessage:
            'Parabens! Voce concluiu esta aula. Continue praticando para avancar no modulo.',
        };
      });

      return {
        id: theme.id,
        title: normalizeText(theme.name || theme.title, `Modulo ${themeIndex + 1}`),
        subtitle: `${lessons.length} ${lessons.length === 1 ? 'aula disponivel' : 'aulas disponiveis'}`,
        lessons,
      };
    });

    const modulesWithLessons = mappedNested.filter((item) => item.lessons.length > 0);
    return modulesWithLessons.length > 0 ? modulesWithLessons : buildFallbackModules();
  }

  const modules = payload.modules || [];
  const activities = payload.activities || [];
  const assets = payload.assets || [];
  const blueprints = payload.blueprints || [];

  const activitiesByModule = new Map<string, PainelActivity[]>();
  for (const activity of activities) {
    const key = String(activity.module_id || '').trim();
    if (!key) continue;
    const bucket = activitiesByModule.get(key) ?? [];
    bucket.push(activity);
    activitiesByModule.set(key, bucket);
  }

  for (const [moduleId, bucket] of activitiesByModule.entries()) {
    bucket.sort(
      (a, b) => Number(a.order ?? a.sort_order ?? 0) - Number(b.order ?? b.sort_order ?? 0),
    );
    activitiesByModule.set(moduleId, bucket);
  }

  const assetsByActivity = new Map<string, PainelAsset[]>();
  for (const asset of assets) {
    const key = String(asset.activity_id || '').trim();
    if (!key) continue;
    const bucket = assetsByActivity.get(key) ?? [];
    bucket.push(asset);
    assetsByActivity.set(key, bucket);
  }

  for (const [activityId, bucket] of assetsByActivity.entries()) {
    bucket.sort(
      (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
    );
    assetsByActivity.set(activityId, bucket);
  }

  const blueprintsByModule = new Map<string, PainelBlueprint[]>();
  for (const blueprint of blueprints) {
    if (!blueprint?.module_code) continue;
    const key = String(blueprint.module_code).trim();
    if (!key) continue;
    const bucket = blueprintsByModule.get(key) ?? [];
    bucket.push(blueprint);
    blueprintsByModule.set(key, bucket);
  }

  const mappedFlat = themes
    .map((theme, themeIndex) => {
      const units = modules
        .filter((unit) => unit.theme_id === theme.id)
        .sort((a, b) => {
          const stageDiff = Number(a.stage_number ?? 0) - Number(b.stage_number ?? 0);
          if (stageDiff !== 0) return stageDiff;
          return Number(a.order ?? a.sort_order ?? 0) - Number(b.order ?? b.sort_order ?? 0);
        });

      const lessons: LearnerFlowLesson[] = units.map((unit, unitIndex) => {
        const unitActivities = activitiesByModule.get(unit.id) ?? [];
        const linkedBlueprints = blueprintsByModule.get(unit.id) ?? [];

        const screens = unitActivities.map((activity, activityIndex) => {
          const activityAssets = assetsByActivity.get(activity.id) ?? [];
          const mainAsset = activityAssets[0] ?? null;
          const followUpAsset = activityAssets[1] ?? null;
          const guidanceFromInstruction = parseGuidance(activity.instructions);

          return {
            id: activity.id,
            title: normalizeText(activity.title, `Tela ${activityIndex + 1}`),
            educatorGuidance: guidanceFromInstruction.educatorGuidance,
            learnerSpeech: guidanceFromInstruction.learnerSpeech,
            mediaUrl: mainAsset?.sourceUrl || mainAsset?.storage_path || null,
            mediaKind: mapAssetKind(mainAsset?.kind),
            highlightMessage:
              activityIndex === Math.floor((unitActivities.length - 1) / 2) && unitActivities.length > 2
                ? 'Metade da aula! Continue assim!'
                : null,
            followUpActivity: followUpAsset
              ? {
                  id: `${activity.id}-followup`,
                  title: `Atividade - ${normalizeText(activity.title, `Tela ${activityIndex + 1}`)}`,
                  educatorGuidance: guidanceFromInstruction.educatorGuidance,
                  learnerSpeech: guidanceFromInstruction.learnerSpeech,
                  mediaUrl: followUpAsset.sourceUrl || followUpAsset.storage_path || null,
                  mediaKind: mapAssetKind(followUpAsset.kind),
                  completionMessage: 'Muito bem! Continue para a proxima etapa da aula.',
                }
              : null,
          };
        });

        const fallbackScreen: LearnerFlowScreen = {
          id: `${unit.id}-screen-1`,
          title: normalizeText(unit.title, `Aula ${unitIndex + 1}`),
          educatorGuidance: normalizeText(
            unit.description,
            'Adicione atividades nesta aula para montar as telas do fluxo mobile.',
          ),
          learnerSpeech: null,
          mediaUrl: null,
          mediaKind: null,
          highlightMessage: linkedBlueprints.length > 0 ? `${linkedBlueprints.length} tela(s) base vinculada(s)` : null,
          followUpActivity: null,
        };

        const safeScreens = screens.length > 0 ? screens : [fallbackScreen];
        const primaryActivityTitle = unitActivities[0]?.title;

        return {
          id: unit.id,
          title: normalizeText(primaryActivityTitle, normalizeText(unit.title, 'Aula')),
          objective: normalizeText(
            unit.description,
            unitActivities[0]?.instructions || 'Objetivo da aula em configuracao.',
          ),
          moduleLabel: `MODULO ${themeIndex + 1}`,
          moduleTitle: normalizeText(theme.title || theme.name, 'Modulo'),
          screens: safeScreens,
          conclusionTitle: 'Aula Concluida!',
          conclusionMessage:
            'Parabens! Voce concluiu esta aula. Continue praticando para avancar no modulo.',
        };
      });

      return {
        id: theme.id,
        title: normalizeText(theme.title || theme.name, `Modulo ${themeIndex + 1}`),
        subtitle: `${lessons.length} ${lessons.length === 1 ? 'aula disponivel' : 'aulas disponiveis'}`,
        lessons,
      };
    })
    .filter((item) => item.lessons.length > 0);

  return mappedFlat.length > 0 ? mappedFlat : buildFallbackModules();
}
