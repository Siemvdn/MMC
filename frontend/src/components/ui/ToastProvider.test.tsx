import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ToastProvider } from './ToastProvider';
import { useToast } from '../../hooks/useToast';

/**
 * Meldingen bestaan omdat een foutmelding bovenaan de pagina niet gezien wordt
 * als je onderin aan het werk bent. Wat hier misgaat, verdwijnt dus stil — en
 * dan denkt de gebruiker dat er is opgeslagen terwijl dat niet zo is.
 */
describe('ToastProvider', () => {
  function Knoppen() {
    const { showError, showSuccess } = useToast();

    return (
      <>
        <button
          type="button"
          onClick={() => {
            showError('Er klopt iets niet.', [
              'sectie 2: veld text is te lang',
              'sectie 3: kop ontbreekt',
            ]);
          }}
        >
          fout
        </button>
        <button
          type="button"
          onClick={() => {
            showSuccess('Opgeslagen.');
          }}
        >
          gelukt
        </button>
      </>
    );
  }

  function klik(naam: string): void {
    act(() => {
      screen.getByRole('button', { name: naam }).click();
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('toont een foutmelding met de losse punten erbij', () => {
    render(
      <ToastProvider>
        <Knoppen />
      </ToastProvider>,
    );

    klik('fout');

    expect(screen.getByText('Er klopt iets niet.')).toBeDefined();
    expect(screen.getByText('sectie 2: veld text is te lang')).toBeDefined();
    expect(screen.getByText('sectie 3: kop ontbreekt')).toBeDefined();
  });

  /** De kern: een fout mag niet vanzelf verdwijnen. */
  it('laat een foutmelding staan, ook na lange tijd', () => {
    render(
      <ToastProvider>
        <Knoppen />
      </ToastProvider>,
    );

    klik('fout');

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByText('Er klopt iets niet.')).toBeDefined();
  });

  it('laat een fout wegklikken', () => {
    render(
      <ToastProvider>
        <Knoppen />
      </ToastProvider>,
    );

    klik('fout');
    klik('Melding sluiten');

    expect(screen.queryByText('Er klopt iets niet.')).toBeNull();
  });

  /** Dat iets gelukt is, zie je verder aan de pagina; die mag vanzelf weg. */
  it('laat een gelukt-melding vanzelf verdwijnen', () => {
    render(
      <ToastProvider>
        <Knoppen />
      </ToastProvider>,
    );

    klik('gelukt');
    expect(screen.getByText('Opgeslagen.')).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.queryByText('Opgeslagen.')).toBeNull();
  });

  it('stapelt meerdere meldingen', () => {
    render(
      <ToastProvider>
        <Knoppen />
      </ToastProvider>,
    );

    klik('fout');
    klik('fout');

    expect(screen.getAllByText('Er klopt iets niet.')).toHaveLength(2);
  });

  /**
   * Zonder provider stil niets doen zou betekenen dat een foutmelding
   * spoorloos verdwijnt — precies wat dit systeem moet voorkomen.
   */
  it('klaagt als er geen provider omheen staat', () => {
    const stil = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<Knoppen />)).toThrow(/ToastProvider/);

    stil.mockRestore();
  });
});
