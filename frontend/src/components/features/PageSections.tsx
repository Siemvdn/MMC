import { Carousel } from '../ui/Carousel';
import { Container } from '../ui/Container';
import { Figure } from '../ui/Figure';
import { Heading, type HeadingLevel } from '../ui/Heading';
import { TextBlock } from '../ui/TextBlock';
import { ButtonLink } from '../ui/ButtonLink';
import { pathForSlug } from '../../constants/routes';
import type {
  ContentSection,
  CtaSection,
  HeroAction,
  HeroSection,
  ListItem,
  ListSection,
  ProseSection,
  QuoteSection,
} from '../../types/content';
import styles from './Sections.module.css';

export interface PageSectionsProps {
  sections: ContentSection[];
  /**
   * Het kopniveau van de eerste sectie; alle volgende krijgen h2.
   *
   * Standaard 1, want normaal begint een pagina hiermee. De contactpagina
   * rendert de secties in twee stukken met het formulier ertussen, en zet
   * voor het tweede stuk 2 — anders zou die pagina twee h1's krijgen.
   */
  firstHeadingLevel?: HeadingLevel;
  /**
   * Zet `data-section-index` op elke sectie.
   *
   * Alleen aan in het voorbeeldvenster van het beheer, dat daarmee een blok
   * kan oplichten of aanwijzen. Standaard uit, dus de publieke pagina's
   * krijgen er geen extra attribuut bij.
   */
  annotate?: boolean;
  /**
   * Waar de nummering van `data-section-index` begint.
   *
   * Nodig op de contactpagina, die de secties in twee stukken rendert met het
   * formulier ertussen. Zonder deze verschuiving zou het tweede stuk weer bij
   * nul beginnen tellen, en dan wijst een klik in het voorbeeld naar het
   * verkeerde veld in de editor.
   */
  indexOffset?: number;
}

/** Waar de knop in het afsluitende blok heen wijst. */
const CONTACT_PATH = '/contact';

/**
 * Rendert de secties van een pagina op volgorde.
 *
 * De eerste sectie krijgt de h1, de rest een h2. Zo heeft elke pagina precies
 * één h1 en loopt de kophiërarchie logisch door, zonder dat de content-JSON
 * daar iets over hoeft te zeggen (CLAUDE.md §12, §14).
 */
export function PageSections({
  sections,
  firstHeadingLevel = 1,
  annotate = false,
  indexOffset = 0,
}: PageSectionsProps) {
  return (
    <>
      {sections.map((section, index) => (
        <Section
          key={`${section.type}-${String(index)}`}
          section={section}
          level={index === 0 ? firstHeadingLevel : 2}
          marker={annotate ? String(index + indexOffset) : undefined}
          banded={section.background === 'tinted'}
        />
      ))}
    </>
  );
}

/**
 * @param marker Waarde voor `data-section-index`; `undefined` laat het
 *        attribuut helemaal weg, want React slaat undefined-attributen over.
 */
function Section({
  section,
  level,
  marker,
  banded,
}: {
  section: ContentSection;
  level: HeadingLevel;
  marker?: string;
  banded: boolean;
}) {
  // De switch is uitputtend over de discriminated union. Komt er een
  // sectietype bij zonder tak hier, dan meldt TypeScript dat bij `never`.
  switch (section.type) {
    case 'hero':
      return <Hero section={section} level={level} marker={marker} banded={banded} />;
    case 'prose':
      return <Prose section={section} level={level} marker={marker} banded={banded} />;
    case 'quote':
      return <Quote section={section} marker={marker} banded={banded} />;
    case 'list':
      return <List section={section} level={level} marker={marker} banded={banded} />;
    case 'cta':
      return <Cta section={section} level={level} marker={marker} banded={banded} />;
  }
}

function Hero({
  section,
  level,
  marker,
  banded,
}: {
  section: HeroSection;
  level: HeadingLevel;
  marker?: string;
  banded: boolean;
}) {
  const hasImage = section.image !== null && section.image !== '';

  /*
   * Een banner zónder foto valt terug op de gewone kop met getinte band. Dat
   * is geen randgeval maar de normale toestand zolang de klant nog geen foto
   * heeft geüpload — en een lege zwarte balk zou er kapot uitzien.
   */
  if (section.layout === 'banner' && hasImage) {
    return <HeroBanner section={section} level={level} marker={marker} />;
  }

  return (
    <section className={sectionClass(banded)} data-section-index={marker}>
      <Container>
        <div className={`${styles.hero} ${hasImage ? '' : styles.heroWithoutImage}`}>
          <div className={styles.heroBody}>
            <span className={styles.kicker}>{section.kicker}</span>
            <Heading level={level} className={styles.heroHeading}>
              {section.heading}
            </Heading>
            <TextBlock text={section.text} className={styles.heroText} />
            <HeroActions actions={section.actions} />
          </div>
          {/* De hero staat boven de vouw, dus dit beeld laadt niet lui (§12). */}
          <Figure src={section.image} alt={section.imageAlt} lazy={false} />
        </div>
      </Container>
    </section>
  );
}

