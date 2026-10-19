import { useId, useRef } from 'react';

import { Choice } from '../../components/ui/Choice';
import { Field } from '../../components/ui/Field';
import { useImageUpload } from '../../hooks/useImageUpload';
import { ImageField } from './ImageField';
import type { AdminSection } from '../../types/adminContent';
import type { PageSlug } from '../../constants/routes';
import type {
  HeroAction,
  HeroLayout,
  HeroTextColor,
  ImagePosition,
  ListItem,
  ListVariant,
  QuoteImage,
  SectionBackground,
} from '../../types/content';
import { SECTION_LABELS, sectionElementId } from './sectionTools';
import styles from './EditorPage.module.css';

/** Hoe de indelingskeuzes in het beheer heten. */
const LAYOUT_LABELS: Record<string, string> = {
  beside: 'Foto naast de tekst',
  banner: 'Brede banner met de tekst over de foto',
};

const TEXT_COLOR_LABELS: Record<string, string> = {
  dark: 'Donker',
  light: 'Licht',
};

/** De weergavekeuze van een lijst, in gewone taal. */
const VARIANT_LABELS: Record<string, string> = {
  cards: 'Kaarten naast elkaar',
  steps: 'Genummerde stappen',
  timeline: 'Tijdlijn met bolletjes',
};

/** De achtergrondkeuze, in gewone taal. */
const BACKGROUND_LABELS: Record<string, string> = {
  light: 'Licht — de gewone achtergrond van de pagina',
  tinted: 'Getint — een getint vlak over de volle breedte',
};

/** Aan welke kant van de tekst de foto van een tekstblok staat. */
const IMAGE_POSITION_LABELS: Record<string, string> = {
  left: 'Links van de tekst',
  right: 'Rechts van de tekst',
};

/** Waar een knop heen kan wijzen, in gewone taal. */
const TARGET_LABELS: Record<string, string> = {
  home: 'Home',
  'over-ons': 'Over ons',
  contact: 'Contact',
};

/**
 * Twee knoppen is het maximum, gelijk aan wat de validator afdwingt.
 * Staat hier zodat de knop "Knop toevoegen" verdwijnt vóórdat de beheerder
 * een derde maakt en die pas bij het opslaan afgekeurd ziet worden.
 */
const MAX_ACTIONS = 2;

export interface SectionEditorProps {
  section: AdminSection;
  index: number;
  total: number;
  csrfToken: string;
  /** De maximale lengte per veld, zoals de server hem afdwingt. */
  limits: Record<string, number>;
  /** De toegestane waarden per keuzeveld, zoals de server ze afdwingt. */
  choices: Record<string, string[]>;
  /** Of deze sectie op dit moment in het voorbeeld aangewezen is. */
  isActive: boolean;
  /** Gemeld zodra de beheerder in deze sectie gaat werken. */
  onActivate: () => void;
  onChange: (section: AdminSection) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}

/**
 * Eén sectie bewerken.
 *
 * Welke velden er verschijnen hangt af van het type. De `switch` is uitputtend
 * over de union, dus komt er ooit een sectietype bij zonder tak hier, dan
 * meldt TypeScript dat — in plaats van dat de beheerder een leeg blok ziet.
 */
export function SectionEditor({
  section,
  index,
  total,
  csrfToken,
  limits,
  choices,
  isActive,
  onActivate,
  onChange,
  onRemove,
  onMove,
}: SectionEditorProps) {
  const fieldId = useId();

  return (
    <section
      id={sectionElementId(index)}
      className={`${styles.section} ${isActive ? styles.sectionActive : ''}`}
      /*
       * onFocus in plaats van onClick: focus vangt ook toetsenbordnavigatie,
       * en het is juist het veld waar je in werkt dat het voorbeeld moet
       * aanwijzen (§14).
       */
      onFocus={onActivate}
      onClick={onActivate}
    >
      <header className={styles.sectionHeader}>
        <span className={styles.sectionType}>
          {index + 1}. {SECTION_LABELS[section.type]}
        </span>

        <div className={styles.sectionTools}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => {
              onMove(-1);
            }}
            disabled={index === 0}
            aria-label={`Sectie ${String(index + 1)} omhoog`}
          >
            ↑
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => {
              onMove(1);
            }}
            disabled={index === total - 1}
            aria-label={`Sectie ${String(index + 1)} omlaag`}
          >
            ↓
          </button>
          <button
            type="button"
            className={styles.toolButton}
            onClick={onRemove}
            aria-label={`Sectie ${String(index + 1)} verwijderen`}
          >
            Verwijderen
          </button>
        </div>
      </header>

      {section._todo !== undefined && (
        <p className={`${styles.notice} ${styles.noticeTodo}`}>{section._todo}</p>
      )}

      <Fields
        section={section}
        fieldId={fieldId}
        csrfToken={csrfToken}
        limits={limits}
        choices={choices}
        onChange={onChange}
      />

      {/*
        Buiten de type-specifieke velden, want de achtergrond hoort bij elk
        type. Twee getinte vlakken onder elkaar lopen samen tot één groot vlak —
        het voorbeeld ernaast laat dat meteen zien.
      */}
      <Choice
        id={`${fieldId}-achtergrond`}
        label="Achtergrond"
        value={section.background}
        options={choices.background ?? []}
        labels={BACKGROUND_LABELS}
        onChange={(background) => {
          onChange({ ...section, background: background as SectionBackground });
        }}
      />
    </section>
  );
}

