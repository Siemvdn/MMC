import { Container } from '../ui/Container';
import { Heading } from '../ui/Heading';
import { TextBlock } from '../ui/TextBlock';
import type { MembersSection } from '../../types/content';
import { cardTitleTag } from './cardTitle';
import { MemberCard } from './MemberCard';
import { sectionClass, type SectionComponentProps } from './sectionShared';
import styles from './Collections.module.css';

/** Alle leden van het collectief, in de volgorde uit het beheer. */
export function MemberList({
  section,
  level,
  marker,
  banded,
}: SectionComponentProps<MembersSection>) {
  const titleTag = cardTitleTag(level);

  return (
    <section className={sectionClass(banded)} data-section-index={marker}>
      <Container>
        <div className={styles.header}>
          <Heading level={level} className={styles.heading}>
            {section.heading}
          </Heading>
          <TextBlock text={section.intro} className={styles.intro} />
        </div>

        <ul className={`${styles.grid} ${styles.gridMembers}`}>
          {section.members.map((member, index) => (
            // Naam plus plek: twee leden met dezelfde naam blijven zo uniek.
            <MemberCard
              key={`${member.name}-${String(index)}`}
              member={member}
              titleTag={titleTag}
            />
          ))}
        </ul>
      </Container>
    </section>
  );
}
