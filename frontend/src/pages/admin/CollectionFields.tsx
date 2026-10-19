import { Choice } from '../../components/ui/Choice';
import { Field } from '../../components/ui/Field';
import type { AdminSection } from '../../types/adminContent';
import type { Member, Project, TeaserSource } from '../../types/content';
import { safeWebsite } from '../../utils/safeWebsite';
import { EntryListEditor } from './EntryListEditor';
import { ImageField } from './ImageField';

/**
 * De velden van de secties met leden, projecten en de vooruitblik daarop.
 *
 * Staan los van SectionEditor omdat elk lid en elk project zelf een klein
 * formulier is; in dat bestand zouden ze het overzicht van de andere
 * sectietypes wegdrukken.
 */

/** Gelijk aan EntryListValidator in de backend. */
const MAX_MEMBERS = 40;
const MAX_PROJECTS = 30;

const SOURCE_LABELS: Record<string, string> = {
  members: 'De leden — de eerste vier van de Over ons-pagina',
  projects: 'De projecten — de eerste drie van de Projecten-pagina',
};

const WEBSITE_ERROR =
  'Vul het volledige adres in, inclusief https:// — bijvoorbeeld https://www.voorbeeld.nl. Of laat het veld leeg.';

interface CollectionFieldsProps<T extends AdminSection['type']> {
  section: Extract<AdminSection, { type: T }>;
  fieldId: string;
  csrfToken: string;
  limits: Record<string, number>;
  choices: Record<string, string[]>;
  onChange: (section: AdminSection) => void;
}

function blankMember(): Member {
  return { name: '', specialty: '', website: '', image: null, imageAlt: '' };
}

function blankProject(): Project {
  return { title: '', maker: '', category: '', description: '', image: null, imageAlt: '' };
}

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
        renderFields={(member, update, index) => {
          const id = `${fieldId}-lid-${String(index)}`;
          const websiteIsInvalid = member.website !== '' && safeWebsite(member.website) === null;

          return (
            <>
              <ImageField
                image={member.image}
                imageAlt={member.imageAlt}
                csrfToken={csrfToken}
                onChange={(image, imageAlt) => {
                  update({ ...member, image, imageAlt });
                }}
              />
              <Field
                id={`${id}-naam`}
                label="Naam"
                maxLength={limits.name}
                value={member.name}
                onChange={(name) => {
                  update({ ...member, name });
                }}
                error={member.name.trim() === '' ? 'Vul de naam van het lid in.' : undefined}
              />
              <Field
                id={`${id}-specialisme`}
                label="Specialisme (mag leeg blijven)"
                maxLength={limits.specialty}
                value={member.specialty}
                onChange={(specialty) => {
                  update({ ...member, specialty });
                }}
              />
              <Field
                id={`${id}-website`}
                label="Eigen website (mag leeg blijven)"
                maxLength={limits.website}
                value={member.website}
                onChange={(website) => {
                  update({ ...member, website: website.trim() });
                }}
                error={websiteIsInvalid ? WEBSITE_ERROR : undefined}
              />
            </>
          );
        }}
      />
    </>
  );
}

export function ProjectsFields({
  section,
  fieldId,
  csrfToken,
  limits,
  onChange,
}: CollectionFieldsProps<'projects'>) {
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

      <EntryListEditor
        entries={section.projects}
        noun="Project"
        max={MAX_PROJECTS}
        blank={blankProject}
        describe={(project) => project.title}
        fieldId={`${fieldId}-project`}
        onChange={(projects) => {
          onChange({ ...section, projects });
        }}
        renderFields={(project, update, index) => {
          const id = `${fieldId}-project-${String(index)}`;

          return (
            <>
              {index === 0 && <p>Dit project staat groot bovenaan, als uitgelicht project.</p>}
              <ImageField
                image={project.image}
                imageAlt={project.imageAlt}
                csrfToken={csrfToken}
                onChange={(image, imageAlt) => {
                  update({ ...project, image, imageAlt });
                }}
              />
              <Field
                id={`${id}-titel`}
                label="Titel"
                maxLength={limits.title}
                value={project.title}
                onChange={(title) => {
                  update({ ...project, title });
                }}
                error={project.title.trim() === '' ? 'Geef het project een titel.' : undefined}
              />
              <Field
                id={`${id}-maker`}
                label="Gemaakt door (mag leeg blijven)"
                maxLength={limits.maker}
                value={project.maker}
                onChange={(maker) => {
                  update({ ...project, maker });
                }}
              />
              <Field
                id={`${id}-soort`}
                label="Soort project, bijvoorbeeld 'Tafel' (mag leeg blijven)"
                maxLength={limits.category}
                value={project.category}
                onChange={(category) => {
                  update({ ...project, category });
                }}
              />
              <Field
                id={`${id}-beschrijving`}
                label="Korte beschrijving (mag leeg blijven)"
                maxLength={limits.description}
                value={project.description}
                onChange={(description) => {
                  update({ ...project, description });
                }}
                multiline
              />
            </>
          );
        }}
      />
    </>
  );
}

export function TeaserFields({
  section,
  fieldId,
  limits,
  choices,
  onChange,
}: CollectionFieldsProps<'teaser'>) {
  return (
    <>
      <p>
        Dit blok haalt de leden of projecten zelf op van hun eigen pagina. Wijzigen doet u dáár;
        hier staan alleen de kop en de tekst van de link.
      </p>
      <Field
        id={`${fieldId}-heading`}
        label="Kop"
        maxLength={limits.heading}
        value={section.heading}
        onChange={(heading) => {
          onChange({ ...section, heading });
        }}
      />
      <Choice
        id={`${fieldId}-bron`}
        label="Toont"
        value={section.source}
        options={choices.source ?? []}
        labels={SOURCE_LABELS}
        onChange={(source) => {
          onChange({ ...section, source: source as TeaserSource });
        }}
      />
      <Field
        id={`${fieldId}-link`}
        label="Tekst op de link naar de hele pagina"
        maxLength={limits.linkLabel}
        value={section.linkLabel}
        onChange={(linkLabel) => {
          onChange({ ...section, linkLabel });
        }}
      />
    </>
  );
}

interface SectionIntroFieldsProps {
  heading: string;
  intro: string;
  fieldId: string;
  limits: Record<string, number>;
  onChange: (heading: string, intro: string) => void;
}

/** De kop en inleiding boven de leden of de projecten. */
function SectionIntroFields({
  heading,
  intro,
  fieldId,
  limits,
  onChange,
}: SectionIntroFieldsProps) {
  return (
    <>
      <Field
        id={`${fieldId}-heading`}
        label="Kop"
        maxLength={limits.heading}
        value={heading}
        onChange={(value) => {
          onChange(value, intro);
        }}
      />
      <Field
        id={`${fieldId}-intro`}
        label="Inleiding (mag leeg blijven)"
        maxLength={limits.intro}
        value={intro}
        onChange={(value) => {
          onChange(heading, value);
        }}
        multiline
      />
    </>
  );
}
