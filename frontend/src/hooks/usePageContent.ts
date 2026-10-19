import { useCallback } from 'react';

import type { PageSlug } from '../constants/routes';
import { fetchPageContent } from '../services/contentApi';
import type { PageContent } from '../types/content';
import { useFetch, type UseFetchResult } from './useFetch';

/**
 * Haalt de content van één pagina op.
 *
 * De `useCallback` is hier geen sierraad: `useFetch` draait opnieuw zodra de
 * laadfunctie verandert, dus zonder memoisatie zou elke render een nieuw
 * verzoek starten.
 */
export function usePageContent(slug: PageSlug): UseFetchResult<PageContent> {
  const load = useCallback((signal: AbortSignal) => fetchPageContent(slug, signal), [slug]);

  return useFetch(load);
}
