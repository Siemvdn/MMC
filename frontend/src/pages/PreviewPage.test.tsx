import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PreviewPage } from './PreviewPage';
import { contentMessage, highlightMessage } from '../preview/previewMessages';
import type { ContentSection, SiteContent } from '../types/content';

/**
 * De voorbeeldpagina moet meebewegen met wat de beheerder typt, zonder dat de
 * pagina daarbij gaat schuiven. Dat ging eerst mis: het scroll-effect draaide
 * ook op elke inhoudswijziging, dus bij iedere toetsaanslag verschoof het
 * beeld.
 */
describe('PreviewPage', () => {
  const site: SiteContent = {
    businessName: 'Test',
    contact: { phone: '', email: '', area: '' },
    sameAs: [],
  };

  function sections(heading: string): ContentSection[] {
    return [
      {
        type: 'prose',
        background: 'light',
        heading,
        text: 'Tekst.',
        image: null,
        imageAlt: '',
        imagePosition: 'right',
      },
      {
        type: 'prose',
        background: 'light',
        heading: 'Tweede',
        text: 'Meer tekst.',
        image: null,
        imageAlt: '',
        imagePosition: 'right',
      },
    ];
  }

  /** De vervanger voor window.scrollTo, zodat we kunnen tellen. */
  let scrollTo: ReturnType<typeof vi.fn>;

  function send(message: unknown): void {
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', { data: message, origin: window.location.origin }),
      );
    });
  }

  beforeEach(() => {
    // jsdom kent scrollTo niet; we willen hier alleen weten óf hij aangeroepen
    // wordt, niet wat hij doet.
    scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('toont niets tot het beheerscherm inhoud stuurt', () => {
    const { container } = render(<PreviewPage />);

    expect(container.textContent).toContain('voorbeeldvenster van het beheer');
  });

  it('rendert de inhoud die binnenkomt', () => {
    const { container } = render(<PreviewPage />);

    send(contentMessage('home', sections('Eerste kop'), site));

    expect(container.textContent).toContain('Eerste kop');
  });

  it('werkt de inhoud bij bij een volgend bericht', () => {
    const { container } = render(<PreviewPage />);

    send(contentMessage('home', sections('Eerste kop'), site));
    send(contentMessage('home', sections('Gewijzigde kop'), site));

    expect(container.textContent).toContain('Gewijzigde kop');
    expect(container.textContent).not.toContain('Eerste kop');
  });

  /** De fout die hersteld is: typen mag de pagina niet laten verschuiven. */
  it('scrollt niet bij een inhoudswijziging', () => {
    render(<PreviewPage />);

    send(contentMessage('home', sections('Kop'), site));
    send(highlightMessage(1));

    const naMarkering = scrollTo.mock.calls.length;

    // Vijf toetsaanslagen nabootsen: telkens nieuwe inhoud, zelfde markering.
    for (let i = 0; i < 5; i++) {
      send(contentMessage('home', sections(`Kop ${String(i)}`), site));
    }

    expect(scrollTo.mock.calls).toHaveLength(naMarkering);
  });

  it('scrollt wél als er een ander blok aangewezen wordt', () => {
    render(<PreviewPage />);

    send(contentMessage('home', sections('Kop'), site));

    const voor = scrollTo.mock.calls.length;

    send(highlightMessage(1));

    expect(scrollTo.mock.calls.length).toBeGreaterThan(voor);
  });

  /**
   * De fout die hersteld is: een klik op een link navigeerde dit frame naar de
   * echte pagina. Die luistert niet naar het beheerscherm, dus daarna werkte
   * het voorbeeld niet meer bij en was er geen weg terug zonder de editor
   * opnieuw te laden — met verlies van alles wat nog niet opgeslagen was.
   */
  it('laat een link het frame niet wegnavigeren', () => {
    const { container } = render(<PreviewPage />);

    send(contentMessage('home', sections('Kop'), site));

    const link = container.querySelector('a');

    expect(link).not.toBeNull();

    const klik = new MouseEvent('click', { bubbles: true, cancelable: true });

    act(() => {
      link?.dispatchEvent(klik);
    });

    expect(klik.defaultPrevented).toBe(true);
  });

  /** Een knop in een sectie blijft wél naar het bijbehorende veld wijzen. */
  it('meldt de sectie waarin geklikt is, ook als dat een link was', () => {
    const postMessage = vi.fn();

    vi.spyOn(window, 'parent', 'get').mockReturnValue({
      postMessage,
    } as unknown as Window);

    const { container } = render(<PreviewPage />);

    send(
      contentMessage(
        'home',
        [
          {
            type: 'cta',
            background: 'light',
            heading: 'Een afsluitende kop',
            text: '',
            buttonLabel: 'Neem contact op',
          },
        ],
        site,
      ),
    );

    postMessage.mockClear();

    // Bewust de link binnen de sectie, niet de eerste op de pagina: dat is de
    // merknaam in de kop, en die hoort bij geen enkel veld.
    act(() => {
      container
        .querySelector('[data-section-index="0"] a')
        ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'select', index: 0 }),
      window.location.origin,
    );
  });

  it('houdt de markering staan als de inhoud verandert', () => {
    const { container } = render(<PreviewPage />);

    send(contentMessage('home', sections('Kop'), site));
    send(highlightMessage(1));

    const gemarkeerd = () =>
      [...container.querySelectorAll('[data-section-index]')].filter((element) =>
        element.className.includes('highlight'),
      ).length;

    expect(gemarkeerd()).toBe(1);

    send(contentMessage('home', sections('Kop na typen'), site));

    expect(gemarkeerd()).toBe(1);
  });
});
