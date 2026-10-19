/**
 * De vorm van wat `GET /api/content/{page}` teruggeeft.
 *
 * Deze types beschrijven dezelfde afspraak als
 * `backend/storage/content/README.md` en de Validators in de backend. Wijzigt
 * daar een veld, dan wijzigt het hier mee — anders klopt de ene kant van de
 * lijn niet meer met de andere.
 *
 * De `_`-sleutels uit de JSON-bestanden komen hier bewust niet in voor: de
 * ContentService verwijdert die vóór verzending, dus de frontend krijgt ze
 * nooit te zien.
 */

import type { PageSlug } from '../constants/routes';

export interface ContentMeta {
  title: string;
  description: string;
}

/**
 * De achtergrond van een sectie: de gewone achtergrond van de pagina, of een
 * getint vlak. Welke kleuren dat zijn, bepalen de tokens in `styles/tokens.css`.
 *
 * Per sectie een keuze en geen automatische afwisseling. Welke blokken een
 * vlak verdienen hangt af van wat erin staat, en dat weet alleen degene die
 * de tekst schrijft.
 */
export type SectionBackground = 'light' | 'tinted';

export interface ListItem {
  title: string;
  text: string;
}

/** Naast de tekst, of als brede banner met de tekst over de foto. */
export type HeroLayout = 'beside' | 'banner';

/**
 * De kleur van de tekst op een banner.
 *
 * Een keuze en geen automatische berekening: of witte of zwarte tekst
 * leesbaar is hangt af van wat er toevallig op de foto staat, en dat kan
 * alleen iemand beoordelen die de foto ziet.
 */
export type HeroTextColor = 'dark' | 'light';

/**
 * Een knop onder de paginakop.
 *
 * `target` is een pagina van deze site en geen vrij adres. Dat scheelt de
 * beheerder het intypen van een URL, en daarmee de meest gemaakte fout: een
 * link die nergens heen gaat.
 */
export interface HeroAction {
  label: string;
  target: PageSlug;
}

export interface HeroSection {
  type: 'hero';
  background: SectionBackground;
  kicker: string;
  heading: string;
  text: string;
  image: string | null;
  imageAlt: string;
  layout: HeroLayout;
  textColor: HeroTextColor;
  /** Hoogstens twee; een lege lijst betekent geen knoppen. */
  actions: HeroAction[];
}

/**
 * Aan welke kant van de tekst de foto staat, bij een `prose`- of
 * `quote`-sectie.
 *
 * Een keuze van de beheerder en geen vaste indeling: welke kant het beste
 * oogt hangt af van de foto en van wat er al boven of onder staat.
 */
export type ImagePosition = 'left' | 'right';

export interface ProseSection {
  type: 'prose';
  background: SectionBackground;
  heading: string;
  text: string;
  image: string | null;
  imageAlt: string;
  imagePosition: ImagePosition;
}

/**
 * Eén foto in de carrousel van een citaatblok.
 *
 * Anders dan het losse afbeeldingsveld elders is hier geen `null`-toestand:
 * een lege plek in de carrousel laat je gewoon weg.
 */
export interface QuoteImage {
  image: string;
  imageAlt: string;
}

/**
 * Een uitgelicht citaat met een korte toelichting, eventueel met een
 * foto-carrousel.
 *
 * Bewust geen `heading`: een citaat opent geen nieuw onderwerp op de pagina.
 */
export interface QuoteSection {
  type: 'quote';
  background: SectionBackground;
  text: string;
  supportingText: string;
  /** Hoogstens tien; leeg betekent geen foto's. */
  images: QuoteImage[];
  imagePosition: ImagePosition;
}

/**
 * Hoe een lijst getoond wordt.
 *
 * `cards`: losse kaarten naast elkaar, voor dingen die naast elkaar bestaan
 * (de twee diensten). `steps`: genummerd, voor dingen die op volgorde gaan
 * (de werkwijze). `timeline`: bolletjes op een lijn, voor een verloop door de
 * tijd (een loopbaan). Dezelfde items, andere vorm — daarom een keuze op de
 * lijst en geen tweede sectietype met dezelfde velden.
 */
export type ListVariant = 'cards' | 'steps' | 'timeline';

export interface ListSection {
  type: 'list';
  background: SectionBackground;
  variant: ListVariant;
  heading: string;
  intro: string;
  items: ListItem[];
}

export interface CtaSection {
  type: 'cta';
  background: SectionBackground;
  heading: string;
  text: string;
  buttonLabel: string;
}

/**
 * Een discriminated union op `type`. Daardoor weet TypeScript in elke tak van
 * een switch precies welke velden bestaan, en klaagt hij zodra er een
 * sectietype bijkomt dat nergens afgehandeld wordt.
 */
export type ContentSection = HeroSection | ProseSection | QuoteSection | ListSection | CtaSection;

/** De gegevens die op élke pagina terugkomen, uit site.json. */
export interface SiteContent {
  businessName: string;
  contact: {
    phone: string;
    email: string;
    area: string;
  };
  sameAs: string[];
}

export interface PageContent {
  meta: ContentMeta;
  sections: ContentSection[];
  site: SiteContent;
}
