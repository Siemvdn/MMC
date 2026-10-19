import { describe, expect, it } from 'vitest';

import type { AdminSection } from '../../types/adminContent';
import {
  ADDABLE_SECTION_TYPES,
  SECTION_LABELS,
  addSection,
  blankSection,
  moveSection,
  removeSection,
  replaceSection,
} from './sectionTools';

/**
 * Dit is de logica die bepaalt wat er met de content van de klant gebeurt als
 * hij secties toevoegt, weghaalt of verschuift. Een fout hier betekent
 * verdwenen of door elkaar geraakte teksten.
 */
describe('sectionTools', () => {
  function sections(...headings: string[]): AdminSection[] {
    return headings.map((heading) => ({
      type: 'prose',
      background: 'light',
      heading,
      text: '',
      image: null,
      imageAlt: '',
      imagePosition: 'right',
    }));
  }

  function headings(list: AdminSection[]): string[] {
    return list.map((section) => ('heading' in section ? section.heading : '?'));
  }

  it('maakt een lege sectie met precies de velden die het type kent', () => {
    expect(blankSection('prose')).toEqual({
      type: 'prose',
      background: 'light',
      heading: '',
      text: '',
      image: null,
      imageAlt: '',
      imagePosition: 'right',
    });
    expect(blankSection('quote')).toEqual({
      type: 'quote',
      background: 'light',
      text: '',
      supportingText: '',
      images: [],
      imagePosition: 'right',
    });
    expect(blankSection('list')).toEqual({
      type: 'list',
      background: 'light',
      heading: '',
      intro: '',
      variant: 'cards',
      items: [],
    });
    expect(blankSection('cta')).toEqual({
      type: 'cta',
      background: 'light',
      heading: '',
      text: '',
      buttonLabel: '',
    });
  });

  it('voegt een sectie achteraan toe zonder de bestaande aan te raken', () => {
    const origineel = sections('een', 'twee');
    const resultaat = addSection(origineel, 'cta');

    expect(headings(resultaat).slice(0, 2)).toEqual(['een', 'twee']);
    expect(resultaat).toHaveLength(3);
    expect(origineel).toHaveLength(2);
  });

  it('verwijdert precies de aangewezen sectie', () => {
    expect(headings(removeSection(sections('een', 'twee', 'drie'), 1))).toEqual(['een', 'drie']);
  });

  it('verwisselt twee secties bij verplaatsen', () => {
    const lijst = sections('een', 'twee', 'drie');

    expect(headings(moveSection(lijst, 0, 1))).toEqual(['twee', 'een', 'drie']);
    expect(headings(moveSection(lijst, 2, -1))).toEqual(['een', 'drie', 'twee']);
  });

  /**
   * Aan de randen gebeurt er niets. Zou de sectie naar de andere kant
   * springen, dan is één misklik genoeg om de volgorde overhoop te gooien.
   */
  it('doet niets bij verplaatsen voorbij de rand', () => {
    const lijst = sections('een', 'twee');

    expect(moveSection(lijst, 0, -1)).toBe(lijst);
    expect(moveSection(lijst, 1, 1)).toBe(lijst);
    expect(moveSection(lijst, 5, 1)).toBe(lijst);
  });

  it('vervangt één sectie en laat de rest staan', () => {
    const lijst = sections('een', 'twee');
    const vervanger: AdminSection = {
      type: 'cta',
      background: 'light',
      heading: 'nieuw',
      text: '',
      buttonLabel: '',
    };

    const resultaat = replaceSection(lijst, 1, vervanger);

    expect(headings(resultaat)).toEqual(['een', 'nieuw']);
    expect(resultaat[1]?.type).toBe('cta');
  });

  /** React ziet een wijziging alleen als de verwijzing verandert. */
  it('geeft telkens een nieuwe lijst terug', () => {
    const lijst = sections('een', 'twee');

    expect(addSection(lijst, 'prose')).not.toBe(lijst);
    expect(removeSection(lijst, 0)).not.toBe(lijst);
    expect(moveSection(lijst, 0, 1)).not.toBe(lijst);
  });
});

/**
 * Welke sectietypes de beheerder zelf mag toevoegen.
 *
 * Deze lijst is een productbesluit, geen technische beperking: bestaande
 * secties van de overige types blijven gewoon te bewerken. Een test erop
 * houdt vast waaróm ze eruit staan.
 */
describe('ADDABLE_SECTION_TYPES', () => {
  it('biedt een tekstblok, een citaat en een lijst aan', () => {
    expect([...ADDABLE_SECTION_TYPES]).toEqual(['prose', 'quote', 'list']);
  });

  /** De knop wijst altijd naar de contactpagina en is niet te richten. */
  it('biedt geen nieuw blok met knop aan', () => {
    expect(ADDABLE_SECTION_TYPES).not.toContain('cta');
  });

  /** Een pagina heeft er hoogstens één, bovenaan. */
  it('biedt geen tweede paginakop aan', () => {
    expect(ADDABLE_SECTION_TYPES).not.toContain('hero');
  });

  /** Elk aan te bieden type moet ook een naam hebben in de keuzelijst. */
  it('heeft voor elk aanbod een leesbare naam', () => {
    for (const type of ADDABLE_SECTION_TYPES) {
      expect(SECTION_LABELS[type]).toBeTruthy();
    }
  });
});
