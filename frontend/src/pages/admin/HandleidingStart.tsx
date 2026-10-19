import { ADMIN_PATH, SUPPORT_CONTACT } from '../../constants/admin';
import { SITE_ORIGIN } from '../../constants/site';
import { ManualSection, PartsTable, Tip, Warning } from './HandleidingParts';

/**
 * Het adres van het beheer, zoals het in de handleiding staat: zonder
 * `https://`, want zo typt de beheerder het in.
 */
const ADMIN_ADDRESS = `${SITE_ORIGIN.replace(/^https:\/\//, '')}${ADMIN_PATH}`;

/**
 * Plaatsvervanger in de tabellen van hoofdstuk 3, zolang de pagina's nog geen
 * echte inhoud hebben.
 */
const TODO_BLOCK = '[TODO: wat dit blok op de website toont]';

/** Hoofdstuk 1 en 2: erin komen en wennen aan het scherm. */
export function ManualStart() {
  return (
    <>
      <ManualSection id="inloggen" title="1. Inloggen">
        <ol>
          <li>
            Open uw internetprogramma (Chrome, Edge, Safari…) en typ bovenin, in de lange balk waar
            het adres staat: <strong>{ADMIN_ADDRESS}</strong>. Druk daarna op Enter.
          </li>
          <li>
            Vul uw <strong>gebruikersnaam</strong> en <strong>wachtwoord</strong> in. Die heeft u
            los van deze handleiding van {SUPPORT_CONTACT} gekregen.
          </li>
          <li>
            Klik op <strong>Inloggen</strong>.
          </li>
        </ol>
        <Tip>
          Maak van dit adres een bladwijzer (favoriet), dan hoeft u het niet te onthouden. Het
          beheer staat niet als knop op de website: alleen wie het adres weet, komt op het
          inlogscherm.
        </Tip>
        <Warning>
          Typt u vijf keer een verkeerd wachtwoord, dan kunt u een kwartier lang niet inloggen. Dat
          is een beveiliging, het is dus niet kapot. Wacht even en probeer het daarna rustig
          opnieuw. Doet u ongeveer een half uur niets in het beheer, dan wordt u automatisch
          uitgelogd. Wat u toen nog niet had opgeslagen, bent u kwijt.
        </Warning>
        <p>
          Klaar met werken? Klik links onderaan op <strong>Uitloggen</strong>.
        </p>
      </ManualSection>

      <ManualSection id="scherm" title="2. Het scherm in één oogopslag">
        <p>Het scherm heeft drie delen:</p>
        <ul>
          <li>
            <strong>Links het menu.</strong> Hier kiest u welke pagina u wilt aanpassen: Home, Over
            ons, Contact, Privacyverklaring, Algemene voorwaarden, Bedrijfsgegevens, en deze
            handleiding. De pagina waar u nu op zit, heeft een gekleurd vlak.
          </li>
          <li>
            <strong>In het midden de vakken om te typen.</strong> Dit is waar u dingen aanpast.
            Onderaan staan de knoppen <strong>Opslaan</strong> en{' '}
            <strong>Vorige versie terugzetten</strong>.
          </li>
          <li>
            <strong>Rechts het Voorbeeld.</strong> Dat laat de pagina zien zoals bezoekers hem
            straks zien, ook met wat u nog niet heeft opgeslagen. Met <strong>Desktop</strong> en{' '}
            <strong>Mobiel</strong> boven het voorbeeld kijkt u hoe het eruitziet op een computer en
            op een telefoon.
          </li>
        </ul>
        <Tip>
          Op een kleiner scherm, zoals een tablet of telefoon, staan het bewerken en het voorbeeld
          niet naast elkaar. U wisselt dan tussen de twee tabbladen <strong>Bewerken</strong> en{' '}
          <strong>Voorbeeld</strong> bovenaan.
        </Tip>
      </ManualSection>

      <ManualSection id="onderdelen" title="3. Welk vak hoort bij welk stuk van de website?">
        <p>
          Elke pagina is opgebouwd uit blokken, van boven naar beneden, precies in dezelfde volgorde
          als op de website. In het beheer heeft elk blok een nummer en een naam, bijvoorbeeld
          &ldquo;2. Lijst met items&rdquo;.
        </p>
        <Tip>
          De snelste manier: <strong>klik in het Voorbeeld op het stuk dat u wilt aanpassen</strong>
          . Het bijbehorende vak links licht dan op en springt in beeld. Andersom werkt het ook:
          klikt u links in een vak, dan licht het stuk in het voorbeeld op.
        </Tip>
        <p>
          Hieronder staat per pagina wat bij wat hoort. Verplaatst u blokken, dan veranderen de
          nummers mee.
        </p>

        <h3>Home</h3>
        <PartsTable
          rows={[
            ['1. Kop van de pagina', TODO_BLOCK],
            ['2. Lijst met items (kaarten)', TODO_BLOCK],
            ['3. Lijst met items (stappen)', TODO_BLOCK],
            ['4. Blok met knop', TODO_BLOCK],
          ]}
        />

        <h3>Over ons</h3>
        <PartsTable
          rows={[
            ['1. Kop van de pagina', TODO_BLOCK],
            ['2. Tekstblok', TODO_BLOCK],
            ['3. Citaat', TODO_BLOCK],
            ['4. Lijst met items (tijdlijn)', TODO_BLOCK],
            ['5. Blok met knop', TODO_BLOCK],
          ]}
        />

        <h3>Contact</h3>
        <PartsTable
          rows={[
            ['1. Kop van de pagina', TODO_BLOCK],
            [
              '(het formulier)',
              'Staat direct onder blok 1. Dit kunt u hier niet aanpassen, zie hoofdstuk 9.',
            ],
            ['2. Tekstblok', TODO_BLOCK],
          ]}
        />

        <h3>Onderaan elke pagina</h3>
        <PartsTable
          rows={[
            [
              'Bedrijfsgegevens',
              'Naam, telefoonnummer, e-mailadres en werkgebied onderaan elke pagina',
            ],
            ['Privacyverklaring', 'De pagina waar het linkje onderaan elke pagina naartoe gaat'],
            ['Algemene voorwaarden', 'De pagina waar het tweede linkje onderaan naartoe gaat'],
          ]}
        />
      </ManualSection>
    </>
  );
}
