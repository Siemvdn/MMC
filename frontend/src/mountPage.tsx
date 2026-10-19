import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import { ToastProvider } from './components/ui/ToastProvider';

import './styles/global.css';

/**
 * Hangt één pagina in de DOM.
 *
 * Elke pagina heeft een eigen HTML-bestand en dus een eigen instapscript. Die
 * scripts zijn hierdoor drie regels lang in plaats van drie keer hetzelfde
 * opstartwerk.
 */
export function mountPage(page: ReactNode): void {
  const container = document.getElementById('root');

  // Vroegtijdig falen met een begrijpelijke melding is beter dan een
  // non-null assertion die pas verderop een cryptische fout geeft.
  if (!container) {
    throw new Error('Root-element #root ontbreekt in het HTML-bestand.');
  }

  createRoot(container).render(
    <StrictMode>
      {/* Meldingen moeten overal kunnen verschijnen, dus dit staat om de hele
          pagina heen — ook om de publieke site, waar het contactformulier er
          in de volgende stap gebruik van gaat maken. */}
      <ToastProvider>{page}</ToastProvider>
    </StrictMode>,
  );
}
