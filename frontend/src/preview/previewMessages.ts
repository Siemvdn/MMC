import type { PageSlug } from '../constants/routes';
import type { ContentSection, SiteContent } from '../types/content';

/**
 * Het berichtcontract tussen het beheerscherm en de voorbeeldpagina.
 *
 * Beide kanten gebruiken dit bestand, zodat er geen twee opvattingen kunnen
 * ontstaan over wat er heen en weer gaat.
 *
 * ## Waarom hier zoveel controle op zit
 *
 * `postMessage` is standaard open: elk venster mag elk ander venster iets
 * sturen. Zonder controle zou een andere site die de voorbeeldpagina in een
 * frame opent, kunnen bepalen wat daar getoond wordt. Twee maatregelen sluiten
 * dat af:
 *
 *   1. **Herkomst.** Beide kanten weigeren alles wat niet van dezelfde
 *      herkomst komt. Dat is de eigenlijke grendel.
 *   2. **Vorm.** Een bericht moet ons kenmerk dragen en een bekend type
 *      hebben. Dat houdt geen aanvaller tegen, maar wel het geklets van
 *      browserextensies en ontwikkelgereedschap, dat anders als geldige
 *      inhoud zou binnenkomen.
 *
 * Daarbovenop staat in de `.htaccess` dat alleen de eigen site mag framen.
 */

/** Kenmerk waaraan onze eigen berichten te herkennen zijn. */
const SOURCE = 'site-preview';

/** Van het beheerscherm naar het voorbeeld. */
export type ToPreview =
  | {
      source: typeof SOURCE;
      type: 'content';
      slug: PageSlug;
      sections: ContentSection[];
      site: SiteContent;
    }
  | {
      source: typeof SOURCE;
      type: 'highlight';
      /** `null` haalt de markering weg. */
      index: number | null;
    };

/** Van het voorbeeld terug naar het beheerscherm. */
export type FromPreview =
  | { source: typeof SOURCE; type: 'ready' }
  | { source: typeof SOURCE; type: 'select'; index: number };

export function contentMessage(
  slug: PageSlug,
  sections: ContentSection[],
  site: SiteContent,
): ToPreview {
  return { source: SOURCE, type: 'content', slug, sections, site };
}

export function highlightMessage(index: number | null): ToPreview {
  return { source: SOURCE, type: 'highlight', index };
}

export function readyMessage(): FromPreview {
  return { source: SOURCE, type: 'ready' };
}

export function selectMessage(index: number): FromPreview {
  return { source: SOURCE, type: 'select', index };
}

/**
 * Stuurt een bericht naar een venster, uitsluitend als dat op de eigen
 * herkomst draait.
 *
 * De herkomst wordt expliciet meegegeven in plaats van `'*'`. Met een sterretje
 * zou het bericht ook aankomen als het frame ondertussen naar een andere site
 * genavigeerd is — en dan zou de content van de klant daarheen gaan.
 */
export function post(target: Window | null, message: ToPreview | FromPreview): void {
  target?.postMessage(message, window.location.origin);
}

/** Leest een bericht van het beheerscherm; geeft null als het niet klopt. */
export function readToPreview(event: MessageEvent): ToPreview | null {
  const message = accept(event);

  if (message === null) {
    return null;
  }

  return message.type === 'content' || message.type === 'highlight' ? (message as ToPreview) : null;
}

/** Leest een bericht van het voorbeeld; geeft null als het niet klopt. */
export function readFromPreview(event: MessageEvent): FromPreview | null {
  const message = accept(event);

  if (message === null) {
    return null;
  }

  return message.type === 'ready' || message.type === 'select' ? (message as FromPreview) : null;
}

function accept(event: MessageEvent): { type: string } | null {
  if (event.origin !== window.location.origin) {
    return null;
  }

  const data: unknown = event.data;

  if (typeof data !== 'object' || data === null) {
    return null;
  }

  if (!('source' in data) || data.source !== SOURCE) {
    return null;
  }

  if (!('type' in data) || typeof data.type !== 'string') {
    return null;
  }

  return data as { type: string };
}
