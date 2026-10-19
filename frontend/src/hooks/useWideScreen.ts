import { useEffect, useState } from 'react';

/**
 * Of het scherm breed genoeg is om twee kolommen naast elkaar te tonen.
 *
 * Dit kan niet met een mediaquery in CSS: onder de grens tonen we niet
 * hetzelfde in een andere opmaak, maar iets anders — tabbladen in plaats van
 * twee panelen. Dat is een keuze in de component, niet in de stijl.
 */
export function useWideScreen(minimumWidth = 1100): boolean {
  const [isWide, setIsWide] = useState(
    () => window.matchMedia(`(min-width: ${String(minimumWidth)}px)`).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${String(minimumWidth)}px)`);

    function update(event: MediaQueryListEvent): void {
      setIsWide(event.matches);
    }

    query.addEventListener('change', update);

    // De breedte kan gewijzigd zijn tussen het eerste renderen en dit moment.
    setIsWide(query.matches);

    return () => {
      query.removeEventListener('change', update);
    };
  }, [minimumWidth]);

  return isWide;
}
