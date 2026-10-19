# Backend

PHP 8.3, geen framework. Een lichte REST-API die JSON teruggeeft, plus de
content-opslag in JSON-bestanden (CLAUDE.md §3, §10).

## Lokaal draaien

```
cd backend
php -S localhost:8123 -t public public/index.php
```

Het laatste argument is geen sierraad: de ingebouwde server kent geen
mod_rewrite, dus `index.php` fungeert zelf als router-script. Bestaat een
gevraagd bestand echt — een foto in `public/uploads/` bijvoorbeeld — dan
handelt de server dat zelf af; al het overige valt door naar de front
controller, precies zoals via `.htaccess` in productie.

De Vite-dev-server stuurt `/api` en `/uploads` automatisch naar poort 8123
(`BACKEND_DEV_ORIGIN` in `frontend/vite.config.ts`), dus de frontend praat
lokaal met dezelfde relatieve paden als op de server.

Zonder `backend/.env` kun je niet inloggen; zie de README in de projectroot.

## Autoloading: eigen PSR-4 loader, geen Composer

Vastgelegde keuze. §3 en §8 laten dit expliciet toe zodra Composer op het
hostingpakket niet betrouwbaar is, en op basis-hostingpakketten is het geen
gegeven.

`src/Autoloader.php` is dertig regels en heeft geen `vendor/` nodig. Dat
scheelt bij een SFTP-deploy een hele map die je kunt vergeten mee te sturen —
en vergeet je hem, dan is de site stuk.

De namespace is `App\` en wijst naar `src/`.

## Tests

```
cd backend
php tools/phpunit.phar
```

**PHPUnit draait als PHAR, niet via Composer.** Dat past bij de keuze om de
backend zonder `vendor/` te houden: één bestand dat alleen lokaal staat en
nooit naar de server gaat. Het staat in `.gitignore`, dus na een verse clone
haal je het eerst op:

```
curl -sSL -o backend/tools/phpunit.phar https://phar.phpunit.de/phpunit-11.phar
```

De testbootstrap registreert twee autoloaders: één voor `App\` naar `src/`
en één voor `App\Tests\` naar `tests/`. Zonder die tweede zou een testklasse
in `src/Tests/` gezocht worden.

`failOnWarning`, `failOnRisky` en `failOnNotice` staan aan. Een waarschuwing
betekent hier meestal dat een test niets controleert, en zo'n test geeft valse
zekerheid — erger dan geen test.

## Lagen

Elk verzoek loopt van buiten naar binnen en weer terug:

```
index.php  ──▶  Middleware  ──▶  Controller  ──▶  Service  ──▶  Repository
(front           (auth, CSRF,     (verzoek       (business-      (JSON op
 controller)      rate limit)      → antwoord)    logica)         schijf)
```

Elke map heeft een eigen `README.md` met zijn verantwoordelijkheid en met
wat er juist **niet** in hoort. De harde regel uit §8: alleen een repository
raakt de content-JSON's aan — nooit een controller of service rechtstreeks.

Naast de zeven mappen uit §5 staat er een `src/Http/`. Die staat niet in §5;
de reden staat in `src/Http/README.md`.

## Endpoints

| Methode | Adres | Toegang | Doel |
|---|---|---|---|
| GET | `/api/content/{page}` | publiek | content van `home`, `over-ons`, `contact`, `privacy` of `terms`, plus `site` |
| GET | `/api/contact/token` | publiek | ondertekend CSRF-token voor het contactformulier (geen sessie, geen cookie) |
| POST | `/api/contact` | publiek | contactformulier versturen per e-mail; rate limited |
| GET | `/api/admin/session` | sessie | inlogstatus plus CSRF-token voor het beheer |
| POST | `/api/admin/login` | token | inloggen; rate limited |
| POST | `/api/admin/logout` | admin | uitloggen, sessie server-side ongeldig maken |
| GET | `/api/admin/content/{page}` | admin | de ruwe JSON, inclusief `_todo` en `site` |
| POST | `/api/admin/content/{page}` | admin | content van één pagina (of `site`) opslaan na validatie |
| POST | `/api/admin/content/{page}/vorige-versie` | admin | de `.bak` van de vorige opslag terugzetten |
| POST | `/api/admin/upload` | admin | afbeelding uploaden, geeft het pad terug |

"Admin" betekent: ingelogd én een geldig `X-CSRF-Token`. Dat dwingt
`Middleware/AdminPipeline.php` af voor elk admin-endpoint; er is geen route
die er buitenom bij een controller uitkomt (§9, §11).

### GET /api/content/{page}

Geeft de content van één pagina, plus de sitebrede gegevens uit
`site.json` onder de sleutel `site`. Die zitten er bewust bij in plaats van
achter een eigen endpoint: elke pagina heeft ze nodig voor de footer, en één
verzoek in plaats van twee scheelt een netwerkronde vóór de eerste weergave
(§12, LCP). `site` is niet los op te vragen — `/api/content/site` geeft 404.

Twee dingen gebeuren onderweg in de Service:

- **Aantekeningen worden verwijderd.** Elke sleutel die met `_` begint gaat
  eruit, op elk niveau. Dat is geen opruimwerk maar een eis: in die
  aantekeningen staan interne afwegingen die niet naar buiten horen (§9,
  minimale data-exposure).
- **Lege lijsten vallen weg.** Een `list` zonder items wordt niet
  meegestuurd; die zou anders als kop zonder inhoud op de pagina komen.

## Wat vastligt en getest is

- routering met `{placeholder}`-segmenten, inclusief onderscheid tussen 404
  (pad bestaat niet) en 405 (pad bestaat, methode niet);
- routepatronen worden gevalideerd, zodat een punt of sterretje nooit per
  ongeluk als jokerteken werkt;
- `/contact` en `/contact/` zijn hetzelfde pad (§12, dubbele content);
- fouten gaan naar `storage/logs/error.log`, nooit naar de browser;
- `display_errors` staat uit tenzij `APP_ENV=development`, en een onbekende
  waarde telt als productie;
- de `X-Powered-By`-header met het PHP-versienummer is verwijderd;
- de content-Repository schrijft atomisch, met `flock()`, met backup en met
  validatie vooraf;
- inloggen: generieke foutmelding, lockout na 5 pogingen, nieuw sessie-ID en
  nieuw CSRF-token na een geslaagde login;
- uploads: whitelist op type, inhoud gecontroleerd met `getimagesize()`, nieuwe
  bestandsnaam met `random_bytes()`, groottelimiet;
- een onleesbaar contentbestand geeft een 500 met een neutrale tekst, terwijl
  de werkelijke oorzaak in `storage/logs/error.log` belandt.

## Nog te doen

- Cachingheaders op de content-endpoints (§13). Bewust nog niet gedaan: een
  verkeerd ingestelde cache zou wijzigingen uit het CMS onzichtbaar maken.
- Bij de eerste deploy controleren of `mail()` op de hosting betrouwbaar
  aankomt. Is SMTP nodig, dan betekent dat een dependency, en daar wordt
  eerst toestemming voor gevraagd (§20).
- De `.htaccess`-bestanden zijn lokaal niet te toetsen (hier draait geen
  Apache); controleer ze na de eerste deploy.
