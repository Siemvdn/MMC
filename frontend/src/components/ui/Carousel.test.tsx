import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Carousel } from './Carousel';

/**
 * De carrousel bij het citaatblok: automatisch doorschuiven na tien
 * seconden, met de hand te bedienen. Er is geen aparte pauzeknop — een
 * handmatige klik pauzeert dertig seconden, en zonder nieuwe klik binnen die
 * tijd gaat het vanzelf weer verder (CLAUDE.md §14: automatisch bewegende
 * content moet stopbaar zijn).
 */
describe('Carousel', () => {
  const images = [
    { src: '/uploads/een.jpg', alt: 'Een' },
    { src: '/uploads/twee.jpg', alt: 'Twee' },
    { src: '/uploads/drie.jpg', alt: 'Drie' },
  ];

  function stubReducedMotion(matches: boolean): void {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  }

  beforeEach(() => {
    stubReducedMotion(false);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("rendert niets zonder foto's", () => {
    const { container } = render(<Carousel images={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('toont bij één foto gewoon die ene foto, zonder bediening', () => {
    render(<Carousel images={[{ src: '/uploads/een.jpg', alt: 'Een' }]} />);

    expect(screen.getByRole('img', { name: 'Een' })).toBeDefined();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('toont bij meerdere fotos de eerste, met bediening', () => {
    render(<Carousel images={images} />);

    expect(screen.getByRole('img', { name: 'Een' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Volgende foto' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Vorige foto' })).toBeDefined();
  });

  it('gaat met "Volgende foto" naar de tweede foto, en wikkelt om na de laatste', () => {
    render(<Carousel images={images} />);

    fireEvent.click(screen.getByRole('button', { name: 'Volgende foto' }));
    expect(screen.getByRole('img', { name: 'Twee' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Volgende foto' }));
    expect(screen.getByRole('img', { name: 'Drie' })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Volgende foto' }));
    expect(screen.getByRole('img', { name: 'Een' })).toBeDefined();
  });

  it('gaat met "Vorige foto" terug, en wikkelt om vóór de eerste', () => {
    render(<Carousel images={images} />);

    fireEvent.click(screen.getByRole('button', { name: 'Vorige foto' }));
    expect(screen.getByRole('img', { name: 'Drie' })).toBeDefined();
  });

  it('springt met een bolletje direct naar die foto', () => {
    render(<Carousel images={images} />);

    fireEvent.click(screen.getByRole('button', { name: 'Foto 3 van 3' }));
    expect(screen.getByRole('img', { name: 'Drie' })).toBeDefined();
  });

  it('schuift na het ingestelde interval vanzelf door', () => {
    vi.useFakeTimers();
    render(<Carousel images={images} intervalMs={10_000} />);

    expect(screen.getByRole('img', { name: 'Een' })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('img', { name: 'Twee' })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('img', { name: 'Drie' })).toBeDefined();
  });

  it('pauzeert dertig seconden na een handmatige klik, en gaat daarna vanzelf weer verder', () => {
    vi.useFakeTimers();
    render(<Carousel images={images} intervalMs={10_000} />);

    fireEvent.click(screen.getByRole('button', { name: 'Volgende foto' }));
    expect(screen.getByRole('img', { name: 'Twee' })).toBeDefined();

    // Nog geen dertig seconden voorbij sinds de klik: geen automatische wisseling.
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(screen.getByRole('img', { name: 'Twee' })).toBeDefined();

    // Op het moment dat de dertig seconden om zijn, hervat het automatisch
    // doorschuiven — dat begint dan gewoon opnieuw te tellen vanaf hier, dus
    // pas een heel interval later verschijnt de volgende foto.
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('img', { name: 'Twee' })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('img', { name: 'Drie' })).toBeDefined();
  });

  it('begint de dertig seconden opnieuw bij een tweede klik', () => {
    vi.useFakeTimers();
    render(<Carousel images={images} intervalMs={10_000} />);

    fireEvent.click(screen.getByRole('button', { name: 'Volgende foto' }));
    expect(screen.getByRole('img', { name: 'Twee' })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(25_000);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Volgende foto' }));
    expect(screen.getByRole('img', { name: 'Drie' })).toBeDefined();

    // Vijfentwintig seconden na de tweede klik: nog steeds gepauzeerd, ook al
    // is er inmiddels in totaal meer dan dertig seconden verstreken sinds de
    // eerste klik.
    act(() => {
      vi.advanceTimersByTime(25_000);
    });
    expect(screen.getByRole('img', { name: 'Drie' })).toBeDefined();

    // Dertig seconden na de tweede klik hervat het, en weer een vol interval
    // later verschijnt de volgende foto.
    act(() => {
      vi.advanceTimersByTime(5_000);
    });
    expect(screen.getByRole('img', { name: 'Drie' })).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(screen.getByRole('img', { name: 'Een' })).toBeDefined();
  });

  it('schuift niet automatisch door als de bezoeker liever geen beweging ziet, maar de knoppen blijven werken', () => {
    stubReducedMotion(true);
    vi.useFakeTimers();
    render(<Carousel images={images} intervalMs={10_000} />);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByRole('img', { name: 'Een' })).toBeDefined();

    // De knoppen om zelf door te klikken blijven wel werken.
    fireEvent.click(screen.getByRole('button', { name: 'Volgende foto' }));
    expect(screen.getByRole('img', { name: 'Twee' })).toBeDefined();
  });
});
