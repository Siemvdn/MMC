import type { HeadingLevel } from '../ui/Heading';

/** Het kopniveau van de naam of titel in een kaart. */
export type CardTitleTag = 'h2' | 'h3';

/**
 * Eén niveau onder de kop van de sectie waar de kaarten in staan.
 *
 * Normaal is dat h3, onder een sectie met h2. Staat de sectie bovenaan de
 * pagina en heeft hij dus de h1, dan worden de kaarten h2 — anders slaat de
 * kophiërarchie een niveau over (CLAUDE.md §12, §14).
 */
export function cardTitleTag(sectionLevel: HeadingLevel): CardTitleTag {
  return sectionLevel === 1 ? 'h2' : 'h3';
}
