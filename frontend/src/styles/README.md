# Design tokens

## Uitgangspunt

Deze starter heeft **bewust geen design**. `tokens.css` bevat een neutrale
basis — grijstinten en het systeemfont — zodat de site werkt, toegankelijk
is en er rustig uitziet tot het echte design er is.

Het uiterlijk ligt op precies één plek vast:

| Bestand      | Inhoud                                                                |
| ------------ | --------------------------------------------------------------------- |
| `tokens.css` | alle design tokens: kleuren, fonts, groottes, ruimte, vorm, schaduwen |
| `global.css` | reset, basistypografie, link- en focusgedrag (leest alleen tokens)    |

De `.module.css`-bestanden naast de componenten bevatten de opbouw (grid,
breekpunten, het hamburgermenu, de carrousel, de editor) en verwijzen voor
alles wat met uiterlijk te maken heeft naar een token.

## Hoe je ze gebruikt

Importeer `styles/global.css` één keer, in de applicatie-entry (dat doet
`mountPage.tsx` al). Dat bestand haalt `tokens.css` binnen. Gebruik daarna
uitsluitend de `var(--...)`-namen.

```css
/* goed */
padding: var(--space-6) var(--layout-gutter);
color: var(--color-text-prose);

/* fout — CLAUDE.md §4: geen magic numbers, geen losse hex-codes */
padding: 24px 32px;
color: #333333;
```

Kleur-tokens bestaan in twee lagen. Componenten gebruiken de **semantische**
laag (`--color-text-prose`, `--color-action-bg`, `--color-error-text`), nooit
de primitieven (`--grey-800`, `--red-700`). Die primitieven worden alleen
binnen `tokens.css` zelf gebruikt.

## Een nieuw design erin zetten

1. Vervang de primitieven in `tokens.css` door het nieuwe palet, en vul de
   semantische rollen daarmee opnieuw in. Een rol die het design niet kent,
   wijst gewoon naar een bestaande kleur.
2. Wijzig de fonts in `--font-heading` en `--font-body`. Een webfont wordt
   **zelf gehost** vanuit `src/assets/fonts/`, niet via een externe dienst:
   geen verbinding met een derde partij zonder toestemming (§15) en geen
   render-blocking verzoek naar een andere host (§12). De `@font-face`-regels
   komen bovenaan `tokens.css` of in een eigen bestand dat `global.css`
   importeert; leg de licentie naast de fontbestanden.
3. Pas groottes, ruimte, radius en schaduwen aan.
4. **Controleer het contrast opnieuw** (§14, WCAG AA: 4,5:1 voor gewone
   tekst, 3:1 voor grote tekst en interface-elementen). De huidige waarden
   staan als commentaar bij de teksttokens. Let in het bijzonder op:
   - `--color-action-text` op `--color-action-bg` (knoptekst);
   - `--color-step-text` op `--color-step-bg` (het cijfer in een stap);
   - `--color-text-muted` op zowel `--color-page-bg` als
     `--color-section-bg`;
   - de statuskleuren (`--color-error-*`, `--color-success-*`).
5. Ziet een component er daarna nog niet goed uit, pas dan pas zijn
   `.module.css` aan — en voeg daar geen kleur of font toe, maar een token.

## Wat er in de neutrale basis staat

- **Kleur:** een grijsschaal van wit tot bijna zwart. De enige echte kleuren
  zijn rood en groen voor fout- en succesmeldingen: die hebben een functie,
  geen merk. De tekst van een melding zegt altijd óók wat er aan de hand is,
  dus kleur is nooit de enige drager (§14).
- **Typografie:** het systeemfont voor koppen en lopende tekst.
- **Vorm:** kleine hoekradius op knoppen en velden (`--radius-control`); wat
  altijd rond is (bolletjes, cijferschijven) gebruikt `--radius-pill`.
