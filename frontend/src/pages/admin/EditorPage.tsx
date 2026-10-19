import { useCallback, useEffect, useId, useState } from 'react';

import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { StatusMessage } from '../../components/ui/StatusMessage';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { useWideScreen } from '../../hooks/useWideScreen';
import { ApiError } from '../../services/apiClient';
import { fetchContent, restoreContent, saveContent } from '../../services/adminApi';
import {
  isPageContent,
  type AdminContent,
  type AdminPageContent,
  type AdminSection,
  type AdminSiteContent,
} from '../../types/adminContent';
import { Handleiding } from './Handleiding';
import { PreviewPane } from './PreviewPane';
import { companionOf, previewFor } from './previewContent';
import { SectionEditor } from './SectionEditor';
import {
  ADDABLE_SECTION_TYPES,
  SECTION_LABELS,
  addSection,
  moveSection,
  removeSection,
  replaceSection,
  sectionElementId,
  type AddableSectionType,
} from './sectionTools';
import styles from './EditorPage.module.css';

/** De sleutel van de handleiding in de zijbalk. Geen content-bestand, dus apart gehouden. */
const MANUAL_PAGE = 'handleiding';

/** Wat er in de zijbalk staat, en welk bestand daarbij hoort. */
const DOCUMENTS = [
  { page: 'home', label: 'Home' },
  { page: 'over-ons', label: 'Over ons' },
  { page: 'contact', label: 'Contact' },
  { page: 'privacy', label: 'Privacyverklaring' },
  { page: 'terms', label: 'Algemene voorwaarden' },
  { page: 'site', label: 'Bedrijfsgegevens' },
] as const;

export interface EditorPageProps {
  username: string;
  csrfToken: string;
  onLoggedOut: () => void;
  onLogout: () => void;
}

export function EditorPage({ username, csrfToken, onLogout }: EditorPageProps) {
  const [page, setPage] = useState<string>('home');

  return (
    <div className={styles.layout}>
      <nav className={styles.sidebar} aria-label="Beheer">
        <span className={styles.brand}>Beheer</span>

        <div className={styles.menu}>
          {DOCUMENTS.map((document) => (
            <button
              key={document.page}
              type="button"
              className={`${styles.menuButton} ${
                document.page === page ? styles.menuButtonActive : ''
              }`}
              aria-current={document.page === page ? 'page' : undefined}
              onClick={() => {
                setPage(document.page);
              }}
            >
              {document.label}
            </button>
          ))}

          <button
            type="button"
            className={`${styles.menuButton} ${styles.menuButtonManual} ${
              page === MANUAL_PAGE ? styles.menuButtonActive : ''
            }`}
            aria-current={page === MANUAL_PAGE ? 'page' : undefined}
            onClick={() => {
              setPage(MANUAL_PAGE);
            }}
          >
            Handleiding
          </button>
        </div>

        <div className={styles.sidebarFooter}>
          <span>Ingelogd als {username}</span>
          <Button variant="secondary" onClick={onLogout}>
            Uitloggen
          </Button>
        </div>
      </nav>

      {/* De sleutel zorgt dat het formulier opnieuw opgebouwd wordt bij het
          wisselen van pagina, in plaats van dat er bewerkingen van de vorige
          pagina blijven staan. */}
      {page === MANUAL_PAGE ? (
        <main className={styles.content}>
          <Handleiding />
        </main>
      ) : (
        <DocumentEditor key={page} page={page} csrfToken={csrfToken} />
      )}
    </div>
  );
}

interface DocumentEditorProps {
  page: string;
  csrfToken: string;
}

