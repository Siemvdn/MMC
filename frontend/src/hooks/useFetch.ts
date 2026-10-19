import { useCallback, useEffect, useState } from 'react';

/**
 * De vier toestanden waarin een verzoek kan verkeren (CLAUDE.md §7).
 *
 * Als discriminated union, zodat TypeScript afdwingt dat je `data` pas
 * aanraakt in de `success`-tak en `error` pas in de `error`-tak. Een pagina
 * die vergeet een van de toestanden af te handelen, komt er niet langs de
 * typecontrole.
 */
export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string };

/** Een functie die de gegevens ophaalt en luistert naar een afbreeksignaal. */
export type Loader<T> = (signal: AbortSignal) => Promise<T>;

export interface UseFetchResult<T> {
  readonly state: RequestState<T>;
  /** Probeert het opnieuw na een fout. */
  readonly retry: () => void;
}

const UNKNOWN_ERROR = 'Er ging iets mis bij het laden.';

/**
 * Voert `load` uit en houdt de toestand bij.
 *
 * **Belangrijk:** `load` hoort stabiel te zijn tussen renders, meestal via
 * `useCallback`. Geef je er elke render een nieuwe functie in, dan draait het
 * verzoek eindeloos opnieuw. De hook kan dat niet voor je oplossen zonder de
 * mogelijkheid weg te nemen om op gewijzigde invoer opnieuw te laden.
 */
export function useFetch<T>(load: Loader<T>): UseFetchResult<T> {
  const [state, setState] = useState<RequestState<T>>({ status: 'idle' });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setAttempt((previous) => previous + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setState({ status: 'loading' });

    load(controller.signal)
      .then((data) => {
        // Zonder deze controle zou een antwoord dat ná het opruimen
        // binnenkomt alsnog de toestand aanpassen.
        if (active) {
          setState({ status: 'success', data });
        }
      })
      .catch((cause: unknown) => {
        // Een afgebroken verzoek is geen fout maar het gevolg van opruimen;
        // daar hoort de bezoeker geen melding van te zien.
        if (!active || controller.signal.aborted) {
          return;
        }

        setState({
          status: 'error',
          error: cause instanceof Error ? cause.message : UNKNOWN_ERROR,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [load, attempt]);

  return { state, retry };
}
