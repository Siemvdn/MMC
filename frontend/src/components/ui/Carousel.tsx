import { useCallback, useEffect, useRef, useState } from 'react';

import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import figureStyles from './Figure.module.css';
import styles from './Carousel.module.css';

export interface CarouselImage {
  src: string;
  alt: string;
}

export interface CarouselProps {
  images: CarouselImage[];
  /** Hoe lang één foto in beeld blijft vóór de volgende komt. */
  intervalMs?: number;
}

const DEFAULT_INTERVAL_MS = 10_000;

/** Hoe lang de weg- en inschuifanimatie duurt; moet gelijk lopen met de CSS. */
const TRANSITION_MS = 450;

/**
 * Zo lang blijft het automatisch doorschuiven uit nadat de bezoeker zelf een
 * andere foto koos. Klikt hij binnen die tijd nog een keer, dan begint de
 * wachttijd gewoon opnieuw.
 */
const MANUAL_PAUSE_MS = 30_000;

type Direction = 1 | -1;

interface OutgoingSlide {
  image: CarouselImage;
  direction: Direction;
}

/**
 * Een reeks foto's die vanzelf doorschuift, en ook met de hand te bedienen is.
 *
 * Bij nul foto's rendert dit niets, bij precies één gewoon die ene foto —
 * pas bij twee of meer verschijnen de bedieningselementen en de wisseling.
 *
 * CLAUDE.md §14: automatisch bewegende content moet te pauzeren zijn. Er is
 * geen aparte pauzeknop — zodra de bezoeker zelf klikt, staat het wisselen
 * dertig seconden stil, en pas als hij dertig seconden niets doet gaat het
 * vanzelf weer verder. Bezoekers met `prefers-reduced-motion` krijgen sowieso
 * geen automatische wisseling; de knoppen blijven voor hen gewoon werken.
 */
export function Carousel({ images, intervalMs = DEFAULT_INTERVAL_MS }: CarouselProps) {
  const [index, setIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<OutgoingSlide | null>(null);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const outgoingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const manualPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const autoplayDisabled = images.length <= 1 || isManuallyPaused || prefersReducedMotion;

  // Verandert het aantal foto's tijdens het bewerken (het live voorbeeld in
  // het beheer) dan mag de huidige plek niet buiten de nieuwe lijst vallen.
  useEffect(() => {
    setIndex((current) => Math.min(current, Math.max(images.length - 1, 0)));
  }, [images.length]);

  useEffect(
    () => () => {
      if (outgoingTimeoutRef.current !== null) {
        clearTimeout(outgoingTimeoutRef.current);
      }

      if (manualPauseTimeoutRef.current !== null) {
        clearTimeout(manualPauseTimeoutRef.current);
      }
    },
    [],
  );

  const transitionTo = useCallback(
    (nextIndex: number, direction: Direction) => {
      setIndex((current) => {
        const leaving = images[current];

        if (leaving !== undefined) {
          setOutgoing({ image: leaving, direction });

          if (outgoingTimeoutRef.current !== null) {
            clearTimeout(outgoingTimeoutRef.current);
          }

          outgoingTimeoutRef.current = setTimeout(() => {
            setOutgoing(null);
          }, TRANSITION_MS);
        }

        return ((nextIndex % images.length) + images.length) % images.length;
      });
    },
    [images],
  );

  useEffect(() => {
    if (autoplayDisabled) {
      return;
    }

    const timer = setTimeout(() => {
      transitionTo(index + 1, 1);
    }, intervalMs);

    return () => {
      clearTimeout(timer);
    };
  }, [index, autoplayDisabled, intervalMs, transitionTo]);

  function registerManualInteraction(): void {
    setIsManuallyPaused(true);

    if (manualPauseTimeoutRef.current !== null) {
      clearTimeout(manualPauseTimeoutRef.current);
    }

    manualPauseTimeoutRef.current = setTimeout(() => {
      setIsManuallyPaused(false);
    }, MANUAL_PAUSE_MS);
  }

  if (images.length === 0) {
    return null;
  }

  const only = images[0];

  if (images.length === 1 && only !== undefined) {
    return (
      <figure className={figureStyles.figure}>
        <img
          className={figureStyles.image}
          src={only.src}
          alt={only.alt}
          loading="lazy"
          decoding="async"
        />
      </figure>
    );
  }

  const current = images[index];

  if (current === undefined) {
    return null;
  }

  function handleManualNavigate(nextIndex: number, direction: Direction): void {
    transitionTo(nextIndex, direction);
    registerManualInteraction();
  }

  return (
    <div className={styles.carousel}>
      <div className={styles.stage}>
        {outgoing !== null && (
          <img
            // Een eigen key per foto: zo herstart de CSS-animatie altijd
            // opnieuw, ook als twee keer achter elkaar dezelfde richting
            // (en dus dezelfde klassenaam) van toepassing is.
            key={`outgoing-${outgoing.image.src}`}
            className={`${styles.slide} ${
              outgoing.direction === 1 ? styles.slideOutLeft : styles.slideOutRight
            }`}
            src={outgoing.image.src}
            // Decoratief en tijdelijk: de inkomende foto draagt de echte alt-tekst.
            alt=""
            aria-hidden="true"
          />
        )}

        <img
          key={current.src}
          className={`${styles.slide} ${
            outgoing === null
              ? ''
              : outgoing.direction === 1
                ? styles.slideInFromRight
                : styles.slideInFromLeft
          }`}
          src={current.src}
          alt={current.alt}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => {
            handleManualNavigate(index - 1, -1);
          }}
          aria-label="Vorige foto"
        >
          ‹
        </button>

        <span className={styles.dots} role="group" aria-label="Ga naar foto">
          {images.map((image, dotIndex) => (
            <button
              key={image.src}
              type="button"
              className={`${styles.dot} ${dotIndex === index ? styles.dotActive : ''}`}
              aria-label={`Foto ${String(dotIndex + 1)} van ${String(images.length)}`}
              aria-current={dotIndex === index}
              onClick={() => {
                if (dotIndex !== index) {
                  handleManualNavigate(dotIndex, dotIndex > index ? 1 : -1);
                }
              }}
            />
          ))}
        </span>

        <button
          type="button"
          className={styles.arrow}
          onClick={() => {
            handleManualNavigate(index + 1, 1);
          }}
          aria-label="Volgende foto"
        >
          ›
        </button>
      </div>
    </div>
  );
}
