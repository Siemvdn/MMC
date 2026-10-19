import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageSections } from './PageSections';
import type { ContentSection, SectionBackground } from '../../types/content';

function prose(heading: string, background: SectionBackground): ContentSection {
  return {
    type: 'prose',
    background,
    heading,
    text: 'Tekst.',
    image: null,
    imageAlt: '',
    imagePosition: 'right',
  };
}

/**
 * De achtergrond zat eerst in een automatische regel op basis van sectietype
 * en positie. Nu kiest de beheerder hem per sectie: welke blokken een vlak
 * verdienen hangt af van wat erin staat, en dat weet alleen wie de tekst
 * schrijft.
 */
describe('de achtergrond van een sectie', () => {
  function backgrounds(sections: ContentSection[]): boolean[] {
    const { container } = render(<PageSections sections={sections} />);

    return [...container.querySelectorAll('section')].map((element) =>
      element.className.includes('band'),
    );
  }

  it('volgt precies wat er in de content staat', () => {
    expect(backgrounds([prose('Een', 'light'), prose('Twee', 'tinted')])).toEqual([false, true]);
  });

  /**
   * De oude regel gaf een lijstsectie automatisch een vlak en de eerste sectie
   * altijd. Beide zijn losgelaten; alleen het veld telt nog.
   */
  it('trekt geen conclusies uit het type of de positie', () => {
    const sections: ContentSection[] = [
      {
        type: 'list',
        background: 'light',
        variant: 'cards',
        heading: 'Lijst',
        intro: '',
        items: [],
      },
      prose('Alsnog getint', 'tinted'),
    ];

    expect(backgrounds(sections)).toEqual([false, true]);
  });

  /** Twee vlakken naast elkaar mogen: het is een keuze, geen ongeluk. */
  it('staat twee getinte vlakken onder elkaar toe', () => {
    expect(backgrounds([prose('Een', 'tinted'), prose('Twee', 'tinted')])).toEqual([true, true]);
  });
});
