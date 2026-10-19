# Design tokens

## Uitgangspunt

Het design is warm en ambachtelijk, met hout als basis: linnen en licht
eiken als ondergrond, walnoot voor tekst en de voettekst, mosgroen als
accent. Koppen in Young Serif, lopende tekst in Instrument Sans. Het is
goedgekeurd aan de hand van een mockup (CLAUDE.md §2, Vormgeving).

Het uiterlijk ligt op precies één plek vast:

| Bestand      | Inhoud                                                                |
| ------------ | --------------------------------------------------------------------- |
| `tokens.css` | alle design tokens: kleuren, fonts, groottes, ruimte, vorm, schaduwen |
| `fonts.css`  | de `@font-face`-regels van de zelf gehoste webfonts                   |
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

## Wat er in het design staat

- **Kleur:** linnen (`--linen-*`) en eiken (`--oak-*`) als ondergrond en
  lijnen, walnoot (`--walnut-*`) voor tekst en de voettekst, mosgroen
  (`--moss-*`) voor knoppen, links en accenten. Honingkleurig eiken
  (`--oak-500`) is alleen decoratief: te licht voor tekst. Rood en groen
  blijven voor fout- en succesmeldingen; de tekst van een melding zegt
  altijd óók wat er aan de hand is (§14).
- **Typografie:** Young Serif voor koppen, Instrument Sans voor lopende
  tekst en de interface, allebei zelf gehost vanuit `src/assets/fonts/`.
  Young Serif bestaat alleen in één gewicht en zonder cursief; daarom staat
  `--font-weight-heading` op 400 en is het citaat niet schuingedrukt.
- **Vorm:** kleine hoekradius op knoppen, velden en foto's; wat altijd rond
  is (bolletjes, labels) gebruikt `--radius-pill`. Foto's in kaarten hebben
  een vaste verhouding (`--ratio-*`), zodat een raster recht blijft.
