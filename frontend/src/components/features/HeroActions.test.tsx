import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageSections } from './PageSections';
import type { HeroAction, HeroSection } from '../../types/content';

function hero(actions: HeroAction[]): HeroSection {
  return {
    type: 'hero',
    background: 'light',
    kicker: 'Bovenkop',
    heading: 'Een kop',
    text: 'Een inleidende tekst.',
    image: null,
    imageAlt: '',
    layout: 'beside',
    textColor: 'dark',
    actions,
  };
}

/**
 * De knoppen onder de paginakop zijn de enige plek in de content met een
 * link erin. Wijst er één naar het verkeerde pad, dan loopt de belangrijkste
 * route van de site dood — en dat is aan de pagina zelf niet te zien.
 */
describe('de knoppen onder de paginakop', () => {
  it('wijst elke knop naar het pad van zijn pagina', () => {
    render(
      <PageSections
        sections={[
          hero([
            { label: 'Neem contact op', target: 'contact' },
            { label: 'Meer over ons', target: 'over-ons' },
          ]),
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Neem contact op' }).getAttribute('href')).toBe(
      '/contact',
    );
    expect(screen.getByRole('link', { name: 'Meer over ons' }).getAttribute('href')).toBe(
      '/over-ons',
    );
  });

  /** Een link is te openen in een nieuw tabblad; een knop niet (§14). */
  it('maakt er links van en geen knoppen', () => {
    render(<PageSections sections={[hero([{ label: 'Meer over ons', target: 'over-ons' }])]} />);

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('toont niets als er geen knoppen zijn ingesteld', () => {
    render(<PageSections sections={[hero([])]} />);

    expect(screen.queryByRole('link')).toBeNull();
  });
});
