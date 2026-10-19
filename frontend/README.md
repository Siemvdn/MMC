# Frontend

React 18 + TypeScript, gebouwd met Vite. De output is een map statische
bestanden die via SFTP naar de shared hosting gaat (CLAUDE.md §18).

## Stylingsysteem: CSS Modules

Vastgelegde keuze — **CSS Modules, geen Tailwind**, en de twee worden niet
gemengd (§3).

De doorslag gaf de vorm van de design tokens: die zijn een
CSS-variabelensysteem. Met Tailwind zou dezelfde schaal een tweede keer in
een theme-config moeten staan: twee bronnen van waarheid voor één palet,
precies wat §4 wil voorkomen. Daar komt bij:

- Een component (knop, kaart, invoerveld) is een afgebakend geheel, geen
  verzameling losse utilities. Eén `.module.css` naast het component sluit
  daarop aan.
- CSS Modules zit in Vite ingebakken: nul extra dependencies. Tailwind
  voegt een package plus buildplugin toe, en §3 vraagt om de eenvoudigste
  oplossing die aan de eisen voldoet.

Praktisch: elk component dat stijl nodig heeft krijgt een `Naam.module.css`
ernaast. Daarin uitsluitend `var(--...)`-tokens uit
`src/styles/tokens.css` — geen losse hex-codes of fonts (§4). Zie
`src/styles/README.md` voor hoe je er later een design in zet.

## Routing: losse HTML-pagina's

Vastgelegde keuze — **Vite multi-page build, geen router-library**.

Elke publieke pagina is een eigen HTML-ingang (`index.html`,
`over-ons.html`, `contact.html`, `privacyverklaring.html`,
`algemene-voorwaarden.html`). Elk daarvan draagt zijn eigen `<title>` en
`meta description` in de HTML zelf, waar een crawler ze zonder JavaScript
leest — dat is precies wat §12 vraagt. Een SPA-router zou die titels naar
runtime-JavaScript verplaatsen en bovendien een `.htaccess`-rewrite nodig
hebben, anders geeft `/over-ons` bij direct openen een 404.

Daarnaast zijn er drie ingangen die niet in `ROUTES` staan en dus niet in de
navigatie of de sitemap: `admin.html` (het beheer), `preview.html` (het
voorbeeldvenster in het beheer) en `404.html`.

De prijs is een volledige herlaadbeurt bij het wisselen van pagina. Bij een
handvol pagina's op een gedeelde, gecachete CSS-bundel is dat nauwelijks
merkbaar — en het scheelt een dependency (§3, §4).

## Commando's

| Commando            | Doet                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- |
| `npm run dev`       | dev-server op http://localhost:5173, met `/api` doorgestuurd naar de PHP-server op poort 8123 |
| `npm run build`     | type-check plus productiebundel in `dist/`                                                    |
| `npm run preview`   | serveert `dist/` lokaal, om de build te controleren vóór deploy                               |
| `npm run typecheck` | alleen de TypeScript-controle                                                                 |
| `npm run lint`      | ESLint                                                                                        |
| `npm run format`    | Prettier over de hele map                                                                     |
| `npm test`          | Vitest, één keer (`npm run test:watch` blijft meekijken)                                      |

De poort van de backend staat in `vite.config.ts` (`BACKEND_DEV_ORIGIN`).

## Tests

Vitest met jsdom en React Testing Library. Het zwaartepunt ligt op de
validatie van het contactformulier, wat §16 aanwijst als de plek waar een
test het meeste oplevert: het is de enige logica in de frontend waar een
fout een bezoeker daadwerkelijk tegenhoudt.

De tests zoeken velden op via hun **label**, niet via een test-id. Dat is
opzet: het is meteen een controle dat elk veld een gekoppeld label heeft, wat
§14 verplicht stelt. Raakt die koppeling stuk, dan valt de test om.

## Mappen

Volgt §5. De lege mappen bevatten een `.gitkeep` zodat de structuur in Git
staat voordat er bestanden in komen.

```
public/          robots.txt, sitemap.xml, llms.txt, favicon/  (domein en favicon nog [TODO])
src/
├── assets/      afbeeldingen en eventuele webfonts (nu leeg)
├── components/
│   ├── ui/        generiek en herbruikbaar: Button, Field, Carousel, Toast, …
│   └── features/  samengesteld: ContactForm, PageSections, PublicPageBody
├── layouts/     Header, Footer, PageLayout
├── pages/       route-niveau componenten, plus admin/ voor het beheer
├── hooks/       eigen hooks, o.a. useFetch, useSession, useImageUpload
├── services/    API-communicatie per resource
├── types/       gedeelde TypeScript-types
├── constants/   routes, siteconfiguratie (site.ts), enums
├── utils/       pure helpers zonder side effects
└── styles/      tokens.css (het design) en global.css (reset en basis)
```

## Aandachtspunten

**TypeScript staat strenger dan §7 vraagt.** Naast `strict: true` staan
`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` en
`noUncheckedIndexedAccess` aan. Die laatste dwingt af dat je `sections[0]`
behandelt als "mogelijk afwezig" — nuttig bij content die uit een JSON-
bestand komt en van vorm kan veranderen.

**Node-versie.** Vite staat op 6 en jsdom op 25. De nieuwere majors eisen
Node 20.19 of hoger; op Node 20.17 breken ze de build of de tests. Upgrade
die twee pas na een Node-upgrade, en vraag eerst toestemming (CLAUDE.md §20).

**Fonts worden nooit ge-inlined.** `assetsInlineLimit` in `vite.config.ts`
sluit `.woff2` uit. Komt er een zelf gehost webfont bij, dan blijft daardoor
de `unicode-range`-besparing van een subset behouden in plaats van dat Vite
het als base64 in de CSS bakt.
