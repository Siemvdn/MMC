import { CardImage } from '../ui/CardImage';
import { Container } from '../ui/Container';
import { Heading } from '../ui/Heading';
import { TextBlock } from '../ui/TextBlock';
import type { Project, ProjectsSection } from '../../types/content';
import { cardTitleTag, type CardTitleTag } from './cardTitle';
import { ProjectCard } from './ProjectCard';
import { sectionClass, type SectionComponentProps } from './sectionShared';
import styles from './Collections.module.css';

/**
 * De projecten: het eerste groot als uitgelicht project, de rest als kaarten
 * eronder.
 *
 * Welk project uitgelicht wordt, bepaalt de volgorde in het beheer. Dat is
 * bewust geen apart vinkje: met een vinkje kunnen er twee of geen uitgelicht
 * zijn, met de volgorde altijd precies één.
 */
export function ProjectList({
  section,
  level,
  marker,
  banded,
}: SectionComponentProps<ProjectsSection>) {
  const titleTag = cardTitleTag(level);
  const [featured, ...others] = section.projects;

  return (
    <section className={sectionClass(banded)} data-section-index={marker}>
      <Container>
        <div className={styles.header}>
          <Heading level={level} className={styles.heading}>
            {section.heading}
          </Heading>
          <TextBlock text={section.intro} className={styles.intro} />
        </div>

        {featured !== undefined && <FeaturedProject project={featured} titleTag={titleTag} />}

        {others.length > 0 && (
          <ul className={`${styles.grid} ${styles.gridProjects}`}>
            {others.map((project, index) => (
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

function FeaturedProject({
  project,
  titleTag: Title,
}: {
  project: Project;
  titleTag: CardTitleTag;
}) {
  return (
    <article className={styles.featured}>
      <CardImage
        src={project.image}
        alt={project.imageAlt}
        shape="wide"
        className={styles.featuredImage}
      />

      <div className={styles.featuredBody}>
        <span className={styles.featuredLabel}>Uitgelicht</span>
        {project.category !== '' && <span className={styles.chip}>{project.category}</span>}
        <Title className={styles.featuredTitle}>{project.title}</Title>
        {project.maker !== '' && <p className={styles.featuredMaker}>door {project.maker}</p>}
        <TextBlock text={project.description} className={styles.cardText} />
      </div>
    </article>
  );
}
