import { useCallback, useEffect, useMemo, useState } from 'react';
import { httpClient } from '../../infra/api/http-client';
import {
  LearnerFlowLesson,
  LearnerFlowModule,
  mapPainelToModules,
  PainelConteudoResponse,
} from './learnerFlowMapper';
import { useOptionalLearnerSession } from './learnerSessionContext';

export type {
  LearnerFlowActivity,
  LearnerFlowLesson,
  LearnerFlowModule,
  LearnerFlowScreen,
  LearnerMediaKind,
  PainelConteudoResponse,
} from './learnerFlowMapper';

let cachedModules: LearnerFlowModule[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

async function fetchLearnerModules(): Promise<LearnerFlowModule[]> {
  // published=true garante que rascunhos do CMS nao apareçam para o alfabetizando.
  const payload = await httpClient.get<PainelConteudoResponse>(
    '/painel/conteudo?scope=cms&published=true',
  );
  return mapPainelToModules(payload);
}

async function fetchCompletedProgressIds(learnerProfileId: string): Promise<Set<string>> {
  try {
    const result = await httpClient.get<{ completedActivityIds: string[] }>(
      `/painel/progress/${learnerProfileId}`,
    );
    return new Set(result.completedActivityIds ?? []);
  } catch {
    return new Set();
  }
}

export function useLearnerFlowData() {
  const session = useOptionalLearnerSession();
  const learnerProfileId = session?.learnerProfileId ?? null;

  const [modules, setModules] = useState<LearnerFlowModule[]>(cachedModules ?? []);
  const [loading, setLoading] = useState(cachedModules === null);
  const [error, setError] = useState<string | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const now = Date.now();
    if (cachedModules && now - cacheTimestamp < CACHE_TTL_MS) {
      setModules(cachedModules);
      setLoading(false);
    } else {
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
        setModules([]);
        cachedModules = [];
        cacheTimestamp = now;
      } finally {
        setLoading(false);
      }
    }

    if (learnerProfileId && !learnerProfileId.startsWith('learner-local-profile-')) {
      const ids = await fetchCompletedProgressIds(learnerProfileId);
      setCompletedLessonIds(ids);
    }
  }, [learnerProfileId]);

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
    completedLessonIds,
    refresh: load,
    getLesson,
  };
}
