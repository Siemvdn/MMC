import type { AdminSection } from '../../types/adminContent';
import type { ContentSection } from '../../types/content';

/**
 * Pure bewerkingen op een lijst secties.
 *
 * Staat los van de componenten omdat het niets met weergave te maken heeft, en
 * omdat het zo zonder DOM te testen is. Elke functie geeft een nieuwe lijst
 * terug in plaats van de bestaande aan te passen: React merkt een wijziging
 * alleen op als de verwijzing verandert.
 */

export type SectionType = ContentSection['type'];

/** De namen die de beheerder ziet bij "sectie toevoegen". */
export const SECTION_LABELS: Record<SectionType, string> = {
  hero: 'Kop van de pagina',
  prose: 'Tekstblok',
  quote: 'Citaat',
  list: 'Lijst met items',
  cta: 'Blok met knop',
  members: 'Leden',
  projects: 'Projecten',
  teaser: 'Vooruitblik',
};

/**
 * De sectietypes die de beheerder zelf mag toevoegen.
 *
 * Bewust niet allemaal. `cta` — het blok met de knop — valt af omdat die
 * knop altijd naar de contactpagina wijst: op een site van drie pagina's is
 * dat de enige zinnige bestemming, maar een blok kunnen toevoegen waarvan je
 * de knop niet kunt richten is verwarrend. En `hero` valt af omdat een
 * pagina er hoogstens één heeft, bovenaan; een tweede halverwege de pagina
 * levert een reusachtige kop op waar een gewone kop hoort.
 *
 * `members` en `projects` vallen af om dezelfde reden als `hero`: ze horen
 * één keer op hun eigen pagina. En `teaser` verwijst naar die twee, dus hoort
 * hij op een vaste plek op de homepage en niet overal.
 *
 * Bestaande secties van die soorten blijven gewoon te bewerken en te
 * verwijderen — ze zijn alleen niet nieuw aan te maken.
 */
export const ADDABLE_SECTION_TYPES = ['prose', 'quote', 'list'] as const;

export type AddableSectionType = (typeof ADDABLE_SECTION_TYPES)[number];

/**
 * Een lege sectie van het gevraagde type.
 *
 * De achtergrond begint licht. Een nieuwe sectie komt onderaan te staan, en
 * een getint vlak direct onder het vorige zou die twee tot één blok laten
 * samenvloeien — beter dat de beheerder er zelf voor kiest.
 */
export function blankSection(type: SectionType): AdminSection {
  const background = 'light' as const;

  switch (type) {
    case 'hero':
      return {
        type,
        background,
        kicker: '',
        heading: '',
        text: '',
        image: null,
        imageAlt: '',
        layout: 'beside',
        textColor: 'dark',
        actions: [],
      };
    case 'prose':
      return {
        type,
        background,
        heading: '',
        text: '',
        image: null,
        imageAlt: '',
        imagePosition: 'right',
      };
    case 'quote':
      return {
        type,
        background,
        text: '',
        supportingText: '',
        images: [],
        imagePosition: 'right',
      };
    case 'list':
      return { type, background, heading: '', intro: '', variant: 'cards', items: [] };
    case 'cta':
      return { type, background, heading: '', text: '', buttonLabel: '' };
    case 'members':
      return { type, background, heading: '', intro: '', members: [] };
    case 'projects':
      return { type, background, heading: '', intro: '', projects: [] };
    case 'teaser':
      return { type, background, heading: '', source: 'members', linkLabel: '' };
  }
}

export function addSection(sections: AdminSection[], type: SectionType): AdminSection[] {
  return [...sections, blankSection(type)];
}

export function removeSection(sections: AdminSection[], index: number): AdminSection[] {
  return sections.filter((_section, position) => position !== index);
}

/**
 * Verplaatst een item één plek omhoog of omlaag: een sectie, een lid of een
 * project.
 *
 * Aan de randen gebeurt er niets, in plaats van dat het item naar de andere
 * kant springt — dat laatste zou een verrassing zijn bij een misklik.
 */
export function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;

  if (index < 0 || index >= items.length || target < 0 || target >= items.length) {
    return items;
  }

  const moved = [...items];
  const current = moved[index];
  const other = moved[target];

  // `noUncheckedIndexedAccess` staat aan, dus beide kunnen in theorie
  // ontbreken; de controle hierboven sluit dat feitelijk al uit.
  if (current === undefined || other === undefined) {
    return items;
  }

  moved[index] = other;
  moved[target] = current;

  return moved;
}

export function moveSection(
  sections: AdminSection[],
  index: number,
  direction: -1 | 1,
): AdminSection[] {
  return moveItem(sections, index, direction);
}

export function replaceSection(
  sections: AdminSection[],
  index: number,
  section: AdminSection,
): AdminSection[] {
  return sections.map((existing, position) => (position === index ? section : existing));
}

/**
 * Het id waarmee een sectiekaart in de editor te vinden is.
 *
 * Gebruikt om naar een sectie te springen als er in het voorbeeldvenster op
 * het bijbehorende blok geklikt wordt.
 */
export function sectionElementId(index: number): string {
  return `sectie-${String(index)}`;
}
