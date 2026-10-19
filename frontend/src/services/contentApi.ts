import type { PageSlug } from '../constants/routes';
import type { PageContent } from '../types/content';
import { requestJson } from './apiClient';

/**
 * De publieke content-endpoints.
 *
 * De foutafhandeling en het uitlezen van het antwoordformaat zitten in
 * `apiClient`; hier staat alleen wélk adres bij welke pagina hoort.
 */
export function fetchPageContent(slug: PageSlug, signal: AbortSignal): Promise<PageContent> {
  return requestJson<PageContent>(`/api/content/${slug}`, { signal });
}
