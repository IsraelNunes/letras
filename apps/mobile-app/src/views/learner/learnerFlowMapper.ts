export type LearnerMediaKind = 'video' | 'audio' | 'image' | null;
export type LearnerScreenTemplate =
  | 'default'
  | 'exercise-match-letter'
  | 'exercise-mark-images'
  | 'locked';

export interface LearnerExerciseItem {
  id: string;
  label: string;
  imageUrl: string | null;
  audioUrl: string | null;
  wordAudioUrl: string | null;
  spellingAudioUrl: string | null;
  options: string[];
  correctOptions: string[];
  isCorrectTarget: boolean;
}

export interface LearnerErrorReinforcementConfig {
  instructionText: string | null;
  instructionAudioUrl: string | null;
  autoReturnMs: number;
  preserveProgress: boolean;
}

export interface LearnerExerciseConfig {
  template: Exclude<LearnerScreenTemplate, 'default' | 'locked'>;
  targetLetter: string | null;
  instructionText: string | null;
  instructionAudioUrl: string | null;
  expectedSelections: number | null;
  maxAttemptsBeforeLock: number;
  progressiveUnlock: boolean;
  successFeedback: string | null;
  errorFeedback: string | null;
  errorReinforcement: LearnerErrorReinforcementConfig | null;
  items: LearnerExerciseItem[];
}

