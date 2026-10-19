import type { PageSlug } from '../../constants/routes';
import { isPageContent, type AdminContent } from '../../types/adminContent';
import type { ContentSection, SiteContent } from '../../types/content';

export interface PreviewContent {
  slug: PageSlug;
  sections: ContentSection[];
  site: SiteContent;
}

/**
 * Welk document het voorbeeld erbij nodig heeft naast het document dat
 * bewerkt wordt.
 *
 * Een pagina heeft `site` nodig voor de kop en de voettekst. Bij
 * Bedrijfsgegevens is het andersom: dat zijn juist de kop en de voettekst, en
 * dan is er een pagina nodig om ze op te tonen. De homepage is daarvoor de
 * logische keuze.
 */
export function companionOf(page: string): string {
  return page === 'site' ? 'home' : 'site';
}

/**
 * Stelt samen wat het voorbeeld moet tonen.
 *
 * Geeft `null` zolang niet alles binnen is; het voorbeeld toont dan nog niets
 * in plaats van een halve pagina.
 */
export function previewFor(
  page: string,
  draft: AdminContent | null,
  companion: AdminContent | null,
): PreviewContent | null {
  if (draft === null || companion === null) {
    return null;
  }

  // Bedrijfsgegevens bewerken: de bewerkte gegevens op de homepage tonen,
  // zodat de merknaam in de kop en de contactgegevens in de voettekst meteen
  // zichtbaar meebewegen.
  if (page === 'site') {
    if (isPageContent(draft) || !isPageContent(companion)) {
      return null;
    }

    return { slug: 'home', sections: companion.sections, site: draft };
  }

  if (!isPageContent(draft) || isPageContent(companion)) {
    return null;
  }

  if (!isPageSlug(page)) {
    return null;
  }

  return { slug: page, sections: draft.sections, site: companion };
}

function isPageSlug(value: string): value is PageSlug {
  return (
    value === 'home' ||
    value === 'over-ons' ||
    value === 'contact' ||
    value === 'privacy' ||
    value === 'terms'
  );
}
