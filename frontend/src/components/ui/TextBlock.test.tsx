import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TextBlock } from './TextBlock';
import { toParagraphs } from '../../utils/toParagraphs';

/**
 * Wat de klant in het beheer intypt, hoort er op de site net zo uit te zien.
 * Zonder deze verwerking plakt HTML alle witruimte samen en wordt een tekst
 * met witregels één blok.
 */
describe('toParagraphs', () => {
  it('maakt van een lege regel een nieuwe alinea', () => {
    expect(toParagraphs('Eerste alinea.\n\nTweede alinea.')).toEqual([
      'Eerste alinea.',
      'Tweede alinea.',
    ]);
  });

  /** Eén enter is een regelafbreking, geen nieuwe alinea. */
  it('houdt een enkele regelafbreking binnen dezelfde alinea', () => {
    expect(toParagraphs('Regel een\nRegel twee')).toEqual(['Regel een\nRegel twee']);
  });

  it('vat meerdere lege regels op als één scheiding', () => {
    expect(toParagraphs('Een.\n\n\n\nTwee.')).toEqual(['Een.', 'Twee.']);
  });

  /** Windows zet \r\n; zonder gelijktrekken blijft die \r zichtbaar. */
  it('gaat om met Windows-regeleindes', () => {
    expect(toParagraphs('Een.\r\n\r\nTwee.')).toEqual(['Een.', 'Twee.']);
  });

  it('negeert spaties op een verder lege regel', () => {
    expect(toParagraphs('Een.\n   \nTwee.')).toEqual(['Een.', 'Twee.']);
  });

  it('geeft niets terug bij lege tekst', () => {
    expect(toParagraphs('')).toEqual([]);
    expect(toParagraphs('   \n  \n ')).toEqual([]);
  });
});

describe('TextBlock', () => {
  /** De tekst uit de vraag van de opdrachtgever. */
  it('rendert twee alinea’s als twee losse paragrafen', () => {
    const tekst =
      'Ronald Kerklaan werkte een deel van zijn opleiding met Herman den Blijker.\n\n' +
      'Daarnaast heeft hij negen jaar gewerkt bij een horecagroothandel.';

    const { container } = render(<TextBlock text={tekst} />);

    const alineas = container.querySelectorAll('p');

    expect(alineas).toHaveLength(2);
    expect(alineas[0]?.textContent).toContain('Herman den Blijker');
    expect(alineas[1]?.textContent).toContain('horecagroothandel');
  });

  it('rendert helemaal niets bij lege tekst', () => {
    const { container } = render(<TextBlock text="" />);

    expect(container.querySelector('p')).toBeNull();
  });

  /**
   * Wat de klant intypt is tekst en blijft tekst. HTML uit de invoer
   * uitvoeren zou de deur openzetten naar XSS (CLAUDE.md §11).
   */
  it('behandelt ingetypte HTML als gewone tekst', () => {
    render(<TextBlock text={'<strong>vet</strong> en <script>alert(1)</script>'} />);

    expect(screen.getByText(/<strong>vet<\/strong>/)).toBeDefined();
    expect(document.querySelector('script')).toBeNull();
  });
});