interface FieldsProps {
  section: AdminSection;
  fieldId: string;
  csrfToken: string;
  limits: Record<string, number>;
  choices: Record<string, string[]>;
  onChange: (section: AdminSection) => void;
}

function Fields({ section, fieldId, csrfToken, limits, choices, onChange }: FieldsProps) {
  switch (section.type) {
    case 'hero':
      return (
        <>
          <Field
            id={`${fieldId}-kicker`}
            label="Bovenkopje"
            maxLength={limits.kicker}
            value={section.kicker}
            onChange={(kicker) => {
              onChange({ ...section, kicker });
            }}
          />
          <Field
            id={`${fieldId}-heading`}
            label="Kop"
            maxLength={limits.heading}
            value={section.heading}
            onChange={(heading) => {
              onChange({ ...section, heading });
            }}
          />
          <Field
            id={`${fieldId}-text`}
            label="Tekst"
            maxLength={limits.text}
            value={section.text}
            onChange={(text) => {
              onChange({ ...section, text });
            }}
            multiline
          />
          <ImageField
            image={section.image}
            imageAlt={section.imageAlt}
            csrfToken={csrfToken}
            onChange={(image, imageAlt) => {
              onChange({ ...section, image, imageAlt });
            }}
          />

          <Choice
            id={`${fieldId}-layout`}
            label="Indeling"
            value={section.layout}
            options={choices.layout ?? []}
            labels={LAYOUT_LABELS}
            onChange={(layout) => {
              onChange({ ...section, layout: layout as HeroLayout });
            }}
          />

          {section.layout === 'banner' && (
            <Choice
              id={`${fieldId}-tekstkleur`}
              label="Kleur van de tekst op de foto"
              value={section.textColor}
              options={choices.textColor ?? []}
              labels={TEXT_COLOR_LABELS}
              onChange={(textColor) => {
                onChange({ ...section, textColor: textColor as HeroTextColor });
              }}
            />
          )}

          <ActionsEditor
            actions={section.actions}
            fieldId={fieldId}
            targets={choices.target ?? []}
            maxLength={limits.buttonLabel}
            onChange={(actions) => {
              onChange({ ...section, actions });
            }}
          />
        </>
      );

    case 'prose':
      return (
        <>
          <Field
            id={`${fieldId}-heading`}
            label="Kop"
            maxLength={limits.heading}
            value={section.heading}
            onChange={(heading) => {
              onChange({ ...section, heading });
            }}
          />
          <Field
            id={`${fieldId}-text`}
            label="Tekst"
            maxLength={limits.text}
            value={section.text}
            onChange={(text) => {
              onChange({ ...section, text });
            }}
            multiline
          />
          <ImageField
            image={section.image}
            imageAlt={section.imageAlt}
            csrfToken={csrfToken}
            onChange={(image, imageAlt) => {
              onChange({ ...section, image, imageAlt });
            }}
          />

          {section.image !== null && section.image !== '' && (
            <Choice
              id={`${fieldId}-beeldpositie`}
              label="Plaats van de foto"
              value={section.imagePosition}
              options={choices.imagePosition ?? []}
              labels={IMAGE_POSITION_LABELS}
              onChange={(imagePosition) => {
                onChange({ ...section, imagePosition: imagePosition as ImagePosition });
              }}
            />
          )}
        </>
      );

    case 'quote':
      return (
        <>
          <Field
            id={`${fieldId}-citaat`}
            label="Citaat"
            maxLength={limits.text}
            value={section.text}
            onChange={(text) => {
              onChange({ ...section, text });
            }}
            multiline
          />
          <Field
            id={`${fieldId}-toelichting`}
            label="Toelichting (korte zin eronder)"
            maxLength={limits.supportingText}
            value={section.supportingText}
            onChange={(supportingText) => {
              onChange({ ...section, supportingText });
            }}
            multiline
          />
          <QuoteImagesEditor
            images={section.images}
            fieldId={fieldId}
            csrfToken={csrfToken}
            onChange={(images) => {
              onChange({ ...section, images });
            }}
          />

          {section.images.length > 0 && (
            <Choice
              id={`${fieldId}-beeldpositie`}
              label="Plaats van de foto's"
              value={section.imagePosition}
              options={choices.imagePosition ?? []}
              labels={IMAGE_POSITION_LABELS}
              onChange={(imagePosition) => {
                onChange({ ...section, imagePosition: imagePosition as ImagePosition });
              }}
            />
          )}
        </>
      );

    case 'list':
      return (
        <>
          <Field
            id={`${fieldId}-heading`}
            label="Kop"
            maxLength={limits.heading}
            value={section.heading}
            onChange={(heading) => {
              onChange({ ...section, heading });
            }}
          />
          <Field
            id={`${fieldId}-intro`}
            label="Inleiding (mag leeg blijven)"
            maxLength={limits.intro}
            value={section.intro}
            onChange={(intro) => {
              onChange({ ...section, intro });
            }}
            multiline
          />
          <Choice
            id={`${fieldId}-weergave`}
            label="Weergave"
            value={section.variant}
            options={choices.variant ?? []}
            labels={VARIANT_LABELS}
            onChange={(variant) => {
              onChange({ ...section, variant: variant as ListVariant });
            }}
          />

          <ItemsEditor
            items={section.items}
            fieldId={fieldId}
            onChange={(items) => {
              onChange({ ...section, items });
            }}
          />
        </>
      );

    case 'cta':
      return (
        <>
          <Field
            id={`${fieldId}-heading`}
            label="Kop"
            maxLength={limits.heading}
            value={section.heading}
            onChange={(heading) => {
              onChange({ ...section, heading });
            }}
          />
          <Field
            id={`${fieldId}-text`}
            label="Tekst"
            value={section.text}
            onChange={(text) => {
              onChange({ ...section, text });
            }}
            multiline
          />
          <Field
            id={`${fieldId}-button`}
            label="Tekst op de knop"
            maxLength={limits.buttonLabel}
            value={section.buttonLabel}
            onChange={(buttonLabel) => {
              onChange({ ...section, buttonLabel });
            }}
          />
        </>
      );
  }
}