export interface LearnerFlowActivity {
  id: string;
  title: string;
  educatorGuidance: string | null;
  learnerSpeech: string | null;
  mediaUrl: string | null;
  mediaKind: LearnerMediaKind;
  completionMessage: string | null;
  screenTemplate: LearnerScreenTemplate;
  lockReason: string | null;
  lockMessage: string | null;
  lockAudioUrl: string | null;
  exercise: LearnerExerciseConfig | null;
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
  screenTemplate: LearnerScreenTemplate;
  lockReason: string | null;
  lockMessage: string | null;
  lockAudioUrl: string | null;
  exercise: LearnerExerciseConfig | null;
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

interface ParsedInstructionBundle {
  educatorGuidance: string | null;
  learnerSpeech: string | null;
  screenTemplate: LearnerScreenTemplate;
  lockReason: string | null;
  lockMessage: string | null;
  lockAudioUrl: string | null;
  exercise: LearnerExerciseConfig | null;
}

interface ActivityAssetReference {
  url: string;
  kind: LearnerMediaKind;
}

function compareWithIdTieBreaker(
  firstValue: number,
  secondValue: number,
  firstId: string | null | undefined,
  secondId: string | null | undefined,
): number {
  const primaryDiff = Number(firstValue) - Number(secondValue);
  if (primaryDiff !== 0) return primaryDiff;
  return String(firstId || '').localeCompare(String(secondId || ''));
}

function mapAssetKind(kind: string | null | undefined): LearnerMediaKind {
  const normalized = String(kind || '').trim().toLowerCase();
  if (['video', 'mp4'].includes(normalized)) return 'video';
  if (['audio', 'mp3'].includes(normalized)) return 'audio';
  if (['image', 'svg', 'png', 'jpg', 'jpeg'].includes(normalized)) return 'image';
  return null;
}

function mapAssetKindByUrl(url: string | null | undefined): LearnerMediaKind {
  const normalized = String(url || '').trim().toLowerCase();
  if (!normalized) return null;
  const cleanPath = normalized.split('?')[0].split('#')[0];
  if (/\.(mp4|mov|m4v|webm|ogv)$/i.test(cleanPath)) return 'video';
  if (/\.(mp3|wav|m4a|aac|ogg|oga)$/i.test(cleanPath)) return 'audio';
  if (/\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(cleanPath)) return 'image';
  return null;
}

function resolveAssetKind(kind: string | null | undefined, url: string | null | undefined): LearnerMediaKind {
  const kindFromField = mapAssetKind(kind);
  const kindFromUrl = mapAssetKindByUrl(url);
  if (!kindFromField) return kindFromUrl;
  if (!kindFromUrl) return kindFromField;
  return kindFromField === kindFromUrl ? kindFromField : kindFromUrl;
}

function toOptionalText(value: unknown): string | null {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function normalizeLetterToken(value: unknown): string | null {
  const asText = toOptionalText(value);
  if (!asText) return null;
  return asText.replace(/\s+/g, '').toUpperCase();
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeLetterToken(item))
    .filter((item): item is string => Boolean(item));
}

function normalizeExerciseTemplate(value: unknown): LearnerExerciseConfig['template'] | null {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return null;

  if (
    [
      'exercise-match-letter',
      'match-letter',
      'mark-letter-box',
      'marcar-quadrado-letra',
      'modelo-ensino-1',
      'rn121',
    ].includes(normalized)
  ) {
    return 'exercise-match-letter';
  }

  if (
    [
      'exercise-mark-images',
      'mark-images',
      'marcar-caixas',
      'marcar-caixas-imagens',
      'modelo-exercicio-marcar-caixas',
      'rn123',
    ].includes(normalized)
  ) {
    return 'exercise-mark-images';
  }

  return null;
}

function normalizeScreenTemplate(value: unknown): LearnerScreenTemplate {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase();
  if (!normalized) return 'default';

  if (['locked', 'locked-screen', 'tela-bloqueada', 'rn119', 'rn120'].includes(normalized)) {
    return 'locked';
  }

  const exerciseTemplate = normalizeExerciseTemplate(value);
  if (exerciseTemplate === 'exercise-match-letter') return 'exercise-match-letter';
  if (exerciseTemplate === 'exercise-mark-images') return 'exercise-mark-images';

  return 'default';
}

function buildLegacyGuidance(instructions: string): Pick<ParsedInstructionBundle, 'educatorGuidance' | 'learnerSpeech'> {
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

function normalizeExerciseItem(
  rawItem: unknown,
  itemIndex: number,
  template: LearnerExerciseConfig['template'],
  targetLetter: string | null,
): LearnerExerciseItem | null {
  if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
    return null;
  }

  const item = rawItem as Record<string, unknown>;
  const id = toOptionalText(item.id) || `item-${itemIndex + 1}`;
  const label =
    toOptionalText(item.label) ||
    toOptionalText(item.word) ||
    toOptionalText(item.title) ||
    `Item ${itemIndex + 1}`;
  const imageUrl =
    toOptionalText(item.imageUrl) || toOptionalText(item.image) || toOptionalText(item.storagePath);
  const wordAudioUrl =
    toOptionalText(item.wordAudioUrl) ||
    toOptionalText(item.audioUrl) ||
    toOptionalText(item.audio);
  const spellingAudioUrl =
    toOptionalText(item.spellingAudioUrl) ||
    toOptionalText(item.lettersAudioUrl) ||
    toOptionalText(item.spellAudioUrl);
  const audioUrl = wordAudioUrl;

  const optionsFromArray = normalizeStringList(item.options);
  const optionsFromText = toOptionalText(item.optionsText)
    ? String(item.optionsText)
        .split(/[,\s]+/g)
        .map((token) => normalizeLetterToken(token))
        .filter((token): token is string => Boolean(token))
    : [];
  const options = [...new Set([...optionsFromArray, ...optionsFromText])];

  const answerCandidate =
    normalizeLetterToken(item.answer) ||
    normalizeLetterToken(item.correctOption) ||
    normalizeLetterToken(item.correctLetter);
  const correctFromArray = normalizeStringList(item.correctOptions);
  const correctOptions = [...new Set([...(answerCandidate ? [answerCandidate] : []), ...correctFromArray])];

  const startsWithTarget =
    targetLetter && label.length > 0 ? label.toUpperCase().startsWith(targetLetter) : false;
  const explicitTarget = typeof item.isCorrectTarget === 'boolean' ? item.isCorrectTarget : startsWithTarget;

  const fallbackOptions =
    template === 'exercise-match-letter'
      ? [...new Set([...(options.length > 0 ? options : []), ...(targetLetter ? [targetLetter] : [])])]
      : options;

  return {
    id,
    label,
    imageUrl,
    audioUrl,
    wordAudioUrl,
    spellingAudioUrl,
    options: fallbackOptions,
    correctOptions: correctOptions.length > 0 ? correctOptions : targetLetter ? [targetLetter] : [],
    isCorrectTarget: explicitTarget,
  };
}

function normalizeErrorReinforcementConfig(value: unknown): LearnerErrorReinforcementConfig | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const payload = value as Record<string, unknown>;
  const mode = String(payload.mode ?? '').trim().toLowerCase();
  if (mode && mode !== 'reinforcement-screen') {
    return null;
  }

