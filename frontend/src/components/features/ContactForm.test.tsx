import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ContactForm } from './ContactForm';

/**
 * CLAUDE.md §16 wijst formuliervalidatie aan als de plek waar een test het
 * meeste oplevert: het is de enige logica in de frontend waar een fout een
 * bezoeker daadwerkelijk tegenhoudt.
 *
 * De tests zoeken velden op via hun label. Dat is niet alleen prettig
 * leesbaar — het is meteen een controle dat elk veld een gekoppeld label
 * heeft, wat §14 verplicht stelt. Raakt die koppeling ooit stuk, dan valt
 * deze test om.
 *
 * `fetch` wordt gestubt: het formulier haalt bij het laden zelf al een
 * CSRF-token op (`GET /api/contact/token`), dus zelfs de validatietests
 * hebben een werkende `fetch` nodig om zonder waarschuwingen te draaien.
 */
describe('ContactForm', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let contactResponse: Response | (() => Response);

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  beforeEach(() => {
    contactResponse = jsonResponse({ success: true, data: { sent: true } });

    // Deze applicatie roept fetch(path, options) altijd aan met een gewoon
    // pad-string (zie apiClient.ts) — de mock hoeft dus geen Request/URL te
    // ontleden.
    fetchMock = vi.fn((url: string): Response => {
      if (url.includes('/api/contact/token')) {
        return jsonResponse({ success: true, data: { csrfToken: 'test-token' } });
      }

      return typeof contactResponse === 'function' ? contactResponse() : contactResponse;
    });

    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function submit(): void {
    fireEvent.click(screen.getByRole('button', { name: /versturen/i }));
  }

  function fill(label: string, value: string): void {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }

  function fillValidForm(): void {
    fill('Naam', 'Jan Jansen');
    fill('E-mailadres', 'jan@example.com');
    fill('Bericht', 'Een testbericht via het contactformulier.');
  }

  async function renderAndWaitForToken(): Promise<void> {
    render(<ContactForm />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/contact/token', expect.anything());
    });
  }

  it('wijst een leeg formulier af en benoemt elk ontbrekend veld', async () => {
    await renderAndWaitForToken();

    submit();

    expect(screen.getByText('Vul uw naam in.')).toBeDefined();
    expect(screen.getByText('Vul uw e-mailadres in.')).toBeDefined();
    expect(screen.getByText('Vul uw bericht in.')).toBeDefined();
  });

  it('herkent een e-mailadres zonder apenstaartje als ongeldig', async () => {
    await renderAndWaitForToken();

    fill('Naam', 'Jan Jansen');
    fill('E-mailadres', 'jan.jansen.nl');
    fill('Bericht', 'Een testbericht via het contactformulier.');

    submit();

    expect(screen.getByText('Dit lijkt geen geldig e-mailadres.')).toBeDefined();
  });

  it('verstuurt een volledig ingevuld formulier naar de server', async () => {
    await renderAndWaitForToken();

    fillValidForm();
    submit();

    expect(await screen.findByText(/bedankt voor uw aanvraag/i)).toBeDefined();

    const contactCall = fetchMock.mock.calls.find((call: unknown[]) => call[0] === '/api/contact');
    const options = contactCall?.[1] as RequestInit | undefined;
    const headers = options?.headers as Record<string, string> | undefined;

    expect(options?.method).toBe('POST');
    expect(headers?.['X-CSRF-Token']).toBe('test-token');
  });

  it('stuurt alleen naam, e-mailadres en bericht mee (dataminimalisatie, §15)', async () => {
    await renderAndWaitForToken();

    fillValidForm();
    submit();

    await screen.findByText(/bedankt voor uw aanvraag/i);

    const contactCall = fetchMock.mock.calls.find((call: unknown[]) => call[0] === '/api/contact');
    const options = contactCall?.[1] as RequestInit | undefined;
    const body = JSON.parse(options?.body as string) as Record<string, string>;

    expect(body).toEqual({
      name: 'Jan Jansen',
      email: 'jan@example.com',
      message: 'Een testbericht via het contactformulier.',
    });
  });

  it('toont de foutmelding van de server als het versturen mislukt', async () => {
    contactResponse = () =>
      jsonResponse(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Te veel aanvragen. Probeer het over een kwartier opnieuw.',
          },
        },
        429,
      );

    await renderAndWaitForToken();

    fillValidForm();
    submit();

    expect(
      await screen.findByText('Te veel aanvragen. Probeer het over een kwartier opnieuw.'),
    ).toBeDefined();
  });

  it('haalt een foutmelding weg zodra het veld alsnog klopt', async () => {
    await renderAndWaitForToken();

    submit();
    expect(screen.getByText('Vul uw naam in.')).toBeDefined();

    fillValidForm();
    submit();

    expect(screen.queryByText('Vul uw naam in.')).toBeNull();
  });
});
