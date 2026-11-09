import { Choice } from '../../components/ui/Choice';
import { Field } from '../../components/ui/Field';
import type { Project, TeaserSource } from '../../types/content';
import { EntryListEditor } from './EntryListEditor';
import { ImageField } from './ImageField';
import { SectionIntroFields, type CollectionFieldsProps } from './SectionIntroFields';

/**
 * De velden van de projecten en de vooruitblik. De leden staan in
 * MembersFields.
 *
 * Staan los van SectionEditor omdat elk project zelf een klein formulier is;
 * in dat bestand zouden ze het overzicht van de andere sectietypes
 * wegdrukken.
 */

/** Gelijk aan EntryListValidator in de backend. */
const MAX_PROJECTS = 30;

const SOURCE_LABELS: Record<string, string> = {
  members: 'De leden — de eerste vier van de Over ons-pagina',
  projects: 'De projecten — de eerste drie van de Projecten-pagina',
};

function blankProject(): Project {
  return { title: '', maker: '', category: '', description: '', image: null, imageAlt: '' };
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
