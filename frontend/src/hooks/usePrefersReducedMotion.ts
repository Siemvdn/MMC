import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Of de bezoeker liever geen automatische beweging ziet.
 *
 * `global.css` zet deze voorkeur al door voor CSS-animaties, maar een
 * JavaScript-timer — zoals de automatische foto-carrousel — luistert daar
 * niet naar en heeft dus deze eigen controle nodig (CLAUDE.md §14).
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(QUERY);

    function update(event: MediaQueryListEvent): void {
      setPrefersReduced(event.matches);
    }

    query.addEventListener('change', update);

    // De voorkeur kan gewijzigd zijn tussen het eerste renderen en dit moment.
    setPrefersReduced(query.matches);

    return () => {
      query.removeEventListener('change', update);
    };
  }, []);

  return prefersReduced;
}
