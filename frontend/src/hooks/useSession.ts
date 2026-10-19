import { useCallback, useState } from 'react';

import { fetchSession, type AdminSession } from '../services/adminApi';
import { useFetch, type UseFetchResult } from './useFetch';

export interface UseSessionResult extends UseFetchResult<AdminSession> {
  /**
   * Overschrijft de bekende sessie zonder opnieuw op te halen.
   *
   * Na een geslaagde login geeft de server de nieuwe sessie meteen terug,
   * inclusief het gewisselde CSRF-token. Nog een verzoek doen om hetzelfde te
   * horen zou alleen vertraging toevoegen.
   */
  readonly replace: (session: AdminSession) => void;
}

/**
 * Houdt bij of er iemand ingelogd is, en welk CSRF-token er geldt.
 */
export function useSession(): UseSessionResult {
  const load = useCallback((signal: AbortSignal) => fetchSession(signal), []);
  const fetched = useFetch(load);
  const [override, setOverride] = useState<AdminSession | null>(null);

  const replace = useCallback((session: AdminSession) => {
    setOverride(session);
  }, []);

  const retry = useCallback(() => {
    setOverride(null);
    fetched.retry();
  }, [fetched]);

  if (override !== null) {
    return { state: { status: 'success', data: override }, retry, replace };
  }

  return { state: fetched.state, retry, replace };
}
