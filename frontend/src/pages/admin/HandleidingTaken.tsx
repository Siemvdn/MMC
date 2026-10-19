import { ManualSection, Tip, Warning } from './HandleidingParts';

/** Hoofdstuk 4 tot en met 7: teksten, foto's, blokken en fouten herstellen. */
export function ManualTasks() {
  return (
    <>
      <ManualSection id="tekst" title="4. Een tekst aanpassen">
        <ol>
          <li>
            Kies links in het menu de pagina, bijvoorbeeld <strong>Over ons</strong>.
          </li>
          <li>
            Zoek het blok dat u wilt aanpassen (zie hoofdstuk 3), of klik op het stuk in het
            voorbeeld.
          </li>
          <li>
            Klik in het vak met de tekst en pas de tekst aan, net als in een brief of een mailtje.
          </li>
          <li>Kijk rechts in het voorbeeld of het er goed uitziet.</li>
          <li>
            Klik onderaan op de knop <strong>Opslaan</strong>. Pas dan staat het op de website. U
            ziet rechts onderin een groene melding: &ldquo;De wijzigingen zijn opgeslagen&rdquo;.
          </li>
        </ol>
        <Warning>
          Zonder op <strong>Opslaan</strong> te klikken gebeurt er op de website niets. Klik ook op{' '}
          <strong>Opslaan</strong> voordat u links naar een andere pagina gaat, anders is uw werk
          weg.
        </Warning>
        <Tip>
          Na het opslaan staat uw wijziging meteen op de website. Kijkt u op een andere browser-tab
          mee, ververs die dan met de toets F5.
        </Tip>
        <p>
          Onder sommige vakken staat een teller, bijvoorbeeld &ldquo;120 / 2000&rdquo;. Dat is het
          aantal tekens dat u gebruikt en het aantal dat is toegestaan. Wordt het getal rood, dan is
          de tekst te lang en kan hij niet worden opgeslagen. Kort hem dan wat in. Een Tekst-vak
          neemt ruim 2000 tekens, ongeveer 300 woorden.
        </p>
      </ManualSection>

      <ManualSection id="foto" title="5. Een foto toevoegen, vervangen of weghalen">
        <ol>
          <li>Ga naar het blok met de foto. Staat er al een foto, dan ziet u hem hier klein.</li>
          <li>
            Klik op <strong>Foto kiezen</strong> (of <strong>Vervangen</strong> als er al een foto
            staat) en kies de foto op uw computer. Toegestaan zijn JPG, PNG en WebP.
          </li>
          <li>
            Wacht even tot er <strong>Bezig met verkleinen…</strong> verdwenen is. De foto wordt
            vanzelf kleiner gemaakt zodat de website snel blijft. U hoeft zelf niets te verkleinen.
          </li>
          <li>
            Vul bij <strong>Beschrijving van de foto</strong> in één korte zin in wat er op de foto
            staat, bijvoorbeeld &ldquo;[TODO: voorbeeld van een fotobeschrijving]&rdquo;.
          </li>
          <li>
            Klik onderaan op <strong>Opslaan</strong>.
          </li>
        </ol>
        <p>
          Wilt u de foto weghalen? Klik op <strong>Verwijderen</strong> naast de foto en daarna op{' '}
          <strong>Opslaan</strong>.
        </p>
        <Warning>
          De beschrijving van de foto is verplicht. Die wordt voorgelezen aan mensen die slecht
          zien, en Google gebruikt hem ook. Zonder beschrijving kan de pagina niet worden
          opgeslagen. Gebruik bovendien alleen foto&rsquo;s die van uzelf zijn, of waarvan u zeker
          weet dat u ze op de site mag zetten.
        </Warning>
        <Tip>
          Een <strong>Citaat</strong>-blok kan meerdere foto&rsquo;s hebben, maximaal tien. Met één
          foto ziet de bezoeker die ene foto. Bij twee of meer foto&rsquo;s schuiven ze door als een
          fotoserie. Voeg ze toe met <strong>Foto toevoegen</strong>.
        </Tip>
      </ManualSection>

      <ManualSection id="blokken" title="6. Blokken verplaatsen, toevoegen of weghalen">
        <h3>Verplaatsen</h3>
        <p>
          Rechtsboven in elk blok staan twee pijltjes. Met <strong>↑</strong> gaat het blok een plek
          omhoog op de pagina, met <strong>↓</strong> een plek omlaag. Het voorbeeld rechts
          verandert direct mee.
        </p>

        <h3>Toevoegen</h3>
        <p>
          Onderaan de pagina staat <strong>Sectie toevoegen</strong>. Kies in het keuzemenu wat u
          wilt (<strong>Tekstblok</strong>, <strong>Citaat</strong> of{' '}
          <strong>Lijst met items</strong>) en klik op <strong>Toevoegen</strong>. Het nieuwe blok
          komt helemaal onderaan. Verplaats het met de pijltjes naar de juiste plek en vul het in.
        </p>
        <p>
          In een <strong>Lijst met items</strong> voegt u een regel toe met{' '}
          <strong>Item toevoegen</strong>. Elke regel heeft een titel en een tekst.
        </p>

        <h3>Weghalen</h3>
        <p>
          Klik rechtsboven in het blok op <strong>Verwijderen</strong>. Het blok verdwijnt uit het
          beheer, maar van de website pas als u op <strong>Opslaan</strong> klikt.
        </p>
        <Warning>
          Er komt geen vraag &ldquo;weet u het zeker?&rdquo;. Verwijdert u per ongeluk een blok? Ga
          dan niet naar een andere pagina en klik niet op Opslaan, maar herlaad de pagina met F5.
          Dan komt de laatst opgeslagen versie terug.
        </Warning>
        <Tip>
          De grote kop bovenaan elke pagina en het blok met de knop onderaan kunt u wel aanpassen of
          weghalen, maar niet opnieuw toevoegen. Verwijder ze dus alleen als u het zeker weet.
        </Tip>

        <h3>Uiterlijk van een blok</h3>
        <p>In veel blokken kunt u kiezen hoe iets eruitziet:</p>
        <ul>
          <li>
            <strong>Indeling</strong> (bovenaan de pagina): de foto naast de tekst, of een brede
            banner met de tekst over de foto. Bij de banner kiest u ook of de tekst donker of licht
            is. Kies de kleur die op de foto het best te lezen is.
          </li>
          <li>
            <strong>Weergave</strong> (bij een lijst): kaarten naast elkaar, genummerde stappen of
            een tijdlijn met bolletjes.
          </li>
          <li>
            <strong>Plaats van de foto</strong>: links of rechts van de tekst.
          </li>
          <li>
            <strong>Achtergrond</strong>: licht (de gewone achtergrond) of getint (een getint vlak
            over de volle breedte). Wissel ze af voor rust. Twee getinte vlakken direct onder elkaar
            lopen in elkaar over tot één groot vlak.
          </li>
          <li>
            <strong>Knop 1 en Knop 2</strong> (bovenaan een pagina): de tekst op de knop en waar hij
            naartoe gaat. Er kunnen er maximaal twee zijn. Knop 1 valt het meest op.
          </li>
        </ul>
      </ManualSection>

      <ManualSection id="terugzetten" title="7. Iets fout gedaan? Vorige versie terugzetten">
        <p>Elke keer dat u opslaat, onthoudt de website de versie van daarvoor. Wilt u terug?</p>
        <ol>
          <li>Ga naar de pagina waar u iets op hebt gewijzigd.</li>
          <li>
            Klik onderaan op <strong>Vorige versie terugzetten</strong>.
          </li>
        </ol>
        <Warning>
          Dit zet de pagina meteen terug, ook op de website. Het werkt maar één stap: de versie van
          vlak voor de laatste keer opslaan. U kunt dus niet drie keer terug. Het geldt ook per
          pagina; de Home-pagina terugzetten heeft geen invloed op Over ons. Klikt u nog een keer,
          dan komt de nieuwere versie weer terug. Is de knop grijs, dan is er (nog) geen vorige
          versie.
        </Warning>
      </ManualSection>
    </>
  );
}
