/**
 * De enige plek die met de API praat.
 *
 * Het antwoordformaat is dat uit CLAUDE.md §9. De backend stuurt bij een fout
 * een leesbare `message` mee die bedoeld is voor de bezoeker; die geven we
 * door in plaats van er zelf een tekst omheen te verzinnen.
 *
 * Paden zijn relatief. Lokaal stuurt de Vite-dev-server `/api` door naar de
 * PHP-server; in productie staan beide op dezelfde host. Zo staat er nergens
 * een omgevingsafhankelijke basis-URL in de code.
 */

/** Het vaste antwoordformaat van de API (CLAUDE.md §9). */
type ApiEnvelope<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        /**
         * Optionele, machineleesbare toelichting. Bij een validatiefout staat
         * hier de volledige lijst met wat er mis is, zodat de beheerder alles
         * in één keer ziet in plaats van één fout per opslagpoging.
         */
        details?: Record<string, unknown>;
      };
    };

const FALLBACK_MESSAGE = 'Er ging iets mis. Probeer het opnieuw.';

/**
 * Een fout die de API teruggaf, met de code erbij.
 *
 * De code is wat de aanroeper nodig heeft om te beslissen wát er moet
 * gebeuren: bij `UNAUTHORIZED` opnieuw inloggen, bij `RATE_LIMITED` even
 * wachten. De tekst is voor de gebruiker.
 */
export class ApiError extends Error {
  public constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST';
  signal?: AbortSignal;
  /**
   * Wordt als JSON verstuurd, tenzij het FormData is — dan gaat het
   * ongewijzigd mee en bepaalt de browser zelf het Content-Type. Dat moet
   * ook: bij een multipart-verzoek hoort een scheidingsteken in die header
   * dat wij hier niet kennen.
   */
  body?: unknown;
  /** Het CSRF-token, voor elk verzoek dat iets wijzigt (§11). */
  csrfToken?: string;
}

export async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', signal, body, csrfToken } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (csrfToken !== undefined) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const response = await fetch(path, {
    method,
    headers,
    signal,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    // Het sessiecookie moet mee. Bij hetzelfde domein is dit al de standaard,
    // maar expliciet is het niet afhankelijk van de browserversie.
    credentials: 'same-origin',
  });

  const envelope = await readEnvelope<T>(response);

  if (!envelope.success) {
    throw new ApiError(
      envelope.error.message || FALLBACK_MESSAGE,
      envelope.error.code,
      response.status,
      envelope.error.details,
    );
  }

  return envelope.data;
}

/**
 * Leest het antwoord uit, ook als de server iets anders dan JSON terugstuurt.
 *
 * Dat laatste is geen theoretisch geval: valt PHP om vóór de front controller,
 * dan komt er een HTML-foutpagina terug. Zonder deze afhandeling zou de
 * bezoeker een onbegrijpelijke parsefout te zien krijgen in plaats van een
 * nette melding.
 */
async function readEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  let envelope: unknown;

  try {
    envelope = await response.json();
  } catch {
    throw new ApiError(FALLBACK_MESSAGE, 'ONLEESBAAR_ANTWOORD', response.status);
  }

  if (!isEnvelope<T>(envelope)) {
    throw new ApiError(FALLBACK_MESSAGE, 'ONVERWACHT_ANTWOORD', response.status);
  }

  return envelope;
}

/**
 * Controleert of het antwoord de vorm heeft die we verwachten.
 *
 * Er is bewust geen volledige schemavalidatie: de backend valideert de content
 * al vóór opslag, en die dubbel overdoen levert twee plekken op die uit de pas
 * kunnen lopen. Deze controle dekt alleen af dat we niet blind in een
 * onbekende structuur gaan graven.
 */
function isEnvelope<T>(value: unknown): value is ApiEnvelope<T> {
  if (typeof value !== 'object' || value === null || !('success' in value)) {
    return false;
  }

  const { success } = value;

  if (success === true) {
    return 'data' in value;
  }

  if (success !== false || !('error' in value)) {
    return false;
  }

  const { error } = value;

  return typeof error === 'object' && error !== null && 'message' in error && 'code' in error;
}