function DocumentEditor({ page, csrfToken }: DocumentEditorProps) {
  const load = useCallback((signal: AbortSignal) => fetchContent(page, signal), [page]);
  const { state, retry } = useFetch(load);

  const [draft, setDraft] = useState<AdminContent | null>(null);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [choices, setChoices] = useState<Record<string, string[]>>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { showError, showSuccess } = useToast();

  /*
   * De sectie die op dit moment bewerkt wordt. Het voorbeeld licht hem op, en
   * andersom zet een klik in het voorbeeld hem hier — zo wijzen de twee
   * panelen elkaar aan.
   */
  const [active, setActive] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const isWide = useWideScreen();

  // Het tweede document dat het voorbeeld nodig heeft: bij een pagina is dat
  // site.json voor kop en voettekst, bij Bedrijfsgegevens juist home.json.
  const companionPage = companionOf(page);
  const loadCompanion = useCallback(
    (signal: AbortSignal) => fetchContent(companionPage, signal),
    [companionPage],
  );
  const companion = useFetch(loadCompanion);

  // Zodra de content binnen is, wordt hij het uitgangspunt om te bewerken.
  useEffect(() => {
    if (state.status === 'success') {
      setDraft(state.data.content);
      setHasPrevious(state.data.hasPreviousVersion);
      setLimits(state.data.limits);
      setChoices(state.data.choices);
    }
  }, [state]);

  if (state.status === 'error') {
    return (
      <div className={styles.content}>
        <StatusMessage
          heading="Laden is niet gelukt"
          text={state.error}
          onRetry={retry}
          urgency="assertive"
        />
      </div>
    );
  }

  if (draft === null) {
    return (
      <div className={styles.content}>
        <StatusMessage heading="Even geduld" text="De inhoud wordt geladen." />
      </div>
    );
  }

  /**
   * Toont wat er misging als melding rechtsonder.
   *
   * Die stond eerst bovenaan de editor, en dat werkte niet: wie onderin een
   * lange pagina aan het werk is, ziet daar niets van en denkt dat het gelukt
   * is. Bij een validatiefout komen de losse punten mee, zodat meteen duidelijk
   * is wélk veld het is.
   */
  function handleFailure(cause: unknown): void {
    if (cause instanceof ApiError) {
      const details = cause.details?.errors;

      showError(cause.message, Array.isArray(details) ? details.map(String) : undefined);

      return;
    }

    showError('Opslaan is niet gelukt. Probeer het opnieuw.');
  }

  async function handleSave(): Promise<void> {
    if (draft === null) {
      return;
    }

    setBusy(true);

    try {
      const response = await saveContent(page, draft, csrfToken);
      setDraft(response.content);
      setHasPrevious(response.hasPreviousVersion);
      setSavedAt(new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }));
      showSuccess('De wijzigingen zijn opgeslagen.');
    } catch (cause: unknown) {
      handleFailure(cause);
    } finally {
      setBusy(false);
    }
  }

  async function handleRestore(): Promise<void> {
    setBusy(true);

    try {
      const response = await restoreContent(page, csrfToken);
      setDraft(response.content);
      setHasPrevious(response.hasPreviousVersion);
      setSavedAt(null);
      showSuccess('De vorige versie is teruggezet.');
    } catch (cause: unknown) {
      handleFailure(cause);
    } finally {
      setBusy(false);
    }
  }

  const preview = previewFor(
    page,
    draft,
    companion.state.status === 'success' ? companion.state.data.content : null,
  );

  function focusSection(index: number): void {
    setActive(index);
    document.getElementById(sectionElementId(index))?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  const label = DOCUMENTS.find((document) => document.page === page)?.label ?? page;
  const previewVisible = showPreview && preview !== null;

  /*
   * Op een breed scherm staan bewerken en voorbeeld naast elkaar. Daaronder
   * zou dat allebei onbruikbaar smal worden, dus daar wordt het een keuze
   * tussen de twee.
   */
  const editorVisible = isWide || !previewVisible;

  return (
    <div className={`${styles.workspace} ${previewVisible && isWide ? '' : styles.workspaceSolo}`}>
      {!isWide && preview !== null && (
        <div className={styles.tabs} role="tablist" aria-label="Bewerken of voorbeeld">
          <button
            type="button"
            role="tab"
            className={`${styles.tab} ${showPreview ? '' : styles.tabActive}`}
            aria-selected={!showPreview}
            onClick={() => {
              setShowPreview(false);
            }}
          >
            Bewerken
          </button>
          <button
            type="button"
            role="tab"
            className={`${styles.tab} ${showPreview ? styles.tabActive : ''}`}
            aria-selected={showPreview}
            onClick={() => {
              setShowPreview(true);
            }}
          >
            Voorbeeld
          </button>
        </div>
      )}

      {editorVisible && (
        <div className={styles.editorColumn}>
          <header className={styles.header}>
            <h1 className={styles.title}>{label} bewerken</h1>

            <div className={styles.viewSwitch}>
              {savedAt !== null && <span className={styles.saved}>Opgeslagen om {savedAt}</span>}
              {isWide && preview !== null && (
                <button
                  type="button"
                  className={styles.toolButton}
                  aria-pressed={showPreview}
                  onClick={() => {
                    setShowPreview((visible) => !visible);
                  }}
                >
                  {showPreview ? 'Voorbeeld verbergen' : 'Voorbeeld tonen'}
                </button>
              )}
            </div>
          </header>

          <OpenPoints points={draft._todo} />

          {isPageContent(draft) ? (
            <PageFields
              content={draft}
              csrfToken={csrfToken}
              limits={limits}
              choices={choices}
              active={active}
              onActivate={setActive}
              onChange={setDraft}
            />
          ) : (
            <SiteFields content={draft} onChange={setDraft} />
          )}

          <div className={styles.actions}>
            <Button
              disabled={busy}
              onClick={() => {
                void handleSave();
              }}
            >
              {busy ? 'Bezig…' : 'Opslaan'}
            </Button>

            <Button
              variant="secondary"
              disabled={busy || !hasPrevious}
              onClick={() => {
                void handleRestore();
              }}
            >
              Vorige versie terugzetten
            </Button>
          </div>
        </div>
      )}

      {previewVisible && (
        <div className={styles.previewColumn}>
          <PreviewPane
            slug={preview.slug}
            sections={preview.sections}
            site={preview.site}
            highlight={active}
            onSelect={focusSection}
          />
        </div>
      )}
    </div>
  );
}