interface ActionsEditorProps {
  actions: HeroAction[];
  fieldId: string;
  targets: string[];
  maxLength?: number;
  onChange: (actions: HeroAction[]) => void;
}

/**
 * De knoppen onder de kop.
 *
 * De bestemming is een keuzemenu en geen tekstveld: de site heeft drie
 * pagina's, en een vrij in te vullen adres levert vooral typefouten op die
 * pas opvallen als een bezoeker op een dood pad uitkomt.
 */
function ActionsEditor({ actions, fieldId, targets, maxLength, onChange }: ActionsEditorProps) {
  function update(index: number, action: HeroAction): void {
    onChange(actions.map((existing, position) => (position === index ? action : existing)));
  }

  return (
    <>
      <ul className={styles.items}>
        {actions.map((action, index) => (
          // De index als sleutel mag hier, om dezelfde reden als bij de
          // lijstitems: knoppen hebben geen eigen identiteit.
          <li key={`${fieldId}-knop-${String(index)}`} className={styles.item}>
            <div className={styles.itemHeader}>
              <span>{index === 0 ? 'Knop 1 (opvallend)' : 'Knop 2 (rustig)'}</span>
              <button
                type="button"
                className={styles.toolButton}
                onClick={() => {
                  onChange(actions.filter((_action, position) => position !== index));
                }}
                aria-label={`Knop ${String(index + 1)} verwijderen`}
              >
                Verwijderen
              </button>
            </div>

            <Field
              id={`${fieldId}-knop-${String(index)}-label`}
              label="Tekst op de knop"
              maxLength={maxLength}
              value={action.label}
              onChange={(label) => {
                update(index, { ...action, label });
              }}
            />
            <Choice
              id={`${fieldId}-knop-${String(index)}-target`}
              label="Gaat naar"
              value={action.target}
              options={targets}
              labels={TARGET_LABELS}
              onChange={(target) => {
                update(index, { ...action, target: target as PageSlug });
              }}
            />
          </li>
        ))}
      </ul>

      {actions.length < MAX_ACTIONS && (
        <button
          type="button"
          className={styles.toolButton}
          onClick={() => {
            onChange([...actions, { label: '', target: 'contact' }]);
          }}
        >
          Knop toevoegen
        </button>
      )}
    </>
  );
}

interface ItemsEditorProps {
  items: ListItem[];
  fieldId: string;
  onChange: (items: ListItem[]) => void;
}

