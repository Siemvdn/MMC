import type { AdminContent, AdminContentResponse } from '../types/adminContent';
import { requestJson } from './apiClient';

/**
 * De endpoints van het admin-gedeelte.
 *
 * Elk verzoek dat iets wijzigt stuurt het CSRF-token mee (CLAUDE.md §11). Dat
 * token komt uit `fetchSession` en verandert bij het inloggen, dus het antwoord
 * van `login` bevat de nieuwe.
 */

export interface AdminSession {
  loggedIn: boolean;
  username: string | null;
  csrfToken: string;
}

/**
 * Vraagt op of er iemand ingelogd is, en haalt meteen het CSRF-token op.
 *
 * Vereist zelf geen login: het antwoord "je bent niet ingelogd" is precies wat
 * het inlogscherm nodig heeft.
 */
export function fetchSession(signal: AbortSignal): Promise<AdminSession> {
  return requestJson<AdminSession>('/api/admin/session', { signal });
}

export function login(
  username: string,
  password: string,
  csrfToken: string,
): Promise<AdminSession> {
  return requestJson<AdminSession>('/api/admin/login', {
    method: 'POST',
    body: { username, password },
    csrfToken,
  });
}

export function logout(csrfToken: string): Promise<{ loggedIn: boolean }> {
  return requestJson<{ loggedIn: boolean }>('/api/admin/logout', {
    method: 'POST',
    csrfToken,
  });
}

/**
 * De content zoals hij in het bestand staat, inclusief de aantekeningen.
 *
 * De publieke API haalt die weg; hier komen ze mee, want de beheerder bewerkt
 * de bron en moet zien wat er nog openstaat.
 */
export function fetchContent(page: string, signal: AbortSignal): Promise<AdminContentResponse> {
  return requestJson<AdminContentResponse>(`/api/admin/content/${page}`, { signal });
}

export function saveContent(
  page: string,
  content: AdminContent,
  csrfToken: string,
): Promise<AdminContentResponse> {
  return requestJson<AdminContentResponse>(`/api/admin/content/${page}`, {
    method: 'POST',
    body: { content },
    csrfToken,
  });
}

export function restoreContent(page: string, csrfToken: string): Promise<AdminContentResponse> {
  return requestJson<AdminContentResponse>(`/api/admin/content/${page}/vorige-versie`, {
    method: 'POST',
    csrfToken,
  });
}

/**
 * Uploadt één afbeelding en geeft het pad terug waaronder hij bereikbaar is.
 *
 * Dat pad kan daarna rechtstreeks in een sectie; de server geeft het al in de
 * vorm die de content-validator accepteert.
 */
export function uploadImage(file: File, csrfToken: string): Promise<{ path: string }> {
  const body = new FormData();
  body.append(UPLOAD_FIELD, file);

  return requestJson<{ path: string }>('/api/admin/upload', {
    method: 'POST',
    body,
    csrfToken,
  });
}

/** Moet gelijk blijven aan UploadController::FIELD in de backend. */
const UPLOAD_FIELD = 'afbeelding';
