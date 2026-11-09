import { Field } from '../../components/ui/Field';
import type { Member } from '../../types/content';
import { validateMemberContact } from '../../utils/validateMemberContact';
import { EntryListEditor } from './EntryListEditor';
import { ImageField } from './ImageField';
import { SectionIntroFields, type CollectionFieldsProps } from './SectionIntroFields';

/** Gelijk aan EntryListValidator in de backend. */
const MAX_MEMBERS = 40;

function blankMember(): Member {
  return {
    name: '',
    specialty: '',
    bio: '',
    phone: '',
    email: '',
    website: '',
    image: null,
    imageAlt: '',
  };
}

/** De leden op de Over ons-pagina, elk met foto, gegevens en contact. */
export function MembersFields({
  section,
  fieldId,
  csrfToken,
  limits,
  onChange,
}: CollectionFieldsProps<'members'>) {
  return (
    <>
      <SectionIntroFields
        heading={section.heading}
        intro={section.intro}
        fieldId={fieldId}
        limits={limits}
        onChange={(heading, intro) => {
          onChange({ ...section, heading, intro });
        }}
      />

      <p>
        Telefoonnummer en e-mailadres zijn persoonsgegevens: vul ze alleen in als het lid dat
        goedvindt. Een leeg veld verschijnt niet op de site.
      </p>

      <EntryListEditor
        entries={section.members}
        noun="Lid"
        max={MAX_MEMBERS}
        blank={blankMember}
        describe={(member) => member.name}
        fieldId={`${fieldId}-lid`}
        onChange={(members) => {
          onChange({ ...section, members });
        }}
        renderFields={(member, update, index) => (
          <MemberEntryFields
            member={member}
            id={`${fieldId}-lid-${String(index)}`}
            csrfToken={csrfToken}
            limits={limits}
            onChange={update}
          />
        )}
      />
    </>
  );
}

interface MemberEntryFieldsProps {
  member: Member;
  id: string;
  csrfToken: string;
  limits: Record<string, number>;
  onChange: (member: Member) => void;
}

/**
 * De velden van één lid. Omschrijving, telefoon en e-mail kunnen ontbreken
 * in content van vóór die velden; dan beginnen ze hier leeg.
 */
function MemberEntryFields({ member, id, csrfToken, limits, onChange }: MemberEntryFieldsProps) {
  const bio = member.bio ?? '';
  const phone = member.phone ?? '';
  const email = member.email ?? '';
  const errors = validateMemberContact({ phone, email, website: member.website });

  return (
    <>
      <ImageField
        image={member.image}
        imageAlt={member.imageAlt}
        csrfToken={csrfToken}
        onChange={(image, imageAlt) => {
          onChange({ ...member, image, imageAlt });
        }}
      />
      <Field
        id={`${id}-naam`}
        label="Naam"
        maxLength={limits.name}
        value={member.name}
        onChange={(name) => {
          onChange({ ...member, name });
        }}
        error={member.name.trim() === '' ? 'Vul de naam van het lid in.' : undefined}
      />
      <Field
        id={`${id}-specialisme`}
        label="Specialisme (mag leeg blijven)"
        maxLength={limits.specialty}
        value={member.specialty}
        onChange={(specialty) => {
          onChange({ ...member, specialty });
        }}
      />
      <Field
        id={`${id}-omschrijving`}
        label="Korte omschrijving, één of twee zinnen (mag leeg blijven)"
        maxLength={limits.bio}
        value={bio}
        onChange={(value) => {
          onChange({ ...member, bio: value });
        }}
        multiline
      />
      <Field
        id={`${id}-telefoon`}
        label="Telefoonnummer (mag leeg blijven)"
        type="tel"
        maxLength={limits.phone}
        value={phone}
        onChange={(value) => {
          onChange({ ...member, phone: value.trim() });
        }}
        error={errors.phone}
      />
      <Field
        id={`${id}-email`}
        label="E-mailadres (mag leeg blijven)"
        type="email"
        maxLength={limits.email}
        value={email}
        onChange={(value) => {
          onChange({ ...member, email: value.trim() });
        }}
        error={errors.email}
      />
      <Field
        id={`${id}-website`}
        label="Eigen website (mag leeg blijven)"
        maxLength={limits.website}
        value={member.website}
        onChange={(website) => {
          onChange({ ...member, website: website.trim() });
        }}
        error={errors.website}
      />
    </>
  );
}
