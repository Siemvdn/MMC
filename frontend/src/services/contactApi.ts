import { requestJson } from './apiClient';

/**
 * Het publieke contactformulier.
 *
 * Anders dan het admin-gedeelte zit hier geen sessie achter: het token komt
 * van een eigen endpoint en is met APP_SECRET ondertekend, zodat een bezoeker
 * die alleen dit formulier gebruikt geen cookie krijgt (CLAUDE.md §11, §15).
 */

/**
 * Alleen wat nodig is om te kunnen reageren (dataminimalisatie, §15). Komt er
 * een veld bij, dan ook in `ContactValidator.php` en de tests aan beide kanten.
 */
export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export function fetchContactToken(signal: AbortSignal): Promise<{ csrfToken: string }> {
  return requestJson<{ csrfToken: string }>('/api/contact/token', { signal });
}

export function submitContact(
  data: ContactFormData,
  csrfToken: string,
): Promise<{ sent: boolean }> {
  return requestJson<{ sent: boolean }>('/api/contact', {
    method: 'POST',
    body: data,
    csrfToken,
  });
}
