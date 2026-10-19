import { SUPPORT_CONTACT } from '../../constants/admin';
import { ManualSection, Tip, Warning } from './HandleidingParts';

/** Hoofdstuk 8 tot en met 10: gegevens, wat niet kan, en als er iets misgaat. */
export function ManualExtra() {
  return (
    <>
      <ManualSection id="gegevens" title="8. Bedrijfsgegevens en de twee juridische pagina’s">
        <h3>Bedrijfsgegevens</h3>
        <p>
          Onder <strong>Bedrijfsgegevens</strong> in het menu past u uw bedrijfsnaam,
          telefoonnummer, e-mailadres en werkgebied aan. Deze staan onderaan elke pagina van de
          website. Ook hier geldt: klik op <strong>Opslaan</strong>.
        </p>
        <Warning>
          Houd deze gegevens <strong>precies gelijk</strong> aan wat in uw Google-bedrijfsprofiel
          staat, met dezelfde schrijfwijze. Als ze verschillen, vindt Google uw bedrijf slechter.
          Het e-mailadres hier is alleen wat bezoekers onderaan de pagina lezen. Het bepaalt{' '}
          <strong>niet</strong> naar welk adres de berichten uit het contactformulier gaan. Wilt u
          dat die ergens anders heen komen, vraag dat dan aan {SUPPORT_CONTACT}. Wijzigt u naam,
          telefoonnummer, e-mailadres of werkgebied? Laat het {SUPPORT_CONTACT} dan weten, want
          Google leest deze gegevens ook uit een apart stukje dat bijgewerkt moet worden.
        </Warning>

        <h3>Privacyverklaring en Algemene voorwaarden</h3>
        <p>
          Dit zijn teksten met afspraken en wettelijke informatie voor uw klanten. U kunt ze op
          dezelfde manier aanpassen als de andere pagina&rsquo;s, maar doe dat alleen als u zeker
          weet wat u verandert, en vraag bij twijfel eerst {SUPPORT_CONTACT}.
        </p>
      </ManualSection>

      <ManualSection id="niet-aanpasbaar" title="9. Wat u hier niet kunt aanpassen">
        <p>
          Sommige dingen zitten in de opbouw van de website en staan niet in het beheer. Wilt u daar
          iets aan veranderen, vraag het dan aan {SUPPORT_CONTACT}:
        </p>
        <ul>
          <li>
            De menubalk bovenaan (Home, Over ons en de knop rechtsboven) en uw naam in de kop.
          </li>
          <li>
            Het contactformulier zelf: welke vragen het stelt en naar welk e-mailadres de berichten
            gaan.
          </li>
          <li>
            De titel die in het tabblad van de browser staat en de tekst die Google onder uw naam
            toont.
          </li>
          <li>Het logo in het tabblad van de browser, de kleuren en de lettertypes.</li>
          <li>Uw wachtwoord.</li>
        </ul>
      </ManualSection>

      <ManualSection id="problemen" title="10. Als er iets misgaat">
        <ul>
          <li>
            <strong>&ldquo;Inloggen lukte niet&rdquo;</strong>: controleer uw gebruikersnaam en
            wachtwoord (let op hoofdletters). Het systeem zegt bewust niet welke van de twee fout
            is. Na vijf mislukte pogingen even een kwartier wachten.
          </li>
          <li>
            <strong>Er verschijnt een rode melding bij het opslaan</strong>: lees wat erin staat.
            Meestal is een tekst te lang, of mist de beschrijving bij een foto. Los dat op en klik
            opnieuw op <strong>Opslaan</strong>.
          </li>
          <li>
            <strong>&ldquo;Opslaan is niet gelukt&rdquo;</strong>: controleer uw internetverbinding
            en probeer het over een minuutje opnieuw.
          </li>
          <li>
            <strong>Het inlogscherm staat ineens weer in beeld</strong>: u was langer dan een half
            uur niet actief. Log opnieuw in. Wat u nog niet had opgeslagen, is weg.
          </li>
          <li>
            <strong>Het ziet er anders uit dan u wilde</strong>: gebruik{' '}
            <strong>Vorige versie terugzetten</strong> (hoofdstuk 7).
          </li>
        </ul>
        <Tip>
          Werkt u aan een lange tekst? Klik tussendoor op <strong>Opslaan</strong>. Dat kan zonder
          risico: u kunt altijd nog bijwerken. Komt u er niet uit, loopt u vast of staat er iets op
          het scherm wat u niet begrijpt? Maak er een foto of schermafbeelding van en stuur die naar
          {SUPPORT_CONTACT}. Dan wordt er meegekeken.
        </Tip>
      </ManualSection>
    </>
  );
}