  const autoReturnRaw = Number(payload.autoReturnMs ?? payload.durationMs ?? payload.returnMs ?? 2500);
  const autoReturnMs = Number.isFinite(autoReturnRaw) && autoReturnRaw >= 500
    ? Math.floor(autoReturnRaw)
    : 2500;

  return {
    instructionText:
      toOptionalText(payload.instructionText) || toOptionalText(payload.message) || null,
    instructionAudioUrl:
      toOptionalText(payload.instructionAudioUrl) || toOptionalText(payload.audioUrl) || null,
    autoReturnMs,
    preserveProgress: payload.preserveProgress !== false,
  };
}

function normalizeExerciseConfig(rawExercise: unknown): LearnerExerciseConfig | null {
  if (!rawExercise || typeof rawExercise !== 'object' || Array.isArray(rawExercise)) {
    return null;
  }

  const exercise = rawExercise as Record<string, unknown>;
  const template = normalizeExerciseTemplate(exercise.template);
  if (!template) {
    return null;
  }

  const targetLetter =
    normalizeLetterToken(exercise.targetLetter) || normalizeLetterToken(exercise.letter) || null;
  const expectedSelectionsRaw = Number(exercise.expectedSelections ?? exercise.requiredSelections ?? null);
  const expectedSelections = Number.isFinite(expectedSelectionsRaw) && expectedSelectionsRaw > 0
    ? Math.floor(expectedSelectionsRaw)
    : null;
  const attemptsRaw = Number(exercise.maxAttemptsBeforeLock ?? exercise.maxAttempts ?? 3);
  const maxAttemptsBeforeLock = Number.isFinite(attemptsRaw) && attemptsRaw > 0 ? Math.floor(attemptsRaw) : 3;
  const progressiveUnlock =
    typeof exercise.progressiveUnlock === 'boolean'
      ? exercise.progressiveUnlock
      : template === 'exercise-match-letter';

  const rawItems = Array.isArray(exercise.items) ? exercise.items : [];
  const items = rawItems
    .map((rawItem, itemIndex) => normalizeExerciseItem(rawItem, itemIndex, template, targetLetter))
    .filter((item): item is LearnerExerciseItem => Boolean(item));

  if (items.length === 0) {
    return null;
  }

  const inferredExpectedSelections =
    template === 'exercise-mark-images'
      ? items.filter((item) => item.isCorrectTarget).length || expectedSelections || 1
      : expectedSelections || 1;

  const feedbackFlow = exercise.feedbackFlow && typeof exercise.feedbackFlow === 'object' && !Array.isArray(exercise.feedbackFlow)
    ? (exercise.feedbackFlow as Record<string, unknown>)
    : null;
  const errorReinforcement = normalizeErrorReinforcementConfig(
    feedbackFlow?.onError ?? exercise.errorReinforcement ?? exercise.reinforcement,
  );

  return {
    template,
    targetLetter,
    instructionText: toOptionalText(exercise.instructionText) || toOptionalText(exercise.instruction),
    instructionAudioUrl:
      toOptionalText(exercise.instructionAudioUrl) || toOptionalText(exercise.audioUrl) || null,
    expectedSelections: inferredExpectedSelections,
    maxAttemptsBeforeLock,
    progressiveUnlock,
    successFeedback: toOptionalText(exercise.successFeedback),
    errorFeedback: toOptionalText(exercise.errorFeedback),
    errorReinforcement,
    items,
  };
}

