import { ContactDetails } from '../components/features/ContactDetails';
import { BrandMark } from '../components/ui/BrandMark';
import { Placeholder } from '../components/ui/Placeholder';
import { ROUTES, pathForSlug, type PageSlug } from '../constants/routes';
import type { SiteContent } from '../types/content';
import styles from './Footer.module.css';

export interface FooterProps {
  site: SiteContent;
}

/**
 * De juridische pagina's staan onderaan in een eigen regel, niet tussen de
 * gewone pagina's: daar zoekt een bezoeker ze, en zo blijft de lijst met
 * pagina's gelijk aan het menu in de kop.
 */
const LEGAL_SLUGS: readonly PageSlug[] = ['privacy', 'terms'];

const PAGE_ROUTES = ROUTES.filter((route) => !LEGAL_SLUGS.includes(route.slug));

/**
 * De footer staat op elke pagina en draagt de contactgegevens.
 *
 * CLAUDE.md §12 wil die overal machineleesbaar hebben; hoe, staat bij
 * ContactDetails. Het LocalBusiness-schema zelf komt er pas bij zodra de
 * gegevens er echt zijn. Halve of verzonnen NAP-gegevens zijn schadelijker
 * dan geen schema, omdat ze exact moeten matchen met het Google Business
 * Profile.
 */
export function Footer({ site }: FooterProps) {
  const { businessName, contact } = site;
  const name = businessName === '' ? <Placeholder label="bedrijfsnaam" /> : businessName;

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brandColumn}>
          <span className={styles.brand}>
            <BrandMark tone="inverted" />
            {name}
          </span>
        </div>

        <div className={styles.column}>
          <h2 className={styles.heading}>Contact</h2>
          <ContactDetails contact={contact} />
        </div>

        <nav className={styles.column} aria-label="Pagina's">
          <h2 className={styles.heading}>Pagina&rsquo;s</h2>
          <ul className={styles.links}>
            {PAGE_ROUTES.map((route) => (
              <li key={route.slug}>
                <a href={route.path}>{route.label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className={styles.bottom}>
        <span>
          © {new Date().getFullYear()} {name}
        </span>
        <span className={styles.legal}>
          <a href={pathForSlug('privacy')}>Privacyverklaring</a>
          <a href={pathForSlug('terms')}>Algemene voorwaarden</a>
        </span>
      </div>
    </footer>
  );
}
