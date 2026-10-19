import type { ReactNode } from 'react';

import type { PageSlug } from '../constants/routes';
import type { SiteContent } from '../types/content';
import { Footer } from './Footer';
import { Header } from './Header';
import styles from './PageLayout.module.css';

export interface PageLayoutProps {
  /** Ontbreekt op de 404-pagina: die hoort bij geen enkele menukeuze. */
  currentSlug?: PageSlug;
  /**
   * Ontbreekt zolang de content nog laadt of een fout gaf. De header en
   * footer worden dan zonder gegevens getoond in plaats van helemaal niet:
   * de navigatie moet ook werken als het laden mislukt.
   */
  site?: SiteContent;
  children: ReactNode;
}

const EMPTY_SITE: SiteContent = {
  businessName: '',
  contact: { phone: '', email: '', area: '' },
  sameAs: [],
};

const MAIN_ID = 'inhoud';

export function PageLayout({ currentSlug, site, children }: PageLayoutProps) {
  const resolvedSite = site ?? EMPTY_SITE;

  return (
    <div className={styles.page}>
      <a href={`#${MAIN_ID}`} className={styles.skipLink}>
        Naar de inhoud
      </a>

      <Header businessName={resolvedSite.businessName} currentSlug={currentSlug} />

      {/*
        Precies één <main> per pagina, en de inhoud zit erin. Schermlezers en
        de overslaan-link gebruiken dit als het beginpunt (CLAUDE.md §7, §14).
      */}
      <main id={MAIN_ID} className={styles.main}>
        {children}
      </main>

      <Footer site={resolvedSite} />
    </div>
  );
}