function hydrateExerciseWithAssets(
  exercise: LearnerExerciseConfig | null,
  assetReferences: ActivityAssetReference[],
): LearnerExerciseConfig | null {
  if (!exercise) return null;

  const audioUrls = assetReferences.filter((asset) => asset.kind === 'audio').map((asset) => asset.url);
  const imageUrls = assetReferences.filter((asset) => asset.kind === 'image').map((asset) => asset.url);

  let imageCursor = 0;
  let audioCursor = 0;
  const nextItems = exercise.items.map((item) => {
    const nextImage = item.imageUrl || imageUrls[imageCursor] || null;
    if (!item.imageUrl && nextImage) {
      imageCursor += 1;
    }

    const nextWordAudio = item.wordAudioUrl || item.audioUrl || audioUrls[audioCursor] || null;
    if (!item.wordAudioUrl && !item.audioUrl && nextWordAudio) {
      audioCursor += 1;
    }
    const nextSpellingAudio = item.spellingAudioUrl || null;

    return {
      ...item,
      imageUrl: nextImage,
      audioUrl: nextWordAudio,
      wordAudioUrl: nextWordAudio,
      spellingAudioUrl: nextSpellingAudio,
    };
  });

  return {
    ...exercise,
    instructionAudioUrl: exercise.instructionAudioUrl || audioUrls[audioCursor] || null,
    items: nextItems,
  };
}

function parseGuidance(
  instructions: string | null | undefined,
  assetReferences: ActivityAssetReference[] = [],
): ParsedInstructionBundle {
  const normalized = String(instructions || '').trim();
  if (!normalized) {
    return {
      educatorGuidance: null,
      learnerSpeech: null,
      screenTemplate: 'default',
      lockReason: null,
      lockMessage: null,
      lockAudioUrl: null,
      exercise: null,
    };
  }

  const canBeJson = normalized.startsWith('{') && normalized.endsWith('}');
  if (canBeJson) {
    try {
      const parsed = JSON.parse(normalized) as Record<string, unknown>;
      const screenTemplate = normalizeScreenTemplate(parsed.screenTemplate ?? parsed.template);
      const legacyGuidance = buildLegacyGuidance(
        [
          toOptionalText(parsed.educatorGuidance) || toOptionalText(parsed.orientacaoAlfabetizador) || '',
          toOptionalText(parsed.learnerSpeech) || toOptionalText(parsed.orientacaoAlfabetizando) || '',
        ]
          .filter(Boolean)
          .join('\n\n'),
      );
      const explicitEducator =
        toOptionalText(parsed.educatorGuidance) || toOptionalText(parsed.orientacaoAlfabetizador);
      const explicitLearner =
        toOptionalText(parsed.learnerSpeech) || toOptionalText(parsed.orientacaoAlfabetizando);
      const lockReason =
        toOptionalText(parsed.lockReason) || toOptionalText(parsed.blockReason) || null;
      const lockMessage =
        toOptionalText(parsed.lockMessage) || toOptionalText(parsed.blockMessage) || null;
      const lockAudioUrl =
        toOptionalText(parsed.lockAudioUrl) || toOptionalText(parsed.blockAudioUrl) || null;
      const parsedExercise = normalizeExerciseConfig(parsed.exercise ?? parsed.interaction);

      return {
        educatorGuidance: explicitEducator ?? legacyGuidance.educatorGuidance,
        learnerSpeech: explicitLearner ?? legacyGuidance.learnerSpeech,
        screenTemplate:
          parsedExercise?.template === 'exercise-match-letter'
            ? 'exercise-match-letter'
            : parsedExercise?.template === 'exercise-mark-images'
              ? 'exercise-mark-images'
              : screenTemplate,
        lockReason,
        lockMessage,
        lockAudioUrl,
        exercise: hydrateExerciseWithAssets(parsedExercise, assetReferences),
      };
    } catch {
      // Se nao for um JSON valido, segue o parser legado de texto.
    }
  }

  const legacy = buildLegacyGuidance(normalized);
  return {
    educatorGuidance: legacy.educatorGuidance,
    learnerSpeech: legacy.learnerSpeech,
    screenTemplate: 'default',
    lockReason: null,
    lockMessage: null,
    lockAudioUrl: null,
    exercise: null,
  };
}

function normalizeText(value: string | null | undefined, fallback: string): string {
  const text = String(value || '').trim();
  return text.length > 0 ? text : fallback;
}

function withSequentialModuleLabels(modules: LearnerFlowModule[]): LearnerFlowModule[] {
  return modules.map((moduleItem, moduleIndex) => {
    const moduleLabel = `MODULO ${moduleIndex + 1}`;
    return {
      ...moduleItem,
      lessons: moduleItem.lessons.map((lesson) => ({
        ...lesson,
        moduleLabel,
      })),
    };
  });
}

