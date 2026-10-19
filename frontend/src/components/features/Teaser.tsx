import { Button } from '../ui/Button';
import { Container } from '../ui/Container';
import { Heading } from '../ui/Heading';
import { ArrowRightIcon } from '../ui/Icons';
import { ROUTES, pathForSlug, type PageSlug } from '../../constants/routes';
import { usePageContent } from '../../hooks/usePageContent';
import { membersIn, projectsIn } from '../../utils/collectionItems';
import type { TeaserSection, TeaserSource } from '../../types/content';
import { cardTitleTag } from './cardTitle';
import { MemberCard } from './MemberCard';
import { ProjectCard } from './ProjectCard';
import { sectionClass, type SectionComponentProps } from './sectionShared';
import styles from './Collections.module.css';

/** De pagina waar de items van een vooruitblik staan. */
const SOURCE_PAGE: Record<TeaserSource, PageSlug> = {
  members: 'over-ons',
  projects: 'projecten',
};

/**
 * Hoeveel items een vooruitblik toont: precies één rij op een breed scherm.
 * Portretten zijn smaller dan projectfoto's, dus passen er meer naast elkaar.
 */
const SOURCE_COUNT: Record<TeaserSource, number> = {
  members: 4,
  projects: 3,
};

const LOADING_TEXT: Record<TeaserSource, string> = {
  members: 'De leden worden geladen…',
  projects: 'De projecten worden geladen…',
};

/**
 * Een vooruitblik op de leden of de projecten, met een link naar de pagina
 * waar ze allemaal staan.
 *
 * De items komen live van die pagina en niet uit een kopie: een nieuw lid
 * staat zo vanzelf ook op de homepage. Is de lijst daar (nog) leeg, dan
 * verdwijnt de vooruitblik, net zoals de publieke API een lege lijst weglaat.
 */
export function Teaser({ section, level, marker, banded }: SectionComponentProps<TeaserSection>) {
  const slug = SOURCE_PAGE[section.source];
  const { state, retry } = usePageContent(slug);
  const titleTag = cardTitleTag(level);

  const sections = state.status === 'success' ? state.data.sections : [];
  const count = SOURCE_COUNT[section.source];
  const members = section.source === 'members' ? membersIn(sections).slice(0, count) : [];
  const projects = section.source === 'projects' ? projectsIn(sections).slice(0, count) : [];

  if (state.status === 'success' && members.length === 0 && projects.length === 0) {
    return null;
  }

  return (
    <section className={sectionClass(banded)} data-section-index={marker}>
      <Container>
        <div className={styles.teaserHeader}>
          <div>
            <span className={styles.kicker}>
              {ROUTES.find((route) => route.slug === slug)?.label}
            </span>
            <Heading level={level} className={styles.heading}>
              {section.heading}
            </Heading>
          </div>

          <a className={styles.moreLink} href={pathForSlug(slug)}>
            {section.linkLabel}
            <ArrowRightIcon />
          </a>
        </div>

        {(state.status === 'idle' || state.status === 'loading') && (
          <p className={styles.status} role="status">
            {LOADING_TEXT[section.source]}
          </p>
        )}

        {state.status === 'error' && (
          <div className={styles.status} role="status" aria-live="assertive">
            <p>{state.error}</p>
            <Button variant="secondary" onClick={retry}>
              Opnieuw proberen
            </Button>
          </div>
        )}

        {members.length > 0 && (
          <ul className={`${styles.grid} ${styles.gridMembers}`}>
            {members.map((member, index) => (
              <MemberCard
                key={`${member.name}-${String(index)}`}
                member={member}
                titleTag={titleTag}
              />
            ))}
          </ul>
        )}

        {projects.length > 0 && (
          <ul className={`${styles.grid} ${styles.gridProjects}`}>
            {projects.map((project, index) => (
              <ProjectCard
                key={`${project.title}-${String(index)}`}
                project={project}
                titleTag={titleTag}
              />
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
