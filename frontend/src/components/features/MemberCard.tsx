import { CardImage } from '../ui/CardImage';
import { ExternalLinkIcon, MailIcon, PhoneIcon } from '../ui/Icons';
import { phoneHref } from '../../utils/phoneHref';
import { safeWebsite } from '../../utils/safeWebsite';
import type { Member } from '../../types/content';
import type { CardTitleTag } from './cardTitle';
import styles from './Collections.module.css';
import memberStyles from './MemberCard.module.css';

export interface MemberCardProps {
  member: Member;
  titleTag: CardTitleTag;
  /**
   * Met omschrijving en contactgegevens, zoals op de Over ons-pagina. Zonder
   * dit alleen foto, naam en specialisme: de vooruitblik op de homepage
   * blijft zo compact, en wie meer wil weten klikt door.
   */
  detailed?: boolean;
}

/**
 * Eén lid: portret, naam, eventueel specialisme, en in de uitgebreide vorm
 * een korte omschrijving, telefoon, e-mail en de eigen site.
 *
 * Gebruikt op de Over ons-pagina én in de vooruitblik op de homepage, zodat
 * een lid er op beide plekken hetzelfde uitziet.
 */
export function MemberCard({ member, titleTag: Title, detailed = false }: MemberCardProps) {
  return (
    <li className={detailed ? `${styles.card} ${memberStyles.detailed}` : styles.card}>
      <CardImage src={member.image} alt={member.imageAlt} shape="portrait" />

      <div className={styles.cardBody}>
        <Title className={styles.cardTitle}>{member.name}</Title>

        {member.specialty !== '' && <p className={styles.cardMeta}>{member.specialty}</p>}

        {detailed && <MemberDetails member={member} />}
      </div>
    </li>
  );
}

/**
 * Omschrijving en contactgegevens. Elk veld mag leeg zijn of ontbreken
 * (in content van vóór deze velden); dan valt die regel weg.
 */
function MemberDetails({ member }: { member: Member }) {
  const bio = member.bio ?? '';
  const phone = member.phone ?? '';
  const email = member.email ?? '';
  const website = safeWebsite(member.website);

  return (
    <>
      {bio !== '' && <p className={memberStyles.bio}>{bio}</p>}

      {(phone !== '' || email !== '' || website !== null) && (
        <ul className={memberStyles.contact}>
          {phone !== '' && (
            <li className={memberStyles.contactLine}>
              <PhoneIcon />
              <a className={memberStyles.contactLink} href={phoneHref(phone)}>
                {/* Een schermlezer die alle links op een rij voorleest, hoort
                    anders acht losse nummers zonder naam (CLAUDE.md §14). */}
                <span className={styles.visuallyHidden}>Bel {member.name}: </span>
                {phone}
              </a>
            </li>
          )}

          {email !== '' && (
            <li className={memberStyles.contactLine}>
              <MailIcon />
              <a className={memberStyles.contactLink} href={`mailto:${email}`}>
                <span className={styles.visuallyHidden}>Mail {member.name}: </span>
                {email}
              </a>
            </li>
          )}

          {website !== null && (
            <li className={memberStyles.contactLine}>
              <ExternalLinkIcon />
              <a
                className={memberStyles.contactLink}
                href={website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Bekijk website
                <span className={styles.visuallyHidden}>
                  {' '}
                  van {member.name} (opent in een nieuw tabblad)
                </span>
              </a>
            </li>
          )}
        </ul>
      )}
    </>
  );
}