function buildFallbackModules(): LearnerFlowModule[] {
  return [];
}

export function mapPainelToModules(payload: PainelConteudoResponse): LearnerFlowModule[] {
  const themes = [...(payload.themes || [])].sort((a, b) =>
    compareWithIdTieBreaker(a.sort_order ?? 0, b.sort_order ?? 0, a.id, b.id),
  );
  if (themes.length === 0) {
    return [];
  }

  const hasNestedShape = themes.some((theme) => Array.isArray(theme.learningUnits) && theme.learningUnits.length > 0);

  if (hasNestedShape) {
    const mappedNested = themes.map((theme, themeIndex) => {
      const learningUnits = [...(theme.learningUnits || [])].sort((a, b) =>
        compareWithIdTieBreaker(a.order ?? a.sort_order ?? 0, b.order ?? b.sort_order ?? 0, a.id, b.id),
      );

      const lessons: LearnerFlowLesson[] = learningUnits.map((unit) => {
        const activities = [...(unit.activities || [])].sort((a, b) =>
          compareWithIdTieBreaker(a.order ?? a.sort_order ?? 0, b.order ?? b.sort_order ?? 0, a.id, b.id),
        );

        const screens: LearnerFlowScreen[] = activities.map((activity, activityIndex): LearnerFlowScreen => {
          const normalizedAssets = (activity.assets || [])
            .map((item) => item.asset)
            .filter((item): item is PainelAsset => Boolean(item && (item.sourceUrl || item.storage_path)));
          const assetReferences: ActivityAssetReference[] = normalizedAssets
            .map((asset) => {
              const url = asset.sourceUrl || asset.storage_path || null;
              if (!url) return null;
              return {
                url,
                kind: resolveAssetKind(asset.kind, url),
              };
            })
            .filter((item): item is ActivityAssetReference => Boolean(item));

          const mainAsset = normalizedAssets[0] ?? null;
          const followUpAsset = normalizedAssets[1] ?? null;
          const guidanceFromInstruction = parseGuidance(activity.instructions, assetReferences);

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
            mediaKind: resolveAssetKind(
              mainAsset?.kind,
              mainAsset?.sourceUrl || mainAsset?.storage_path || null,
            ),
            highlightMessage:
              activityIndex === Math.floor((activities.length - 1) / 2) && activities.length > 2
                ? 'Metade da aula! Continue assim!'
                : null,
            followUpActivity: followUpAsset
              ? ({
                  id: `${activity.id}-followup`,
                  title: `Atividade - ${normalizeText(activity.title, `Tela ${activityIndex + 1}`)}`,
                  educatorGuidance:
                    normalizeText(activity.instructorGuidance, guidanceFromInstruction.educatorGuidance || '').trim() || null,
                  learnerSpeech:
                    normalizeText(activity.learnerGuidance, guidanceFromInstruction.learnerSpeech || '').trim() || null,
                  mediaUrl: followUpAsset.sourceUrl || followUpAsset.storage_path || null,
                  mediaKind: resolveAssetKind(
                    followUpAsset.kind,
                    followUpAsset.sourceUrl || followUpAsset.storage_path || null,
                  ),
                  completionMessage: 'Muito bem! Continue para a proxima etapa da aula.',
                  screenTemplate: 'default',
                  lockReason: null,
                  lockMessage: null,
                  lockAudioUrl: null,
                  exercise: null,
                } as LearnerFlowActivity)
              : null,
            screenTemplate: guidanceFromInstruction.screenTemplate,
            lockReason: guidanceFromInstruction.lockReason,
            lockMessage: guidanceFromInstruction.lockMessage,
            lockAudioUrl: guidanceFromInstruction.lockAudioUrl,
            exercise: guidanceFromInstruction.exercise,
          };
        });

        const fallbackScreen: LearnerFlowScreen = {
          id: `${unit.id}-screen-1`,
          title: normalizeText(unit.title, 'Aula'),
          educatorGuidance: normalizeText(unit.description, 'Siga a orientacao desta aula.').trim(),
          learnerSpeech: null,
          mediaUrl: null,
          mediaKind: null,
          highlightMessage: null,
          followUpActivity: null,
          screenTemplate: 'default',
          lockReason: null,
          lockMessage: null,
          lockAudioUrl: null,
          exercise: null,
        };

        const safeScreens = screens.length > 0 ? screens : [fallbackScreen];

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
    return modulesWithLessons.length > 0
      ? withSequentialModuleLabels(modulesWithLessons)
      : [];
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
    bucket.sort((a, b) =>
      compareWithIdTieBreaker(a.order ?? a.sort_order ?? 0, b.order ?? b.sort_order ?? 0, a.id, b.id),
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
    bucket.sort((a, b) => {
      const createdAtDiff = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      if (createdAtDiff !== 0) return createdAtDiff;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
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
          const stageDiff = compareWithIdTieBreaker(
            a.stage_number ?? 0,
            b.stage_number ?? 0,
            a.id,
            b.id,
          );
          if (stageDiff !== 0) return stageDiff;
          return compareWithIdTieBreaker(a.order ?? a.sort_order ?? 0, b.order ?? b.sort_order ?? 0, a.id, b.id);
        });

      const lessons: LearnerFlowLesson[] = units.map((unit, unitIndex) => {
        const unitActivities = activitiesByModule.get(unit.id) ?? [];
        const linkedBlueprints = blueprintsByModule.get(unit.id) ?? [];

        const screens: LearnerFlowScreen[] = unitActivities.map((activity, activityIndex): LearnerFlowScreen => {
          const activityAssets = assetsByActivity.get(activity.id) ?? [];
          const assetReferences: ActivityAssetReference[] = activityAssets
            .map((asset) => {
              const url = asset.sourceUrl || asset.storage_path || null;
              if (!url) return null;
              return {
                url,
                kind: resolveAssetKind(asset.kind, url),
              };
            })
            .filter((item): item is ActivityAssetReference => Boolean(item));
          const mainAsset = activityAssets[0] ?? null;
          const followUpAsset = activityAssets[1] ?? null;
          const guidanceFromInstruction = parseGuidance(activity.instructions, assetReferences);

          return {
            id: activity.id,
            title: normalizeText(activity.title, `Tela ${activityIndex + 1}`),
            educatorGuidance: guidanceFromInstruction.educatorGuidance,
            learnerSpeech: guidanceFromInstruction.learnerSpeech,
            mediaUrl: mainAsset?.sourceUrl || mainAsset?.storage_path || null,
            mediaKind: resolveAssetKind(
              mainAsset?.kind,
              mainAsset?.sourceUrl || mainAsset?.storage_path || null,
            ),
            highlightMessage:
              activityIndex === Math.floor((unitActivities.length - 1) / 2) && unitActivities.length > 2
                ? 'Metade da aula! Continue assim!'
                : null,
            followUpActivity: followUpAsset
              ? ({
                  id: `${activity.id}-followup`,
                  title: `Atividade - ${normalizeText(activity.title, `Tela ${activityIndex + 1}`)}`,
                  educatorGuidance: guidanceFromInstruction.educatorGuidance,
                  learnerSpeech: guidanceFromInstruction.learnerSpeech,
                  mediaUrl: followUpAsset.sourceUrl || followUpAsset.storage_path || null,
                  mediaKind: resolveAssetKind(
                    followUpAsset.kind,
                    followUpAsset.sourceUrl || followUpAsset.storage_path || null,
                  ),
                  completionMessage: 'Muito bem! Continue para a proxima etapa da aula.',
                  screenTemplate: 'default',
                  lockReason: null,
                  lockMessage: null,
                  lockAudioUrl: null,
                  exercise: null,
                } as LearnerFlowActivity)
              : null,
            screenTemplate: guidanceFromInstruction.screenTemplate,
            lockReason: guidanceFromInstruction.lockReason,
            lockMessage: guidanceFromInstruction.lockMessage,
            lockAudioUrl: guidanceFromInstruction.lockAudioUrl,
            exercise: guidanceFromInstruction.exercise,
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
          screenTemplate: 'default',
          lockReason: null,
          lockMessage: null,
          lockAudioUrl: null,
          exercise: null,
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

  return mappedFlat.length > 0 ? withSequentialModuleLabels(mappedFlat) : [];
}