/**
 * De openstaande punten uit het contentbestand.
 *
 * Deze staan er om te lezen, niet om te bewerken: het zijn aantekeningen over
 * wat de klant nog moet aanleveren. Ze komen nooit op de publieke site — de
 * server haalt ze eruit vóór verzending.
 */
function OpenPoints({ points }: { points?: string[] }) {
  if (points === undefined || points.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.notice} ${styles.noticeTodo}`}>
      Nog openstaand:
      <ul className={styles.errorList}>
        {points.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>
    </div>
  );
}

interface PageFieldsProps {
  content: AdminPageContent;
  csrfToken: string;
  limits: Record<string, number>;
  choices: Record<string, string[]>;
  active: number | null;
  onActivate: (index: number | null) => void;
  onChange: (content: AdminContent) => void;
}

function PageFields({
  content,
  csrfToken,
  limits,
  choices,
  active,
  onActivate,
  onChange,
}: PageFieldsProps) {
  const [newType, setNewType] = useState<AddableSectionType>('prose');
  const selectId = useId();

  function updateSections(sections: AdminSection[]): void {
    onChange({ ...content, sections });
  }

  return (
    <>
      {content.sections.map((section, index) => (
        <SectionEditor
          key={`${section.type}-${String(index)}`}
          section={section}
          index={index}
          total={content.sections.length}
          csrfToken={csrfToken}
          limits={limits}
          choices={choices}
          isActive={active === index}
          onActivate={() => {
            onActivate(index);
          }}
          onChange={(updated) => {
            updateSections(replaceSection(content.sections, index, updated));
          }}
          onRemove={() => {
            updateSections(removeSection(content.sections, index));
          }}
          onMove={(direction) => {
            updateSections(moveSection(content.sections, index, direction));
          }}
        />
      ))}

      <div className={styles.addRow}>
        <label htmlFor={selectId}>Sectie toevoegen:</label>
        <select
          id={selectId}
          className={styles.select}
          value={newType}
          onChange={(event) => {
            setNewType(event.target.value as AddableSectionType);
          }}
        >
          {ADDABLE_SECTION_TYPES.map((type) => (
            <option key={type} value={type}>
              {SECTION_LABELS[type]}
            </option>
          ))}
        </select>
        <Button
          variant="secondary"
          onClick={() => {
            updateSections(addSection(content.sections, newType));
          }}
        >
          Toevoegen
        </Button>
      </div>
    </>
  );
}

interface SiteFieldsProps {
  content: AdminSiteContent;
  onChange: (content: AdminContent) => void;
}

/**
 * De gegevens die op élke pagina terugkomen.
 *
 * Deze moeten letterlijk gelijk zijn aan het Google Business Profile (§12);
 * dat staat er als waarschuwing bij, want een afwijking hier is niet zichtbaar
 * maar wel schadelijk voor de vindbaarheid.
 */
function SiteFields({ content, onChange }: SiteFieldsProps) {
  const fieldId = useId();

  function updateContact(field: 'phone' | 'email' | 'area', value: string): void {
    onChange({ ...content, contact: { ...content.contact, [field]: value } });
  }

  return (
    <section className={styles.section}>
      <p className={`${styles.notice} ${styles.noticeTodo}`}>
        Deze gegevens staan onderaan elke pagina. Houd ze precies gelijk aan wat er in uw
        Google-bedrijfsprofiel staat — verschillen daartussen maken uw bedrijf slechter vindbaar.
      </p>

      <Field
        id={`${fieldId}-naam`}
        label="Bedrijfsnaam"
        value={content.businessName}
        onChange={(businessName) => {
          onChange({ ...content, businessName });
        }}
      />
      <Field
        id={`${fieldId}-telefoon`}
        label="Telefoonnummer"
        value={content.contact.phone}
        onChange={(value) => {
          updateContact('phone', value);
        }}
      />
      <Field
        id={`${fieldId}-email`}
        label="E-mailadres"
        type="email"
        value={content.contact.email}
        onChange={(value) => {
          updateContact('email', value);
        }}
      />
      <Field
        id={`${fieldId}-werkgebied`}
        label="Werkgebied"
        value={content.contact.area}
        onChange={(value) => {
          updateContact('area', value);
        }}
      />
    </section>
  );
}
