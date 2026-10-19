/**
 * De centrale siteconfiguratie: alles wat van de ontwikkelaar is en pas na
 * een nieuwe build verandert.
 *
 * Gebruikt door de bouwplugin voor SEO-tags (`vite-seo.ts`) en door het
 * LocalBusiness-schema. Het domein staat hier één keer: canonical, Open Graph
 * en het schema moeten allemaal dezelfde schrijfwijze gebruiken, anders telt
 * Google ze als verschillende pagina's.
 *
 * Twee soorten sitegegevens staan bewust níét hier (CLAUDE.md §10, §12):
 *
 * - Bedrijfsnaam, telefoon, e-mail, werkgebied en `sameAs`-links staan in
 *   `backend/storage/content/site.json`. De klant bewerkt die zelf in het
 *   beheer (Bedrijfsgegevens), en de footer leest ze live.
 * - De `<title>` en meta description staan per pagina onder `meta` in de
 *   content-JSON van die pagina.
 *
 * Het domein komt daarnaast letterlijk voor in `public/robots.txt`,
 * `public/sitemap.xml` en `public/llms.txt`; die zijn statisch en moeten
 * tegelijk met `SITE_ORIGIN` bijgewerkt worden.
 */

/**
 * Zonder slash aan het eind, zodat `${SITE_ORIGIN}${route.path}` klopt.
 *
 * [TODO: domein] — vervang ook in robots.txt, sitemap.xml en llms.txt.
 */
export const SITE_ORIGIN = 'https://[TODO-domein]';

/** De taal-regio voor Open Graph (anders dan `lang="nl"`, dat is alleen de taal). */
export const SITE_LOCALE = 'nl_NL';

/**
 * De afbeelding die bij een gedeelde link getoond wordt, en `image` in het
 * schema. Liefst liggend, 1200 × 630; zet dan ook `twitter:card` op
 * `summary_large_image` in `vite-seo.ts`.
 *
 * [TODO: deelafbeelding] — welke foto of welk logo, bepaalt de klant (§2).
 */
export const SOCIAL_IMAGE_PATH = '/favicon/[TODO-deelafbeelding].png';

/**
 * Het schema.org-type van het bedrijf.
 *
 * [TODO: schema-type] — `LocalBusiness` is altijd geldig; een specifieker
 * subtype mag alleen als het aantoonbaar klopt met wat de klant doet.
 */
export const SCHEMA_BUSINESS_TYPE = 'LocalBusiness';
