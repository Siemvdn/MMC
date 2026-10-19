import { Button } from '../../components/ui/Button';
import { ManualExtra } from './HandleidingExtra';
import { ManualStart } from './HandleidingStart';
import { ManualTasks } from './HandleidingTaken';
import styles from './Handleiding.module.css';

/** De hoofdstukken, voor de inhoudsopgave. De ankers staan in de hoofdstukken zelf. */
const CHAPTERS = [
  { id: 'inloggen', title: 'Inloggen' },
  { id: 'scherm', title: 'Het scherm in één oogopslag' },
  { id: 'onderdelen', title: 'Welk vak hoort bij welk stuk van de website?' },
  { id: 'tekst', title: 'Een tekst aanpassen' },
  { id: 'foto', title: 'Een foto toevoegen, vervangen of weghalen' },
  { id: 'blokken', title: 'Blokken verplaatsen, toevoegen of weghalen' },
  { id: 'terugzetten', title: 'Iets fout gedaan? Vorige versie terugzetten' },
  { id: 'gegevens', title: 'Bedrijfsgegevens en de twee juridische pagina’s' },
  { id: 'niet-aanpasbaar', title: 'Wat u hier niet kunt aanpassen' },
  { id: 'problemen', title: 'Als er iets misgaat' },
] as const;

/**
 * De handleiding voor de beheerder, in gewone taal.
 *
 * Staat op één plek en wordt twee keer gebruikt: als pagina in het beheer en,
 * via afdrukken, als PDF om te mailen. De teksten verwijzen naar de namen
 * zoals ze op het scherm staan; verandert er een knop of veldnaam in het
 * beheer, pas dan ook deze bestanden aan (CLAUDE.md §19).
 */
export function Handleiding() {
  return (
    <article className={styles.handleiding}>
      <header>
        <h1>Handleiding website-beheer</h1>
        <p className={styles.intro}>
          Zo past u zelf de teksten en foto&rsquo;s van uw website aan. U kunt niets kapotmaken: wat
          u wijzigt, komt pas op de website als u op <strong>Opslaan</strong> klikt, en u kunt
          altijd terug naar de vorige versie.
        </p>
        <div className={styles.print}>
          <Button
            variant="secondary"
            onClick={() => {
              window.print();
            }}
          >
            Afdrukken of bewaren als PDF
          </Button>
        </div>
      </header>

      <nav className={styles.contents} aria-label="Inhoud">
        <strong>Inhoud</strong>
        <ol>
          {CHAPTERS.map((chapter) => (
            <li key={chapter.id}>
              <a href={`#${chapter.id}`}>{chapter.title}</a>
            </li>
          ))}
        </ol>
      </nav>

      <ManualStart />
      <ManualTasks />
      <ManualExtra />
    </article>
  );
}