function ItemsEditor({ items, fieldId, onChange }: ItemsEditorProps) {
  function update(index: number, item: ListItem): void {
    onChange(items.map((existing, position) => (position === index ? item : existing)));
  }

  return (
    <>
      <ul className={styles.items}>
        {items.map((item, index) => (
          // De index als sleutel mag hier: items hebben geen eigen
          // identiteit, en de lijst wordt alleen aan het eind aangevuld of
          // op één plek ingekort.
          <li key={`${fieldId}-item-${String(index)}`} className={styles.item}>
            <div className={styles.itemHeader}>
              <span>Item {index + 1}</span>
              <button
                type="button"
                className={styles.toolButton}
                onClick={() => {
                  onChange(items.filter((_item, position) => position !== index));
                }}
                aria-label={`Item ${String(index + 1)} verwijderen`}
              >
                Verwijderen
              </button>
            </div>

            <Field
              id={`${fieldId}-item-${String(index)}-title`}
              label="Titel"
              value={item.title}
              onChange={(title) => {
                update(index, { ...item, title });
              }}
            />
            <Field
              id={`${fieldId}-item-${String(index)}-text`}
              label="Tekst"
              value={item.text}
              onChange={(text) => {
                update(index, { ...item, text });
              }}
              multiline
            />
          </li>
        ))}
      </ul>

      <button
        type="button"
        className={styles.toolButton}
        onClick={() => {
          onChange([...items, { title: '', text: '' }]);
        }}
      >
        Item toevoegen
      </button>
    </>
  );
}

interface QuoteImagesEditorProps {
  images: QuoteImage[];
  fieldId: string;
  csrfToken: string;
  onChange: (images: QuoteImage[]) => void;
}

/** De klant vroeg hier expliciet om een maximum van tien foto's per carrousel. */
const MAX_QUOTE_IMAGES = 10;

/**
 * De foto's van een citaatblok: één foto toont gewoon die ene foto, twee of
 * meer worden op de site een carrousel.
 *
 * Anders dan bij ImageField komt een foto hier pas in de lijst te staan zodra
 * de upload is geslaagd — een lege plek zou geen geldige waarde voor `image`
 * zijn (dat mag hier, anders dan bij een los afbeeldingsveld, nooit `null`
 * zijn: een ontbrekende foto laat je gewoon weg uit de lijst).
 */
function QuoteImagesEditor({ images, fieldId, csrfToken, onChange }: QuoteImagesEditorProps) {
  const { busy, upload } = useImageUpload(csrfToken);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd(file: File): Promise<void> {
    const path = await upload(file);

    if (path !== null) {
      onChange([...images, { image: path, imageAlt: '' }]);
    }

    if (inputRef.current !== null) {
      inputRef.current.value = '';
    }
  }

  function updateAlt(index: number, imageAlt: string): void {
    onChange(
      images.map((entry, position) => (position === index ? { ...entry, imageAlt } : entry)),
    );
  }

  return (
    <div>
      <ul className={styles.items}>
        {images.map((entry, index) => (
          // De index als sleutel mag hier: foto's hebben geen eigen
          // identiteit buiten hun plek in de lijst.
          <li key={`${fieldId}-foto-${String(index)}`} className={styles.item}>
            <div className={styles.itemHeader}>
              <span>Foto {index + 1}</span>
              <button
                type="button"
                className={styles.toolButton}
                onClick={() => {
                  onChange(images.filter((_entry, position) => position !== index));
                }}
                aria-label={`Foto ${String(index + 1)} verwijderen`}
              >
                Verwijderen
              </button>
            </div>

            <div className={styles.imagePreview}>
              {/* Leeg alt: dit is een voorbeeldweergave binnen het beheer, de
                  echte beschrijving staat in het veld eronder. */}
              <img src={entry.image} alt="" className={styles.thumbnail} />
              <span className={styles.imagePath}>{entry.image}</span>
            </div>

            <Field
              id={`${fieldId}-foto-${String(index)}-alt`}
              label="Beschrijving van de foto (verplicht)"
              value={entry.imageAlt}
              onChange={(imageAlt) => {
                updateAlt(index, imageAlt);
              }}
              error={
                entry.imageAlt.trim() === ''
                  ? 'Beschrijf kort wat er op de foto staat. Zonder beschrijving kan de pagina niet opgeslagen worden.'
                  : undefined
              }
            />
          </li>
        ))}
      </ul>

      {images.length < MAX_QUOTE_IMAGES && (
        <>
          <label className={styles.fileButton} htmlFor={`${fieldId}-nieuwe-foto`}>
            {busy ? 'Bezig met verkleinen…' : 'Foto toevoegen'}
          </label>
          <input
            ref={inputRef}
            id={`${fieldId}-nieuwe-foto`}
            className={styles.fileInput}
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(event) => {
              const chosen = event.target.files?.[0];

              if (chosen !== undefined) {
                void handleAdd(chosen);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
