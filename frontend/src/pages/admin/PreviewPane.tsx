import { useCallback, useEffect, useRef, useState } from 'react';

import { PREVIEW_PATH } from '../../constants/preview';
import type { PageSlug } from '../../constants/routes';
import {
  contentMessage,
  highlightMessage,
  post,
  readFromPreview,
} from '../../preview/previewMessages';
import type { ContentSection, SiteContent } from '../../types/content';
import styles from './PreviewPane.module.css';

export interface PreviewPaneProps {
  slug: PageSlug;
  sections: ContentSection[];
  site: SiteContent;
  /** De sectie die in de editor bewerkt wordt, of null. */
  highlight: number | null;
  /** Aangeroepen als er in het voorbeeld op een blok geklikt wordt. */
  onSelect: (index: number) => void;
}

type Device = 'desktop' | 'mobile';

/**
 * Hoe lang er gewacht wordt na een toetsaanslag voordat het voorbeeld
 * bijgewerkt wordt. Kort genoeg om direct te voelen, lang genoeg om niet bij
 * elke letter een volledige pagina opnieuw op te bouwen.
 */
const UPDATE_DELAY_MS = 150;

export function PreviewPane({ slug, sections, site, highlight, onSelect }: PreviewPaneProps) {
  const [device, setDevice] = useState<Device>('desktop');
  const [ready, setReady] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  const send = useCallback(() => {
    post(frame.current?.contentWindow ?? null, contentMessage(slug, sections, site));
  }, [slug, sections, site]);

  // Luisteren naar het voorbeeld: of het klaarstaat, en waar er geklikt wordt.
  useEffect(() => {
    function handleMessage(event: MessageEvent): void {
      const message = readFromPreview(event);

      if (message === null) {
        return;
      }

      if (message.type === 'ready') {
        setReady(true);

        return;
      }

      onSelect(message.index);
    }

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onSelect]);

  /*
   * De inhoud versturen zodra het voorbeeld klaarstaat, en daarna bij elke
   * wijziging — met een korte vertraging, zodat typen niet elke letter een
   * nieuwe pagina oplevert.
   */
  useEffect(() => {
    if (!ready) {
      return;
    }

    const timer = setTimeout(send, UPDATE_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [ready, send]);

  useEffect(() => {
    if (ready) {
      post(frame.current?.contentWindow ?? null, highlightMessage(highlight));
    }
  }, [ready, highlight]);

  return (
    <div className={styles.pane}>
      <div className={styles.toolbar}>
        <span className={styles.label}>Voorbeeld</span>

        {(['desktop', 'mobile'] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={`${styles.deviceButton} ${
              device === option ? styles.deviceButtonActive : ''
            }`}
            aria-pressed={device === option}
            onClick={() => {
              setDevice(option);
            }}
          >
            {option === 'desktop' ? 'Desktop' : 'Mobiel'}
          </button>
        ))}
      </div>

      <div className={styles.viewport}>
        <iframe
          ref={frame}
          title="Voorbeeld van de pagina"
          src={PREVIEW_PATH}
          className={`${styles.frame} ${device === 'mobile' ? styles.frameMobile : ''}`}
          // Het voorbeeld draait op dezelfde herkomst en moet scripts kunnen
          // uitvoeren; formulieren erin versturen hoeft niet en mag dus niet.
          sandbox="allow-scripts allow-same-origin"
          onLoad={send}
        />
      </div>

      <p className={styles.note}>
        Dit toont uw wijzigingen zoals ze worden, inclusief wat u nog niet hebt opgeslagen. Op de
        site staat de laatst opgeslagen versie. Links en knoppen gaan hier nergens heen; klik op een
        blok om bij het bijbehorende veld uit te komen.
      </p>
    </div>
  );
}
