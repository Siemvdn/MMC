import { useEffect, useRef, useState } from 'react';

import { PublicPageBody } from '../components/features/PublicPageBody';
import { PageLayout } from '../layouts/PageLayout';
import type { PageSlug } from '../constants/routes';
import { post, readToPreview, readyMessage, selectMessage } from '../preview/previewMessages';
import type { ContentSection, SiteContent } from '../types/content';
import styles from './PreviewPage.module.css';

interface PreviewState {
  slug: PageSlug;
  sections: ContentSection[];
  site: SiteContent;
}

/**
 * De pagina die het beheerscherm in een frame toont.
 *
 * Haalt zelf **niets** op. Alles komt van het beheerscherm via postMessage,
 * en de controle daarop staat in `preview/previewMessages.ts`. Dat is geen
 * toeval maar het ontwerp: deze pagina is publiek bereikbaar, en zou hij zelf
 * content ophalen, dan zou iedereen die het adres kent de niet-gepubliceerde
 * teksten kunnen inzien. Nu is hij leeg voor wie hem rechtstreeks opent.
 *
 * Wat er wél gerenderd wordt is exact de echte pagina: dezelfde PageLayout en
 * dezelfde PublicPageBody als de site gebruikt.
 */
export function PreviewPage() {
  const [content, setContent] = useState<PreviewState | null>(null);
  const [highlight, setHighlight] = useState<number | null>(null);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent): void {
      const message = readToPreview(event);

      if (message === null) {
        return;
      }

      if (message.type === 'content') {
        setContent({ slug: message.slug, sections: message.sections, site: message.site });

        return;
      }

      setHighlight(message.index);
    }

    window.addEventListener('message', handleMessage);

    // Melden dat we klaarstaan; het beheerscherm stuurt daarna de inhoud.
    // Zonder dit signaal zou een bericht dat vóór het laden verstuurd is
    // verloren gaan, en bleef het voorbeeld leeg tot de volgende toetsaanslag.
    post(window.parent, readyMessage());

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  /*
   * De markering aanbrengen. Draait ook bij nieuwe inhoud, want React bouwt
   * de secties dan opnieuw op en de klasse die we hier handmatig toevoegen
   * gaat daarbij verloren.
   */
  useEffect(() => {
    const root = container.current;

    if (root === null) {
      return;
    }

    const marker = styles.highlight ?? '';

    for (const element of root.querySelectorAll('[data-section-index]')) {
      element.classList.remove(marker);
    }

    if (highlight !== null) {
      root.querySelector(`[data-section-index="${String(highlight)}"]`)?.classList.add(marker);
    }
  }, [highlight, content]);

  /*
   * Naar het aangewezen blok scrollen — alleen als er een ánder blok wordt
   * aangewezen, niet bij elke wijziging van de inhoud. Stond `content` hier
   * ook in de lijst, dan verschoof de pagina bij elke toetsaanslag.
   *
   * En bewust window.scrollTo in plaats van scrollIntoView: dat laatste
   * brengt een element in beeld in élke scrollende voorouder, en dat is bij
   * een frame ook de pagina eróm — dus dan schuift het beheerscherm mee.
   * window.scrollTo blijft binnen dit document.
   */
  useEffect(() => {
    if (highlight === null) {
      return;
    }

    const target = container.current?.querySelector(`[data-section-index="${String(highlight)}"]`);

    if (!(target instanceof HTMLElement)) {
      return;
    }

    const box = target.getBoundingClientRect();
    const middle = box.top + window.scrollY - (window.innerHeight - box.height) / 2;

    window.scrollTo({ top: Math.max(0, middle), behavior: 'smooth' });
  }, [highlight]);

  if (content === null) {
    return (
      <p className={styles.empty}>
        Dit is het voorbeeldvenster van het beheer. Het toont alleen iets als het vanuit het
        beheerscherm geopend wordt.
      </p>
    );
  }

  return (
    <div
      ref={container}
      className={styles.clickable}
      onClick={(event) => {
        const clicked = event.target as HTMLElement;

        /*
         * Links laten het frame niet weglopen.
         *
         * Zonder dit navigeert een klik op "Over ons" of op een knop in de kop
         * dit frame naar de echte pagina. Die pagina luistert niet naar het
         * beheerscherm, dus het voorbeeld werkt daarna niet meer bij en er is
         * geen weg terug zonder de editor opnieuw te laden — met verlies van
         * alles wat nog niet opgeslagen was.
         *
         * Middelklik valt hierbuiten: die geeft een auxclick en opent de
         * echte pagina in een nieuw tabblad. Dit frame blijft dan intact, dus
         * dat mag gewoon.
         */
        if (clicked.closest('a') !== null) {
          event.preventDefault();
        }

        const section = clicked.closest('[data-section-index]');
        const index = section?.getAttribute('data-section-index');

        if (index !== null && index !== undefined) {
          post(window.parent, selectMessage(Number(index)));
        }
      }}
    >
      <PageLayout currentSlug={content.slug} site={content.site}>
        <PublicPageBody slug={content.slug} sections={content.sections} annotate />
      </PageLayout>
    </div>
  );
}
