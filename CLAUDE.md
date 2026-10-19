# CLAUDE.md — Projectinstructies

Dit bestand wordt bij elke prompt gelezen. Het legt vast hoe code in dit project geschreven wordt, welke stack we gebruiken, en welke beveiligings- en SEO-eisen altijd gelden. Wijk hier niet vanaf zonder dit expliciet te bespreken en dit bestand bij te werken.

> **Status: merkloze starter.** De functionele basis (pagina's, PHP-API, Repository-laag, admin panel, CMS) staat en is getest. Design en klantcontent ontbreken nog bewust: overal waar die horen staat `[TODO: …]`. Zoek ze op met `grep -rn "TODO" --exclude-dir=node_modules .`.

---

## 1. Projectcontext

- **Wat**: marketingwebsite met 3 pagina's in de hoofdnavigatie — **Home**, **Over ons**, **Contact** — voor **Meubelmakers Collectief Zeist**, plus een beveiligd admin-gedeelte waarmee de klant zelf teksten en foto's op deze pagina's kan aanpassen. Geen boekingssysteem, geen bezoekersaccounts, geen betalingen — puur een beheerbare presentatiewebsite. Daarnaast zijn er CMS-bewerkbare pagina's die bewust buiten de hoofdnavigatie staan en alleen via de footer bereikbaar zijn: de privacyverklaring (§15) en de algemene voorwaarden.
- **Wie de klant is**: [TODO: korte omschrijving van het collectief — alleen bevestigde feiten, zie §2].
- **Doelgroep**: [TODO: doelgroep]. Werkaanname tot die bevestigd is: potentiële klanten die lokaal zoeken — conversie en vindbaarheid (SEO) zijn dan net zo belangrijk als de techniek.
- **Opdrachtgever**: echte, betalende klant. Dit is geen leerproject — kwaliteit, veiligheid en betrouwbaarheid gaan boven snelheid.
- **Hosting**: shared hosting met PHP 8.3+ en Apache, SFTP-deploy (geen Git/CI-integratie op de server). [TODO: hostingpartij en pakket bevestigen.] [TODO: domein.]

---

## 2. Klantcontent — vastgestelde feiten

Deze sectie bevat de content-feiten die de klant heeft aangeleverd, gestructureerd. Dit is de bron voor de teksten in de content-JSON's (§10). Gebruik alleen wat hieronder staat — verzin geen aanvullende details, cijfers of geschiedenis die hier niet genoemd worden.

> **Voorrangsregel design vs. content.** Een aangeleverd ontwerp (mockup, designbestand, prototype) is uitsluitend een **visuele** referentie: kleuren, typografie, spacing, layout en componentvormen. De **teksten** in een ontwerp zijn placeholders en zijn géén klantcontent. Waar een ontwerp en deze §2 elkaar tegenspreken, wint §2 altijd. Neem nooit een tekst, aantal, prijs of claim over uit designbestanden.

Markeer elk feit als ✅ **Bevestigd** of ⏳ **Nog niet bevestigd — niet gebruiken tot navraag**.

### Diensten
- [TODO: welke diensten het collectief aanbiedt.]

### Positionering
- [TODO: hoe het collectief zich positioneert; wat wel en niet in de publieke communicatie hoort.]

### Prijzen
- [TODO: of en hoe prijzen op de site komen.]

### Achtergrond ("Over ons")
- [TODO: bevestigde feiten over het collectief en de makers.]
- Schrijf de tekst voorlopig kort en feitelijk, uitsluitend gebaseerd op bevestigde punten. Geen persoonlijke details of anekdotes verzinnen die niet expliciet zijn aangeleverd — die komen er later bij als de klant zelf via de CMS aanvult of corrigeert.

### Vormgeving
- [TODO: designwensen van de klant.] Het design komt in `frontend/src/styles/tokens.css` (zie `frontend/src/styles/README.md`). Bevestig een nieuw design met een mockup voordat het definitief wordt doorgevoerd.

### Foto's
- [TODO: welke foto's de klant aanlevert en waarvoor.]
- Gebruik alleen duidelijk relevante foto's waarvan vaststaat dat de klant ze mag gebruiken. Neem geen foto's over van externe bronnen die niet gecleard zijn voor commercieel gebruik door de klant.

---

## 3. Technische stack & waarom

| Laag | Keuze | Reden |
|---|---|---|
| Frontend | React 18+ met TypeScript, gebouwd met Vite | Type-veiligheid, herbruikbare componenten, snelle build, output is statische bestanden die direct via SFTP naar de hosting kunnen |
| Styling | **CSS Modules** (besloten; niet mixen met Tailwind) | De design tokens zijn een CSS-variabelensysteem in één bestand (`styles/tokens.css`); Tailwind zou dezelfde schaal een tweede keer in een theme-config zetten. Zit in Vite ingebakken, dus nul extra dependencies |
| Routing | **Vite multi-page build**: één HTML-entry point per pagina, geen router-library | Elke pagina is een echt HTML-bestand met eigen `<title>` en meta description in de broncode — dat haalt §12 zonder JavaScript, en Apache serveert ze direct zonder rewrite. Een SPA-router zou een dependency toevoegen én titels naar JavaScript verplaatsen |
| Backend | PHP 8.3+ (structured, PSR-12) | Shared hosting ondersteunt PHP native zonder aparte Node-hosting; sluit aan bij de SFTP-workflow |
| Content-opslag | JSON-bestanden op de server (**geen database**) | Er is geen relationele data, geen zoek-/filterbehoefte en maar één beheerder — de content ís exact wat er getoond wordt. JSON is eenvoudiger te back-uppen, te deployen (past bij SFTP) en te onderhouden dan een database. Groeit het project later (bijv. boekingen, meerdere gebruikers), dan is dit op te schalen naar een database via de Repository-laag (zie §8/§10) zonder de rest van de code aan te passen |
| API-vorm | Eigen lichte REST-API (JSON), geen zwaar framework | Composer werkt niet altijd probleemloos op basis-hostingpakketten — een lichte, afhankelijkheidsarme backend is robuuster dan een zwaar framework dat mogelijk niet installeert, en is voor een paar pagina's ook simpelweg niet nodig. De backend heeft een eigen PSR-4-autoloader (namespace `App\`) en geen `vendor/` |
| Auth | Sessie-gebaseerd (PHP sessions) + CSRF-tokens | Past bij shared hosting, geen extra infrastructuur nodig, goed te beveiligen |
| Lokale dev-omgeving | Geen Docker — native (`php -S` voor de backend, Vite dev-server voor de frontend) | Geen database om te orkestreren, en productie is sowieso shared hosting zonder containers — Docker lost hier geen echt probleem op en voegt alleen overhead toe. Wel lokaal dezelfde PHP-versie installeren als op de hosting draait, dat is de enige match die ertoe doet |

**Vuistregel**: kies altijd de eenvoudigste oplossing die aan de eisen voldoet. Geen extra library, package of abstractielaag toevoegen zonder concrete meerwaarde.

---

## 4. Algemene codeerprincipes

- **Single Responsibility**: elke functie, component of class doet één ding. Als je "en" nodig hebt om te beschrijven wat iets doet, splits het op.
- **DRY, maar niet ten koste van duidelijkheid**: haal pas iets uit elkaar naar een gedeelde functie zodra het écht 2x+ voorkomt — voorkom premature abstractie.
- **KISS & YAGNI**: bouw niet voor hypothetische toekomstige features. Bouw wat nu nodig is, goed.
- **Geen magic numbers/strings**: gebruik benoemde constanten of enums (bv. `MAX_LOGIN_ATTEMPTS = 5`, niet de losse `5` in de code).
- **Functies/componenten klein houden**: richtlijn is max. ~50-75 regels per functie en ~150-200 regels per bestand. Groter? Splits op.
- **Vroegtijdig returnen** in plaats van diep geneste if-statements.
- **Betekenisvolle namen**: `getPageContent()` in plaats van `getData()`. Namen in het Engels (internationale conventie voor code), UI-teksten in het Nederlands.
- **Comments leggen het "waarom" uit, niet het "wat"**: code moet zichzelf uitleggen door goede naamgeving; comments zijn voor niet-voor-de-hand-liggende beslissingen.
- **Geen dode code, geen uitgecommentarieerde blokken** die blijven staan — gebruik Git-historie daarvoor.

---

## 5. Projectstructuur

Code wordt altijd verdeeld over meerdere bestanden per verantwoordelijkheid — nooit alles in één file.

```
project-root/
├── frontend/
│   ├── public/
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   ├── llms.txt
│   │   └── favicon/…
│   ├── src/
│   │   ├── assets/            # afbeeldingen, fonts
│   │   ├── components/
│   │   │   ├── ui/            # generiek, herbruikbaar: Button, Field, Carousel, Toast
│   │   │   └── features/      # samengesteld: ContactForm, PageSections, PublicPageBody
│   │   ├── layouts/           # Header, Footer, PageLayout
│   │   ├── pages/             # route-niveau componenten, plus admin/ (het CMS)
│   │   ├── hooks/             # eigen hooks: useFetch, useSession, useImageUpload
│   │   ├── services/          # API-communicatie (fetch-wrappers per resource)
│   │   ├── types/             # TypeScript interfaces/types (gedeeld)
│   │   ├── constants/         # routes, siteconfiguratie (site.ts), enums
│   │   ├── utils/             # pure helper-functies (geen side effects)
│   │   ├── styles/            # tokens.css (het design), global.css
│   │   └── main-*.tsx         # één instapscript per HTML-ingang
│   ├── eslint.config.js
│   ├── .prettierrc
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── public/                 # ENIGE map die publiek toegankelijk is (webroot)
│   │   ├── index.php           # single entry point / front controller
│   │   └── uploads/            # publiek zichtbare afbeeldingen
│   ├── src/                    # buiten de webroot, of afgeschermd via .htaccess
│   │   ├── Controllers/        # ontvangt request, roept services aan, geeft response terug
│   │   ├── Services/           # business-logica (o.a. content valideren, contactmail versturen)
│   │   ├── Repositories/       # enige laag die de content-JSON leest/schrijft
│   │   ├── Middleware/         # auth-check, CSRF-check, beveiligingsheaders
│   │   ├── Validators/         # input-validatie per resource
│   │   ├── Http/               # Request, Router, JsonResponse, Session, CSRF-tokens
│   │   ├── Config/             # env-loader, paden
│   │   └── Utils/
│   ├── storage/
│   │   └── content/            # home.json, over-ons.json, contact.json, … — NIET publiek toegankelijk
│   ├── tools/                  # hash-password.php (en lokaal phpunit.phar)
│   ├── .env.example            # nooit .env zelf committen
│   └── tests/
│
└── docs/
    └── seo-checklist.md
```

**Regel voor Claude Code**: bij het toevoegen van nieuwe functionaliteit altijd eerst kijken of een bestaande map/laag past, voordat er een nieuw bestand op willekeurige plek wordt aangemaakt.

---

## 6. Naamgevingsconventies

- **TypeScript/React**: `PascalCase` voor componenten en types (`ContactForm.tsx`, `type ContentSection`), `camelCase` voor functies/variabelen, `SCREAMING_SNAKE_CASE` voor constanten.
- **Bestandsnamen frontend**: component-bestand heeft dezelfde naam als het component (`ContactForm.tsx` bevat `ContactForm`).
- **PHP**: `PascalCase` voor classes (`ContentController`, `ContactService`), `camelCase` voor methodes/variabelen. Namespace `App\`.
- **API-routes**: zelfstandig naamwoord, geen werkwoorden: `GET /api/content/{page}`, niet `/api/getContent`.
- **CSS-classes**: camelCase-klassen in CSS Modules, consistent binnen het hele project — niet mixen.

---

## 7. Frontend-regels (React + TypeScript)

- **Strict mode aan** in `tsconfig.json` (`"strict": true`). Geen `any` tenzij écht onvermijdelijk, en dan met commentaar waarom.
- **Functionele componenten + hooks**, geen class components.
- **Props altijd typen** met een `interface`, geëxporteerd als het component herbruikt kan worden.
- **State-strategie** (geen overkill zoals Redux voor dit schaalniveau):
  - Lokale UI-state → `useState`
  - Gedeelde state tussen een paar componenten → React Context
  - Server-data (de content per pagina) → een eigen `useFetch`/data-hook met loading/error/success-status
- **Discriminated unions voor async state**, bijvoorbeeld:
  ```ts
  type RequestState<T> =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'success'; data: T }
    | { status: 'error'; error: string };
  ```
- **Elke datafetch heeft drie zichtbare states**: laden, fout, resultaat. Nooit een lege pagina tonen zonder feedback.
- **Formulieren**: client-side validatie voor UX, maar de server valideert áltijd opnieuw (client-side validatie is nooit de enige beveiliging).
- **Geen inline styles** voor iets dat herbruikbaar moet zijn; gebruik het gekozen stylingsysteem. Kleuren, fonts, radius en schaduwen alleen via tokens uit `styles/tokens.css`.
- **Afbeeldingen**: gebruik `srcset`/moderne formaten (WebP/AVIF) en `loading="lazy"` voor alles behalve above-the-fold content.
- **Toegankelijke HTML eerst**: gebruik semantische elementen (`<nav>`, `<main>`, `<button>`) vóór je naar ARIA-attributen grijpt.

---

## 8. Backend-regels (PHP)

- **PSR-12** voor codestijl, **PSR-4** voor autoloading (met de eigen kleine autoloader in `src/Autoloader.php`, geen Composer nodig).
- **PHP 8.3+ features gebruiken**: type hints op parameters én return types, `readonly` properties waar toepasselijk, `enum` in plaats van losse string/int-constanten.
- **Content lezen/schrijven gaat altijd via de Repository** (zie §10) — nooit direct vanuit een Controller of Service een JSON-bestand openen.
- **Elke laag heeft één taak**:
  - Controller: leest request, roept Service aan, stuurt response — geen business-logica hier.
  - Service: bevat de business-logica (bv. content valideren vóór opslag, contactmail samenstellen).
  - Repository: enige laag die de content-JSON-bestanden leest en schrijft. Komt er ooit een database bij, dan verandert alleen deze laag.
- **Fouten afhandelen met try/catch en logging**, nooit een ruwe systeem- of stack-foutmelding naar de gebruiker sturen.
- **Geen globale variabelen/functies** — gebruik dependency injection (ook handmatig, zonder framework, is prima; alle bedrading staat in `public/index.php`).
- **Config en secrets via `.env`**, ingelezen in `Config/`, nooit hardcoded in de broncode.

---

## 9. API-conventies

- **Consistent response-formaat**, bijvoorbeeld:
  ```json
  { "success": true, "data": { … } }
  { "success": false, "error": { "code": "VALIDATION_ERROR", "message": "…" } }
  ```
  Een validatiefout mag daarnaast `error.details` dragen met álle fouten, zodat de beheerder ze in één keer ziet.
- **Juiste HTTP-statuscodes gebruiken**: 200/201 succes, 400 validatiefout, 401 niet ingelogd, 403 geen rechten, 404 niet gevonden, 429 te veel requests, 500 serverfout.
- **Minimale data-exposure**: stuur alleen velden terug die de frontend nodig heeft — nooit wachtwoordhashes, interne ID's van andere systemen of debug-informatie.
- **Endpoints voor het admin-gedeelte apart en middleware-beveiligd** (`/api/admin/...`), nooit impliciet beveiligd via "de link is niet zichtbaar".
- **Rate limiting** op login- en contactformulier-endpoints om misbruik/brute force te voorkomen.

**Concrete endpoints voor dit project:**

| Methode | Endpoint | Toegang | Doel |
|---|---|---|---|
| GET | `/api/content/{page}` | publiek | content van `home`, `over-ons`, `contact`, `privacy` of `terms` ophalen, plus `site` |
| GET | `/api/contact/token` | publiek | CSRF-token voor het contactformulier ophalen (ondertekend met `APP_SECRET`, geen sessie/cookie — zie §11) |
| POST | `/api/contact` | publiek | contactformulier versturen (per e-mail, zie §10) |
| GET | `/api/admin/session` | publiek | inlogstatus plus CSRF-token voor het beheer |
| POST | `/api/admin/login` | publiek (met CSRF-token) | inloggen |
| POST | `/api/admin/logout` | admin | uitloggen |
| GET | `/api/admin/content/{page}` | admin | ruwe content van één pagina (of `site`) ophalen, inclusief `_todo` |
| POST | `/api/admin/content/{page}` | admin | content van één pagina (of `site`) bijwerken |
| POST | `/api/admin/content/{page}/vorige-versie` | admin | de vorige versie (`.bak`) terugzetten |
| POST | `/api/admin/upload` | admin | afbeelding uploaden, geeft pad terug |

---

## 10. Content-opslag (JSON)

Er is bewust gekozen voor JSON-bestanden in plaats van een database (afweging in §3). Regels:

- **Eén JSON-bestand per pagina**: `home.json`, `over-ons.json`, `contact.json`, `privacy.json` en `terms.json` in `backend/storage/content/` — buiten de webroot, dus niet direct via de browser op te vragen. Daarnaast één sitebreed `site.json` (bedrijfsnaam, NAP-gegevens, `sameAs`-links): die gegevens staan in de footer op élke pagina en voeden het `LocalBusiness`-schema, en §12 eist dat ze exact gelijk zijn aan het Google Business Profile — met één bron kunnen ze niet uit elkaar gaan lopen.
- **Getypeerde secties** (besloten): elke sectie heeft een `type`-veld met één van vijf waarden — `hero`, `prose`, `quote`, `list`, `cta` — en per type een vaste set velden, plus `background` (`light` of `tinted`). Reden: een platte vorm `{heading, text, image}` kan een lijst diensten en de knoptekst op de homepage niet uitdrukken zonder ze tot één alinea plat te slaan. Het blijft één array, dus het CMS kan er gewoon doorheen lopen. Daarnaast heeft elk paginabestand een `meta`-blok met `title` en `description`, die §12 verplicht stelt. De volledige beschrijving staat in `backend/storage/content/README.md` en is leidend voor de Validator.
- **Het `meta`-blok is van de ontwikkelaar, niet van het CMS.** De `<title>` en meta description staan in de content-JSON als enige bron, en worden bij het bouwen in de HTML-bestanden gezet (`frontend/vite-plugins.ts`). Zo staan ze op één plek én ziet een crawler ze zonder JavaScript. Gevolg: een wijziging werkt pas na een nieuwe build en deploy, dus het CMS biedt alleen `sections` aan — een veld dat lijkt te werken maar niets verandert, is erger dan geen veld.
- **Sleutels die met `_` beginnen worden nooit gerenderd.** JSON kent geen commentaar; `_todo` houdt een openstaand punt zichtbaar in het bestand waar het over gaat.
- **Seeds**: de contentbestanden in de repo zijn seeds met `[TODO: …]` in elk tekstveld. De NAP-velden in `site.json` blijven leeg tot ze bevestigd zijn: leeg betekent voor de code "nog niet aangeleverd" (footer toont een plaatsvervanger, het schema wordt overgeslagen); een tijdelijke tekst zou als echt gegeven in het schema belanden.
- **Waar staat wat** (sitebrede gegevens):

  | Gegeven | Plek | Wie wijzigt | Werkt na |
  |---|---|---|---|
  | Bedrijfsnaam, telefoon, e-mail, werkgebied, `sameAs` | `backend/storage/content/site.json` | klant (beheer → Bedrijfsgegevens) | footer direct; schema na build |
  | Domein, locale, deelafbeelding, schema-type | `frontend/src/constants/site.ts` | ontwikkelaar | build |
  | `<title>` en meta description per pagina | `meta` in de content-JSON van die pagina | ontwikkelaar | build |
  | Domein in robots, sitemap, llms | `frontend/public/` (statisch) | ontwikkelaar | deploy |
  | Navigatielabels, header-knop | `frontend/src/constants/routes.ts` | ontwikkelaar | build |

- **Valideer bij het opslaan altijd tegen de verwachte structuur** (Validator) vóórdat er iets weggeschreven wordt — corrupte JSON mag nooit live komen.
- **Atomisch schrijven**: schrijf eerst naar een tijdelijk bestand en hernoem dat pas naar het definitieve bestand (`rename()`), zodat een afgebroken schrijfactie nooit een kapot bestand achterlaat.
- **File locking** (`flock()`) bij het schrijven, om race conditions te voorkomen — met één beheerder een kleine kans, maar goedkoop om af te dekken.
- **Automatische backup** van de vorige versie bij elke update (bv. `over-ons.json.bak`), zodat een foutieve wijziging terug te draaien is.
- **Afbeeldingen staan niet ín de JSON**, alleen het pad ernaartoe. De bestanden zelf staan publiek in `public/uploads/`, volgens de regels in §11 (bestandsuploads).
- **Contactformulier**: verstuurt direct een e-mail naar de klant (PHP `mail()`) — hoeft niet apart opgeslagen te worden. Het vraagt alleen naam, e-mailadres en bericht (§15). Wil de klant later een overzicht van aanvragen kunnen terugzien, voeg dan een simpel JSON-logboek toe — pas op het moment dat die wens er is.
- **Groeipad**: komen er later structuren bij die wél relaties/zoekopdrachten nodig hebben (bijv. een boekingssysteem met beschikbaarheid), voeg dan pas op dát moment een database toe. Dankzij de Repository-laag (§8) verandert dan alleen die laag, niet de Controllers of Services.

---

## 11. Beveiliging — verplicht, dit is een live project met een admin-login

### Authenticatie (admin-CMS)
- Wachtwoorden hashen met `password_hash()` (bcrypt/argon2id), verifiëren met `password_verify()`. Nooit zelf een hash-algoritme verzinnen. De hash maak je met `php backend/tools/hash-password.php`; het wachtwoord zelf komt nergens te staan.
- Sessie-ID regenereren direct na succesvolle login (`session_regenerate_id(true)`).
- Sessiecookies: `HttpOnly`, `Secure`, `SameSite=Strict`.
- Sessie laten verlopen na inactiviteit (30 minuten); expliciet server-side invalideren bij uitloggen.
- Rate limiting/lockout op het loginformulier (max. 5 pogingen, daarna tijdelijke blokkade) — voorkomt brute force.
- Altijd een **generieke foutmelding** bij mislukte login ("gebruikersnaam of wachtwoord onjuist"), nooit specificeren welk van de twee fout was.
- Alleen HTTPS toestaan voor het admin-gedeelte (forceer redirect van http naar https).

### Input & output
- **Server-side valideren en saneren van alle input**, ook als de frontend al valideert.
- **Alles wat je teruggeeft naar HTML escapen** (`htmlspecialchars()`) om XSS te voorkomen; React doet dit standaard al voor JSX-output, maar let hierop bij `dangerouslySetInnerHTML` (vermijden tenzij strikt noodzakelijk en gesaneerd).
- **CSRF-tokens** op alle formulieren die state wijzigen (login, content bewerken, contactformulier).
- **Bestandsuploads** (bv. foto's door de klant): whitelist toegestane bestandstypen, valideer daadwerkelijke inhoud (bv. `getimagesize()`, niet alleen de extensie), genereer een nieuwe bestandsnaam, sla buiten direct-uitvoerbare mappen op, en beperk de bestandsgrootte.

### Serverconfiguratie op de hosting
- Zet alleen `backend/public/` publiek toegankelijk; `src/`, `.env`, `storage/` etc. horen **niet** in de webroot te staan. Kan dat op het hostingpakket niet, bescherm deze mappen dan expliciet met een `.htaccess` (staat al klaar in `src/` en `storage/`):
  ```apache
  # in de map die niet publiek toegankelijk mag zijn
  Require all denied
  ```
- Beveiligingsheaders instellen (via `.htaccess` én in PHP): `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` (API) / `SAMEORIGIN` (site, voor het voorbeeldvenster in het beheer), `Referrer-Policy: strict-origin-when-cross-origin`, `Strict-Transport-Security` (zodra HTTPS actief is).
- Foutrapportage in productie: `display_errors = Off`, fouten alleen naar een logbestand, nooit naar de browser.
- Directory listing uitschakelen.

### Algemeen
- Geen enkele API-key, wachtwoord of connectiestring ooit in de broncode of in Git — altijd via `.env` (dat in `.gitignore` staat).
- Afhankelijkheden (npm) actueel houden en periodiek controleren op bekende kwetsbaarheden (`npm audit`). Upgrades alleen na overleg (§20).
- Autorisatie server-side controleren op élk admin-endpoint — nooit uitgaan van wat de frontend wel/niet toont.

---

## 12. SEO — wordt tijdens het bouwen meegenomen, niet achteraf

### Fundament (elke pagina)
- Elke pagina: unieke, beschrijvende `<title>` en `meta description`.
- Eén `<h1>` per pagina, logische heading-hiërarchie daarna (h2 → h3).
- Semantische HTML-structuur (`<main>`, `<nav>`, `<article>`, `<section>`).
- Canonical tags om dubbele content te voorkomen.
- Nette, leesbare URL's (`/over-ons`, niet `/page?id=2`).
- Canonical, Open Graph-tags en het `LocalBusiness`-schema komen bij het bouwen uit `frontend/vite-seo.ts` (niet handmatig in de HTML-bestanden). Het schema leest `site.json` en wijzigt dus pas na een nieuwe build.
- Eigen 404-pagina (`frontend/404.html`), geserveerd met statuscode 404 via `ErrorDocument` in `.htaccess`. Staat niet in `ROUTES`, dus niet in navigatie of sitemap. Checklist: `docs/seo-checklist.md`.

### Structured data (JSON-LD)
- `LocalBusiness`-schema op de homepage: naam, adres, telefoon (NAP), openingstijden, `sameAs`-links naar Google Business Profile en social media. NAP-gegevens moeten overal exact hetzelfde zijn (website, Google Business Profile, eventuele directories) — inconsistentie schaadt vertrouwen en ranking. Het schema wordt alleen gegenereerd als naam, telefoon, e-mail en werkgebied gevuld zijn: halve of verzonnen NAP-gegevens zijn schadelijker dan geen schema.
- `Service`-schema als er concrete diensten/pakketten op de Home-pagina staan — anders is `LocalBusiness` afdoende voor dit project.
- Schema valideren (Google Rich Results Test) vóór livegang en periodiek opnieuw controleren, vooral na wijzigingen in openingstijden of aanbod.

### AI-crawlers & GEO (Generative Engine Optimization)
- `robots.txt` met expliciet beleid voor AI-crawlers (GPTBot, ClaudeBot, PerplexityBot etc.) — bewust toestaan of blokkeren, niet stilzwijgend negeren. [TODO: beleid bevestigen met de klant; werkaanname is toestaan.]
- `llms.txt` in de root: korte, gestructureerde samenvatting van wie de klant is en welke pagina's leidend zijn, zodat AI-zoeksystemen de content correct citeren.
- `sitemap.xml`, automatisch of handmatig bijgewerkt bij nieuwe pagina's.

### Techniek & performance
- Core Web Vitals als build-eis, niet als nazorg: **LCP** < 2,5s, **INP** < 200ms, **CLS** < 0,1.
- Afbeeldingen: modern formaat (WebP/AVIF), juiste afmetingen, `lazy loading` onder de fold.
- Mobile-first: het overgrote deel van lokaal zoekverkeer is mobiel — test altijd eerst op mobiel.
- Geen render-blocking scripts/styles die niet direct nodig zijn voor first paint.

### Lokale SEO
- Google Business Profile is prioriteit nummer één naast de website zelf — los traject, maar NAP-consistentie tussen site en profiel bewaken.
- Contactgegevens (adres/werkgebied, telefoon) op elke pagina in de footer, machine-leesbaar (schema + gewone tekst).

### Meten
- Google Search Console en GA4 koppelen zodra de site live is.
- Sitemap indienen in Search Console na livegang.

---

## 13. Performance

- Frontend build via Vite met code-splitting per route (`React.lazy` voor zware pagina's).
- Bundle-grootte in de gaten houden; geen zware library importeren voor iets dat ook met een paar regels eigen code kan.
- Afbeeldingen altijd comprimeren vóór upload/gebruik (het beheer verkleint foto's al in de browser).
- PHP-responses waar zinvol cachen (de content-JSON wijzigt zelden) met korte cache-headers.
- Server-side caching (bv. een FastCGI-cache) activeren in het hostingpaneel, indien beschikbaar.

---

## 14. Toegankelijkheid (WCAG)

- Voldoende kleurcontrast (WCAG AA als minimum). Controleer dit opnieuw bij elk nieuw palet in `styles/tokens.css`.
- Alle interactieve elementen bereikbaar en bruikbaar via toetsenbord.
- `alt`-teksten op alle betekenisvolle afbeeldingen (leeg `alt=""` voor puur decoratieve afbeeldingen).
- Formuliervelden hebben altijd een gekoppeld `<label>`.
- Focus-states visueel duidelijk, nooit `outline: none` zonder alternatief.

---

## 15. Privacy & AVG/GDPR

Relevant omdat er persoonsgegevens verwerkt worden via het contactformulier.

- Privacyverklaring op de site, in gewone taal. [TODO: tekst van de klant.]
- Alleen gegevens opvragen die daadwerkelijk nodig zijn (dataminimalisatie) — geen extra velden "voor de zekerheid". Het formulier vraagt nu naam, e-mailadres en bericht.
- Contactformulier verstuurt direct een e-mail (zie §10) en bewaart de gegevens verder niet — dat is privacyvriendelijker dan opslaan "voor het geval dat". Wordt er later toch een archief bijgehouden, dan gelden dezelfde regels als voor content: veilig, met beperkte toegang, alleen voor de admin.
- Bezoekers van de publieke site krijgen geen cookie: de sessie start alleen voor `/api/admin`, en het contactformulier gebruikt een ondertekend token in plaats van een sessie.
- Als Google Analytics of andere trackers gebruikt worden: cookiebanner met opt-in vóór het plaatsen van niet-noodzakelijke cookies.
- Wordt er alsnog een log van aanvragen bijgehouden, leg dan ook een bewaartermijn en verwijderprocedure vast.

---

## 16. Testing

- Frontend: Vitest + React Testing Library voor kritieke componenten en logica (met name formuliervalidatie), niet per se 100% coverage.
- Backend: PHPUnit (als PHAR, zie `backend/README.md`) voor Services en Validators, en specifiek voor de content-Repository (atomisch schrijven, corrupte JSON afvangen) en het versturen van de contactmail — dit zijn de plekken waar een bug het meest impact heeft.
- Handmatige checklist vóór oplevering: formulieren, admin-login, responsive gedrag (mobiel/tablet/desktop), 404-pagina, broken links.

---

## 17. Git & versiebeheer

- Git lokaal gebruiken voor versiebeheer, ook al gaat de deploy via SFTP (geeft je een terugval-/vergelijkpunt).
- `.gitignore`: `node_modules/`, `vendor/`, `.env`, `dist/`, `build/`, runtime-bestanden in `backend/storage/`.
- Commit-berichten kort en to-the-point in de imperatief: `Voeg contactformulier-validatie toe`, niet `wijzigingen`.
- Eén logische wijziging per commit.

---

## 18. Deployment naar de shared hosting

- SFTP-toegang: [TODO: host, poort en gebruikersnaam van het hostingpakket]. Protocol SFTP, niet FTP. De inloggegevens staan nooit in de repo, in `.env.example` of in dit bestand.
- Frontend: `npm run build` → upload de **inhoud** van `dist/` naar de webroot.
  `index.html` hoort in de root van het gepubliceerde pad.
- Backend: `backend/public/` wordt op de server een map die letterlijk **`api`**
  heet, als submap van diezelfde webroot. Dat is geen stijlkeuze: elke route is
  intern gedefinieerd als `/api/...` (§9), en dat werkt alleen vanzelf goed via
  de `.htaccess`-bestanden als de mapnaam daarmee overeenkomt. `backend/src/`
  en `backend/storage/` gaan als **sibling** van `api/` mee, dus niet erin —
  `index.php` zoekt ze één map boven zichzelf. Op de server ziet de webroot er
  dan zo uit:

  ```
  webroot/
  ├── index.html, over-ons.html, …   ← inhoud van frontend/dist/
  ├── assets/                         ← ook uit frontend/dist/
  ├── .htaccess                       ← komt vanzelf mee uit frontend/dist/
  ├── api/                            ← inhoud van backend/public/ (hernoemd!)
  │   ├── index.php
  │   ├── uploads/
  │   └── .htaccess
  ├── src/                            ← backend/src/, naast api/
  ├── storage/                        ← backend/storage/, naast api/
  └── .env                            ← nieuw aangemaakt op de server, niet uit Git
  ```

  Geen `node_modules`, geen ontwikkelbestanden (`backend/tools/phpunit.phar`,
  `backend/.phpunit.cache/`, `backend/tests/`) meesturen.
- **Content niet blind overschrijven**: de contentbestanden in `storage/content/` en de foto's in `api/uploads/` worden op de server door het CMS gewijzigd. Upload ze alleen bij de eerste deploy; daarna eerst kijken wat er live staat.
- Vóór elke deploy: testen in een lokale/staging-omgeving, nooit direct experimenteren in productie.
- Na deploy: controleren dat HTTPS actief is, dat `.env`, `src/` en `storage/`
  niet extern opvraagbaar zijn, en dat de sitemap/robots.txt bereikbaar zijn.

---

## 19. Documentatie

- Elke map met een eigen `README.md` bij niet-triviale logica (bv. `backend/src/Repositories/README.md`).
- PHPDoc-blokken op public methods in Services/Repositories.
- TSDoc-comments op custom hooks en gedeelde utils.
- Documentatie wordt bijgewerkt in dezelfde commit als de code-wijziging, niet "later".

---

## 20. Hoe Claude Code zich in dit project moet gedragen

- **Vraag om bevestiging** voordat je een nieuwe dependency toevoegt of upgradet, een grote architectuurkeuze maakt, of de structuur van een content-JSON-bestand wijzigt (bestaande content mag niet stuk gaan).
- **Nooit** secrets, wachtwoorden of API-keys hardcoden — altijd via `.env`.
- **Nooit** aannames doen die de veiligheid raken (bv. authenticatie "voor nu even overslaan") — als iets niet duidelijk is, vraag het na in plaats van te gokken.
- **Splits grote taken op** in kleine, controleerbare stappen; lever niet in één keer duizenden regels aan zonder tussentijdse uitleg.
- **Leg bij twijfel tussen twee gelijkwaardige technische opties** kort de afweging voor in plaats van zelf te kiezen.
- **Behandel §2 (Klantcontent) als bron van waarheid voor teksten** — gebruik alleen bevestigde feiten uit die sectie voor placeholder- en definitieve content; vul geen `[TODO]` zelf in met aannames. Zolang §2 leeg is, blijven de teksten `[TODO]`.
- **Werk dit bestand bij** wanneer een belangrijke architecturale beslissing wordt genomen, zodat het instructiebestand de waarheid blijft weerspiegelen.
- **Elke aangeleverde code moet direct passen binnen de structuur in sectie 5** — niet ergens los een bestand neerzetten.

---

## 21. Checklist vóór oplevering aan de klant

- [ ] Alle `[TODO]`-plekken weggewerkt (content, `frontend/public/`, `frontend/src/constants/`, dit bestand).
- [ ] Alle formulieren valideren zowel client- als server-side.
- [ ] Admin-login getest op rate limiting, sessieverloop en HTTPS-afdwinging.
- [ ] Een echt admin-wachtwoord ingesteld op de server (`tools/hash-password.php`), los van elke ontwikkelinlog.
- [ ] `.env`, `src/`-mappen en `storage/` niet extern opvraagbaar.
- [ ] Alle pagina's hebben unieke titel/description en correcte schema-markup.
- [ ] `robots.txt`, `sitemap.xml`, `llms.txt` aanwezig en correct, met het echte domein.
- [ ] Core Web Vitals gecheckt (PageSpeed Insights) op mobiel én desktop.
- [ ] Privacyverklaring aanwezig, cookiebanner werkt indien van toepassing.
- [ ] Responsive getest op minimaal 3 schermformaten.
- [ ] 404-pagina en foutafhandeling correct.
- [ ] Google Search Console + GA4 gekoppeld en sitemap ingediend.
- [ ] Open punten uit §2 met de klant afgerond vóór livegang.
