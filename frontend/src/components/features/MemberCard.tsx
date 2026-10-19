import { CardImage } from '../ui/CardImage';
import { ExternalLinkIcon } from '../ui/Icons';
import { safeWebsite } from '../../utils/safeWebsite';
import type { Member } from '../../types/content';
import type { CardTitleTag } from './cardTitle';
import styles from './Collections.module.css';

export interface MemberCardProps {
  member: Member;
  titleTag: CardTitleTag;
}

/**
 * Eén lid: portret, naam, eventueel specialisme en een link naar de eigen
 * site.
 *
 * Gebruikt op de Over ons-pagina én in de vooruitblik op de homepage, zodat
 * een lid er op beide plekken hetzelfde uitziet.
 */
export function MemberCard({ member, titleTag: Title }: MemberCardProps) {
  const website = safeWebsite(member.website);

  return (
    <li className={styles.card}>
      <CardImage src={member.image} alt={member.imageAlt} shape="portrait" />

      <div className={styles.cardBody}>
        <Title className={styles.cardTitle}>{member.name}</Title>

        {member.specialty !== '' && <p className={styles.cardMeta}>{member.specialty}</p>}

        {website !== null && (
          <a className={styles.cardLink} href={website} target="_blank" rel="noopener noreferrer">
            Bekijk website
            {/* Acht keer "Bekijk website" onder elkaar zegt een schermlezer
                niets; de naam erbij maakt elke link uniek (CLAUDE.md §14). */}
            <span className={styles.visuallyHidden}>
              {' '}
              van {member.name} (opent in een nieuw tabblad)
            </span>
            <ExternalLinkIcon />
          </a>
        )}
      </div>
    </li>
  );
}
