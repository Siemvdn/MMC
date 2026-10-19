/**
 * De pagina's van de site, op één plek.
 *
 * Dit bestand wordt zowel door de componenten gebruikt (voor de navigatie)
 * als door `vite.config.ts` (voor de HTML-ingangen en de schone URL's in
 * de dev-server). Eén bron, zodat een nieuwe pagina niet op meerdere plekken
 * toegevoegd hoeft te worden.
 */

/** De slug zoals de backend hem kent: `GET /api/content/{page}`. */
export type PageSlug = 'home' | 'over-ons' | 'contact' | 'privacy' | 'terms';

export interface RouteDefinition {
  /** Waar de pagina staat, zonder extensie. */
  readonly path: string;
  /** Het HTML-bestand dat Vite voor deze pagina bouwt. */
  readonly htmlFile: string;
  /** De slug waarmee de content opgehaald wordt. */
  readonly slug: PageSlug;
  /** De tekst in de navigatie. */
  readonly label: string;
  /**
   * Of de pagina in de hoofdnavigatie staat. Standaard aan; de
   * privacyverklaring en de algemene voorwaarden staan bewust alleen in de
   * footer — gebruikelijk voor zulke pagina's, en de hoofdnavigatie blijft zo
   * kort en overzichtelijk. Contact staat er ook niet in: de knop
   * `HEADER_ACTION` ernaast wijst al naar dezelfde pagina.
   */
  readonly showInNav?: boolean;
}

export const ROUTES: readonly RouteDefinition[] = [
  { path: '/', htmlFile: 'index.html', slug: 'home', label: 'Home' },
  { path: '/over-ons', htmlFile: 'over-ons.html', slug: 'over-ons', label: 'Over ons' },
  {
    path: '/contact',
    htmlFile: 'contact.html',
    slug: 'contact',
    label: 'Contact',
    showInNav: false,
  },
  {
    path: '/privacyverklaring',
    htmlFile: 'privacyverklaring.html',
    slug: 'privacy',
    label: 'Privacyverklaring',
    showInNav: false,
  },
  {
    path: '/algemene-voorwaarden',
    htmlFile: 'algemene-voorwaarden.html',
    slug: 'terms',
    label: 'Algemene voorwaarden',
    showInNav: false,
  },
];

/**
 * De vaste knop rechts in de kop, op elke pagina.
 *
 * Staat hier bij de navigatielabels en niet in de content-JSON: het is
 * onderdeel van het chroom om de pagina heen, net als de menu-items, en niet
 * iets wat per pagina verschilt.
 */
export const HEADER_ACTION = { label: '[TODO: knoptekst]', slug: 'contact' } as const;

/**
 * Het pad bij een slug.
 *
 * De knoppen in de content verwijzen naar een slug in plaats van naar een
 * pad, zodat een pagina ooit kan verhuizen zonder dat de opgeslagen content
 * naar een adres wijst dat niet meer bestaat.
 */
export function pathForSlug(slug: PageSlug): string {
  const route = ROUTES.find((candidate) => candidate.slug === slug);

  // Kan alleen als ROUTES en PageSlug uit elkaar lopen; dan is de homepage
  // een betere uitkomst dan een link naar undefined.
  return route?.path ?? '/';
}