/**
 * De kop als brede banner, met de tekst over de foto.
 *
 * De tekstkleur is een keuze van de beheerder en geen berekening: of wit of
 * zwart leesbaar is hangt af van wat er op de foto staat, en dat kan alleen
 * iemand beoordelen die hem ziet. Het verloop achter de tekst helpt daarbij —
 * zonder dat verdwijnen witte letters in een wolk en zwarte in een schaduw.
 */
function HeroBanner({
  section,
  level,
  marker,
}: {
  section: HeroSection;
  level: HeadingLevel;
  marker?: string;
}) {
  const tone = section.textColor === 'light' ? styles.bannerLight : styles.bannerDark;

  return (
    <section className={`${styles.banner} ${tone}`} data-section-index={marker}>
      {/*
        De alt-tekst is leeg omdat deze foto decoratief is: alles wat hij
        overbrengt staat als tekst in de kop eroverheen. Een schermlezer die
        hem ook voorleest, herhaalt zichzelf (CLAUDE.md §14).
      */}
      <img
        className={styles.bannerImage}
        src={section.image ?? ''}
        alt=""
        loading="eager"
        decoding="async"
      />

      <Container className={styles.bannerContainer}>
        <div className={styles.bannerBody}>
          {section.kicker !== '' && <span className={styles.bannerKicker}>{section.kicker}</span>}
          <Heading level={level} className={styles.bannerHeading}>
            {section.heading}
          </Heading>
          <TextBlock text={section.text} className={styles.bannerText} />
          <HeroActions actions={section.actions} />
        </div>
      </Container>
    </section>
  );
}

/**
 * De knoppen onder een paginakop.
 *
 * De eerste is de opvallende: dat is wat de bezoeker als eerste zou moeten
 * doen. Een tweede even opvallende knop ernaast maakt van één duidelijke
 * vervolgstap twee gelijkwaardige, en dan kiest de bezoeker geen van beide.
 */
function HeroActions({ actions }: { actions: HeroAction[] }) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={styles.heroActions}>
      {actions.map((action, index) => (
        <ButtonLink
          key={action.target + action.label}
          href={pathForSlug(action.target)}
          variant={index === 0 ? 'primary' : 'secondary'}
          size="large"
        >
          {action.label}
        </ButtonLink>
      ))}
    </div>
  );
}

function Prose({
  section,
  level,
  marker,
  banded,
}: {
  section: ProseSection;
  level: HeadingLevel;
  marker?: string;
  banded: boolean;
}) {
  const hasImage = section.image !== null && section.image !== '';
  const imageOnLeft = hasImage && section.imagePosition === 'left';

  const proseClassName = [
    styles.prose,
    hasImage ? '' : styles.proseWithoutImage,
    imageOnLeft ? styles.proseImageLeft : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={sectionClass(banded)} data-section-index={marker}>
      <Container>
        <div className={proseClassName}>
          <div>
            <Heading level={level} className={styles.heading}>
              {section.heading}
            </Heading>
            <TextBlock text={section.text} className={styles.text} />
          </div>
          <Figure src={section.image} alt={section.imageAlt} />
        </div>
      </Container>
    </section>
  );
}

/**
 * Een uitgelicht citaat, met dezelfde links/rechts-fotokeuze als Prose.
 *
 * Geen `level`-prop en dus geen `<Heading>`: een citaat opent geen nieuw
 * onderwerp op de pagina, dus krijgt deze sectie geen eigen kop (§14 —
 * anders zou de kopstructuur een sprong maken zonder betekenis).
 */
