import type { ContentSection, SiteContent } from './content';

/**
 * De content zoals het beheergedeelte hem ziet: de rúwe inhoud van het
 * JSON-bestand.
 *
 * Het verschil met `PageContent` uit `content.ts` is wat er níet weggehaald
 * is. De publieke API verwijdert de `_todo`-aantekeningen en laat lege secties
 * weg; hier komt het bestand ongewijzigd binnen, want de beheerder bewerkt de
 * bron en moet zien wat er nog openstaat.
 */

/** Een sectie kan een aantekening dragen over wat er nog moet gebeuren. */
export type AdminSection = ContentSection & { _todo?: string };

export interface AdminPageContent {
  meta: { title: string; description: string };
  sections: AdminSection[];
  _todo?: string[];
}

export type AdminSiteContent = SiteContent & { _todo?: string[] };

export type AdminContent = AdminPageContent | AdminSiteContent;

/** Wat `GET /api/admin/content/{page}` teruggeeft. */
export interface AdminContentResponse<T extends AdminContent = AdminContent> {
  page: string;
  content: T;
  /** Of er een vorige versie is om terug te zetten. */
  hasPreviousVersion: boolean;
  /**
   * De maximale lengte per veld, in tekens, zoals de server hem afdwingt.
   *
   * Komt van de server en staat dus niet als kopie in de frontend. Deed hij
   * dat wel, dan lopen de twee uit elkaar — wat ook gebeurde: het beheer
   * meldde nog 800 tekens toen de grens al op 2000 stond.
   */
  limits: Record<string, number>;
  /**
   * De toegestane waarden per keuzeveld, zoals de server ze afdwingt.
   *
   * Net als de lengtegrenzen: van de server, zodat het keuzemenu in het
   * beheer nooit iets aanbiedt dat bij het opslaan geweigerd wordt.
   */
  choices: Record<string, string[]>;
}

export function isPageContent(content: AdminContent): content is AdminPageContent {
  return 'sections' in content;
}
