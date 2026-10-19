# Meubelmakers Collectief Zeist — website

Een beheerbare presentatiewebsite: drie pagina's in de hoofdnavigatie (Home,
Over ons, Contact), een privacyverklaring en algemene voorwaarden in de
footer, en een beveiligd beheer waarin de klant zelf teksten, foto's en
bedrijfsgegevens aanpast.

**Dit is een merkloze starter.** De functionele basis werkt en is getest;
design en klantcontent ontbreken nog bewust. Overal waar die horen staat
`[TODO: …]`:

```bash
grep -rn "TODO" --exclude-dir=node_modules .
```

De bindende afspraken over structuur, conventies, beveiliging, SEO,
toegankelijkheid, AVG en deployment staan in [CLAUDE.md](CLAUDE.md).

| Laag | Techniek |
|---|---|
| Frontend | React 18, TypeScript, Vite (multi-page build), CSS Modules |
| Backend | PHP 8.3, geen framework, eigen PSR-4-autoloader |
| Content | JSON-bestanden achter een Repository-laag (atomisch schrijven, `flock()`, backup) |
| Hosting | shared hosting met Apache, deploy via SFTP |

## Vereisten

- PHP 8.3 of hoger (CLI), met `mbstring`. `getimagesize()` is nodig voor uploads.
- Node.js 20.17 of hoger, met npm.

## Lokaal draaien

**1. Frontend-afhankelijkheden installeren.**

```bash
cd frontend && npm install
```

**2. `backend/.env` aanmaken.** Zonder dit bestand kun je niet inloggen in het
beheer. Het staat in `.gitignore` en gaat nooit mee in Git.

```bash
cp backend/.env.example backend/.env
```

Vul daarna in `backend/.env` in:

| Variabele | Waarde |
|---|---|
| `APP_ENV` | `development` lokaal, `production` op de server |
| `ADMIN_USERNAME` | een zelfgekozen gebruikersnaam |
| `ADMIN_PASSWORD_HASH` | de uitvoer van het script hieronder |
| `APP_SECRET` | een willekeurige sleutel, zie hieronder |
| `MAIL_TO` | het adres waar contactaanvragen heen gaan |
| `MAIL_FROM` | een afzendadres op het eigen domein |

**3. Admin-wachtwoord instellen.** Het script vraagt het wachtwoord twee keer
(minimaal 12 tekens) en toont de hash. Het wachtwoord zelf wordt nergens
opgeslagen, en gaat bewust niet als argument mee: dan zou het in de
shell-geschiedenis belanden.

```bash
php backend/tools/hash-password.php
```

Plak de regel `ADMIN_PASSWORD_HASH=…` die het toont in `backend/.env`. Op
Windows is het wachtwoord tijdens het typen zichtbaar; het script meldt dat.
Wachtwoord kwijt? Draai het script opnieuw en vervang de regel.

**4. `APP_SECRET` genereren.**

```bash
php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
```

**5. Beide servers starten**, elk in een eigen terminal:

```bash
cd backend && php -S localhost:8123 -t public public/index.php
```

```bash
cd frontend && npm run dev
```

De site staat dan op http://localhost:5173, het beheer op
http://localhost:5173/admin. De Vite-dev-server stuurt `/api` en `/uploads`
door naar de PHP-server op poort 8123.

## Controles

```bash
cd frontend && npm test && npm run typecheck && npm run lint && npm run build
```

PHPUnit draait als PHAR en staat niet in Git; haal hem eenmalig op:

```bash
curl -sSL -o backend/tools/phpunit.phar https://phar.phpunit.de/phpunit-11.phar
```

```bash
cd backend && php tools/phpunit.phar
```

## Build

```bash
cd frontend && npm run build
```

De uitvoer staat in `frontend/dist/`. De build zet de `<title>` en meta
description uit de content-JSON in de HTML, en voegt canonical, Open Graph en
(op de homepage) het LocalBusiness-schema toe. Zolang er gegevens ontbreken
waarschuwt de build erover — dat is opzet.

## Configuratie: waar staat wat

| Gegeven | Plek | Wie wijzigt |
|---|---|---|
| Bedrijfsnaam, telefoon, e-mail, werkgebied, `sameAs` | `backend/storage/content/site.json` | klant, in het beheer (Bedrijfsgegevens) |
| Domein, locale, deelafbeelding, schema-type | `frontend/src/constants/site.ts` | ontwikkelaar |
| Titel en meta description per pagina | `meta` in `backend/storage/content/<pagina>.json` | ontwikkelaar |
| Domein in robots, sitemap en llms | `frontend/public/` | ontwikkelaar |
| Navigatielabels en de knop in de kop | `frontend/src/constants/routes.ts` | ontwikkelaar |
| Het design (kleuren, fonts, vorm) | `frontend/src/styles/tokens.css` | ontwikkelaar |
| Geheimen en mailadressen | `backend/.env` (nooit in Git) | ontwikkelaar, op de server |

De NAP-velden in `site.json` blijven leeg tot ze bevestigd zijn. Leeg
betekent voor de code "nog niet aangeleverd": de footer toont een
plaatsvervanger en het schema wordt overgeslagen.

## Deployen naar shared hosting

Uitgebreid in [CLAUDE.md §18](CLAUDE.md). Kort:

1. `npm run build` in `frontend/`, en upload de **inhoud** van `dist/` naar
   de webroot (inclusief de `.htaccess`).
2. Upload `backend/public/` naar een map **`api/`** in de webroot.
3. Upload `backend/src/` en `backend/storage/` naast `api/`, niet erin.
4. Maak op de server een nieuwe `.env` naast `api/`, met `APP_ENV=production`,
   een **nieuw** admin-wachtwoord en een **nieuwe** `APP_SECRET`.
5. Controleer daarna: HTTPS werkt, `/.env`, `/src/` en `/storage/` geven een
   weigering, `/robots.txt` en `/sitemap.xml` zijn bereikbaar, een onbekend
   adres geeft de eigen 404-pagina met status 404.
6. Zet HSTS pas aan in `frontend/public/.htaccess` nadat HTTPS op het echte
   domein werkt.

Stuur niet mee: `node_modules/`, `backend/tests/`, `backend/tools/phpunit.phar`,
`backend/.phpunit.cache/`. Overschrijf bij een latere deploy de content in
`storage/content/` en de foto's in `api/uploads/` niet blind: die worden op
de server door het beheer gewijzigd.
