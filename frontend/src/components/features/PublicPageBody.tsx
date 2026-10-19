import type { PageSlug } from '../../constants/routes';
import type { ContentSection } from '../../types/content';
import { ContactForm } from './ContactForm';
import { PageSections } from './PageSections';

export interface PublicPageBodyProps {
  slug: PageSlug;
  sections: ContentSection[];
  /**
   * Zet `data-section-index` op elke sectie, zodat het voorbeeldvenster van
   * het beheer een blok kan aanwijzen. Standaard uit.
   */
  annotate?: boolean;
}

/**
 * De inhoud van een publieke pagina: de secties, en op de contactpagina het
 * formulier op de juiste plek daartussen.
 *
 * Bestaat omdat deze samenstelling op twee plekken nodig is: op de site zelf
 * én in het voorbeeldvenster van het beheer. Zou het voorbeeld zijn eigen
 * versie hebben, dan gaan die twee vroeg of laat uit elkaar lopen — en juist
 * dán is een voorbeeld waardeloos, want het belooft iets wat niet klopt.
 *
 * Nu is "het voorbeeld toont wat de site toont" geen belofte maar een gevolg:
 * er is één implementatie.
 */
export function PublicPageBody({ slug, sections, annotate = false }: PublicPageBodyProps) {
  if (slug !== 'contact') {
    return <PageSections sections={sections} annotate={annotate} />;
  }

  /*
   * Op de contactpagina staat het formulier tussen de uitnodiging en de uitleg
   * over gegevensgebruik. Die volgorde is bewust: wat er met je gegevens
   * gebeurt hoort ná het formulier waar je ze invult, niet ervoor.
   */
  const [invitation, ...remaining] = sections;

  return (
    <>
      {/* `noUncheckedIndexedAccess` staat aan, dus de eerste sectie kan in
          theorie ontbreken en dat moeten we hier afhandelen. */}
      {invitation !== undefined && <PageSections sections={[invitation]} annotate={annotate} />}

      <ContactForm />

      {/* h2, want de h1 van deze pagina staat hierboven al. */}
      {remaining.length > 0 && (
        <PageSections
          sections={remaining}
          firstHeadingLevel={2}
          annotate={annotate}
          indexOffset={1}
        />
      )}
    </>
  );
}
