import { CardImage } from '../ui/CardImage';
import { TextBlock } from '../ui/TextBlock';
import type { Project } from '../../types/content';
import type { CardTitleTag } from './cardTitle';
import styles from './Collections.module.css';

export interface ProjectCardProps {
  project: Project;
  titleTag: CardTitleTag;
}

/**
 * Eén project als kaart: foto, soort project, titel, maker en beschrijving.
 *
 * Elk veld behalve de titel mag leeg zijn, en dan valt die regel gewoon weg
 * in plaats van dat er een leeg label blijft staan.
 */
export function ProjectCard({ project, titleTag: Title }: ProjectCardProps) {
  return (
    <li className={styles.card}>
      <CardImage src={project.image} alt={project.imageAlt} shape="landscape" />

      <div className={styles.cardBody}>
        {project.category !== '' && <span className={styles.chip}>{project.category}</span>}
        <Title className={styles.cardTitle}>{project.title}</Title>
        {project.maker !== '' && <p className={styles.cardMeta}>door {project.maker}</p>}
        <TextBlock text={project.description} className={styles.cardText} />
      </div>
    </li>
  );
}
