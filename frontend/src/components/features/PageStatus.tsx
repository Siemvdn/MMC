import type { RequestState } from '../../hooks/useFetch';
import { Container } from '../ui/Container';
import { StatusMessage } from '../ui/StatusMessage';
import type { PageContent } from '../../types/content';

export interface PageStatusProps {
  /** Alles behalve `success` — die tak hoort de pagina zelf af te handelen. */
  state: Exclude<RequestState<PageContent>, { status: 'success' }>;
  onRetry: () => void;
}

/**
 * Toont de drie toestanden waarin er nog geen content is.
 *
 * CLAUDE.md §7: elke datafetch heeft drie zichtbare toestanden en er mag
 * nooit een lege pagina zonder feedback verschijnen. Door `success` hier via
 * het type uit te sluiten, kan dit component niet per ongeluk gebruikt worden
 * op een moment dat er wél content is.
 */
export function PageStatus({ state, onRetry }: PageStatusProps) {
  switch (state.status) {
    // `idle` duurt hier maar één render, maar hij bestaat en verdient dus een
    // weergave — anders knippert er een lege pagina voorbij.
    case 'idle':
    case 'loading':
      return (
        <Container>
          <StatusMessage heading="Even geduld" text="De inhoud wordt geladen." />
        </Container>
      );

    case 'error':
      return (
        <Container>
          <StatusMessage
            heading="Het laden is niet gelukt"
            text={state.error}
            onRetry={onRetry}
            urgency="assertive"
          />
        </Container>
      );
  }
}