function Quote({
  section,
  marker,
  banded,
}: {
  section: QuoteSection;
  marker?: string;
  banded: boolean;
}) {
  const hasImages = section.images.length > 0;
  const imageOnLeft = hasImages && section.imagePosition === 'left';

  const quoteClassName = [
    styles.prose,
    hasImages ? '' : styles.proseWithoutImage,
    imageOnLeft ? styles.proseImageLeft : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={sectionClass(banded)} data-section-index={marker}>
      <Container>
        <div className={quoteClassName}>
          <div>
            <blockquote className={styles.quoteText}>
              <TextBlock text={section.text} />
            </blockquote>
            <TextBlock text={section.supportingText} className={styles.quoteSupportingText} />
          </div>
          <Carousel
            images={section.images.map((image) => ({ src: image.image, alt: image.imageAlt }))}
          />
        </div>
      </Container>
    </section>
  );
}

function List({
  section,
  level,
  marker,
  banded,
}: {
  section: ListSection;
  level: HeadingLevel;
  marker?: string;
  banded: boolean;
}) {
  return (
    <section className={sectionClass(banded)} data-section-index={marker}>
      <Container>
        <div className={styles.listHeader}>
          <Heading level={level} className={styles.heading}>
            {section.heading}
          </Heading>

          <TextBlock text={section.intro} className={styles.intro} />
        </div>

        {section.variant === 'steps' && <Steps items={section.items} />}
        {section.variant === 'timeline' && <Timeline items={section.items} />}
        {section.variant === 'cards' && <Cards items={section.items} />}
      </Container>
    </section>
  );
}

/**
 * Losse kaarten naast elkaar, voor items die naast elkaar bestaan.
 *
 * Een echte lijst en geen reeks divs: een schermlezer meldt dan hoeveel items
 * er zijn (CLAUDE.md §14).
 */
function Cards({ items }: { items: ListItem[] }) {
  return (
    <ul className={styles.items}>
      {items.map((item) => (
        <li key={item.title} className={styles.item}>
          <span className={styles.itemTitle}>{item.title}</span>
          <TextBlock text={item.text} className={styles.itemText} />
        </li>
      ))}
    </ul>
  );
}

/**
 * Genummerde stappen, voor items die op volgorde gaan.
 *
 * Een `<ol>` en geen `<ul>`: de volgorde is hier de betekenis, en dat hoort in
 * het element te zitten en niet alleen in de cijfers die je ziet. De cijfers
 * zelf zijn daarom decoratief — een schermlezer leest de nummering al voor,
 * en die twee keer horen helpt niemand.
 */
function Steps({ items }: { items: ListItem[] }) {
  return (
    <ol className={styles.steps}>
      {items.map((item, index) => (
        <li key={item.title} className={styles.step}>
          <span className={styles.stepNumber} aria-hidden="true">
            {index + 1}
          </span>
          <span className={styles.stepTitle}>{item.title}</span>
          <TextBlock text={item.text} className={styles.itemText} />
        </li>
      ))}
    </ol>
  );
}

/**
 * Bolletjes op een lijn, voor een verloop door de tijd.
 *
 * Ook hier een `<ol>`: de volgorde is de betekenis. Het bolletje is
 * decoratief — het periode-label eromheen zegt al waar een punt in de tijd
 * zit — en staat daarom buiten de voorleesvolgorde, net als de cijfers bij
 * Steps.
 */
function Timeline({ items }: { items: ListItem[] }) {
  return (
    <ol className={styles.timeline}>
      {items.map((item) => (
        <li key={item.title} className={styles.timelineItem}>
          <span className={styles.timelineDot} aria-hidden="true" />
          <div className={styles.timelineContent}>
            <span className={styles.timelinePeriod}>{item.title}</span>
            <TextBlock text={item.text} className={styles.timelineLabel} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Cta({
  section,
  level,
  marker,
  banded,
}: {
  section: CtaSection;
  level: HeadingLevel;
  marker?: string;
  banded: boolean;
}) {
  return (
    <section className={sectionClass(banded)} data-section-index={marker}>
      <Container>
        <div className={styles.cta}>
          <div className={styles.ctaBody}>
            <Heading level={level} className={styles.ctaHeading}>
              {section.heading}
            </Heading>
            <TextBlock text={section.text} className={styles.ctaText} />
          </div>
          <ButtonLink href={CONTACT_PATH} size="large">
            {section.buttonLabel}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}

/** De opmaakklasse van een sectie, met of zonder getinte achtergrond. */
/**
 * @param banded Of deze sectie het getinte vlak krijgt. Komt uit de
 *        content: de beheerder kiest het per sectie.
 */
function sectionClass(banded: boolean): string {
  return banded ? `${styles.section} ${styles.band}` : (styles.section ?? '');
}
