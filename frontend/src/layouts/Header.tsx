import { useEffect, useId, useRef, useState } from 'react';

import { HEADER_ACTION, ROUTES, pathForSlug, type PageSlug } from '../constants/routes';
import { ButtonLink } from '../components/ui/ButtonLink';
import { Placeholder } from '../components/ui/Placeholder';
import styles from './Header.module.css';

export interface HeaderProps {
  businessName: string;
  /** De pagina waar de bezoeker nu is, voor `aria-current`. Ontbreekt op de 404-pagina. */
  currentSlug?: PageSlug;
}

/**
 * Op een breed scherm staan navigatie en de knop gewoon naast het merk. Onder
 * de mobiele breedte gaan ze achter een hamburgermenu schuil — anders knijpen
 * drie paginalinks en een knop op de breedte van een telefoon zich stuk
 * (CLAUDE.md §12, mobile-first).
 */
export function Header({ businessName, currentSlug }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuId = useId();
  const headerRef = useRef<HTMLElement>(null);

  // Sluiten met Escape, en bij een klik buiten het menu — de twee manieren
  // waarop een bezoeker een geopend menu verwacht te kunnen wegklikken.
  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    function handlePointerDown(event: PointerEvent): void {
      if (headerRef.current !== null && !headerRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isMenuOpen]);

  return (
    <header className={styles.header} ref={headerRef}>
      <div className={styles.inner}>
        <a href="/" className={styles.brand}>
          {businessName === '' ? <Placeholder label="bedrijfsnaam" /> : businessName}
        </a>

        <button
          type="button"
          className={styles.menuToggle}
          aria-expanded={isMenuOpen}
          aria-controls={menuId}
          onClick={() => {
            setIsMenuOpen((open) => !open);
          }}
        >
          {/* Drie streepjes, puur decoratief: de knoptekst zegt al genoeg. */}
          <span className={styles.menuIcon} aria-hidden="true" />
          {isMenuOpen ? 'Sluiten' : 'Menu'}
        </button>

        <div id={menuId} className={`${styles.menu} ${isMenuOpen ? styles.menuOpen : ''}`}>
          {/*
            Een echte <nav> met een lijst erin. Schermlezers kondigen dan aan
            hoeveel links er zijn en dat het om navigatie gaat; een reeks
            losse <a>-tags doet dat niet (CLAUDE.md §7, §14).
          */}
          <nav className={styles.navigation} aria-label="Hoofdnavigatie">
            {ROUTES.filter((route) => route.showInNav !== false).map((route) => (
              <a
                key={route.slug}
                href={route.path}
                className={styles.link}
                // Alleen op de huidige pagina. Schermlezers melden dit, en de
                // stijlregel in de CSS haakt op hetzelfde attribuut aan.
                aria-current={route.slug === currentSlug ? 'page' : undefined}
              >
                {route.label}
              </a>
            ))}
          </nav>

          {/*
            De knop staat buiten de <nav>: het is een oproep tot actie, geen
            navigatielink. Hij is ook de enige weg naar de contactpagina in de
            kop — een aparte Contact-link ernaast deed precies hetzelfde en is
            daarom weggehaald. Op mobiel staat hij binnen hetzelfde uitklapbare
            menu als de navigatie.
          */}
          <ButtonLink href={pathForSlug(HEADER_ACTION.slug)}>{HEADER_ACTION.label}</ButtonLink>
        </div>
      </div>
    </header>
  );
}
