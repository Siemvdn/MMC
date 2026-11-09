/**
 * Zet alles klaar om met FileZilla naar de hosting te uploaden (CLAUDE.md §18).
 *
 * Bouwt een map `deploy/` in de projectroot die precies zo is opgebouwd als
 * de webroot op de server. Je sleept dan in één keer de inhoud van die map
 * naar de webroot, in plaats van vier mappen los op de goede plek te zetten
 * en `public/` onderweg te hernoemen naar `api/`.
 *
 *   npm run deploy:prepare                  een update
 *   npm run deploy:prepare -- --eerste-keer  de allereerste upload
 *
 * Bij een update zit `storage/` er bewust niet in: de content op de server
 * wordt door de klant via het beheer gewijzigd, en die mag een upload nooit
 * overschrijven. Alleen de eerste keer gaan de contentbestanden mee.
 *
 * Wat er nooit in komt: `.env` (die maak je op de server zelf aan), tests,
 * `tools/`, lokale sessies, logs, inlogpogingen en lokaal geüploade foto's.
 */

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT = dirname(FRONTEND);
const BACKEND = join(ROOT, 'backend');
const DIST = join(FRONTEND, 'dist');
const DEPLOY = join(ROOT, 'deploy');

const FIRST_DEPLOY = process.argv.includes('--eerste-keer');

/**
 * De naam van `backend/public/` op de server. Elke route is `/api/...`, en dat
 * werkt alleen als de map ook zo heet (§18).
 */
const API_FOLDER = 'api';

/** Mappen in `storage/` die op de server moeten bestaan, maar altijd leeg vertrekken. */
const RUNTIME_FOLDERS = ['logs', 'sessions', 'rate-limit'];

/** Wat er van de uploadmap mee mag: alleen de beveiliging, nooit lokale testfoto's. */
const UPLOADS_KEEP = '.htaccess';

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('frontend/dist ontbreekt. Gebruik npm run deploy:prepare, dat bouwt eerst.');
  process.exit(1);
}

rmSync(DEPLOY, { recursive: true, force: true });
mkdirSync(DEPLOY);

// De publieke site, inclusief de .htaccess in de webroot.
cpSync(DIST, DEPLOY, { recursive: true });

// backend/public/ wordt api/.
const backendPublic = join(BACKEND, 'public');
cpSync(backendPublic, join(DEPLOY, API_FOLDER), {
  recursive: true,
  filter: (source) => {
    const path = relative(backendPublic, source);
    const insideUploads = path.startsWith(`uploads${sep}`);

    return !insideUploads || basename(path) === UPLOADS_KEEP;
  },
});

// De PHP-code, naast api/ en niet erin: index.php zoekt hem één map hoger.
cpSync(join(BACKEND, 'src'), join(DEPLOY, 'src'), { recursive: true });

if (FIRST_DEPLOY) {
  copyStorageForFirstDeploy();
}

printNextSteps();

function copyStorageForFirstDeploy() {
  const storage = join(BACKEND, 'storage');
  const target = join(DEPLOY, 'storage');

  mkdirSync(join(target, 'content'), { recursive: true });
  cpSync(join(storage, '.htaccess'), join(target, '.htaccess'));

  for (const file of readdirSync(join(storage, 'content'))) {
    if (file.endsWith('.json')) {
      cpSync(join(storage, 'content', file), join(target, 'content', file));
    }
  }

  for (const folder of RUNTIME_FOLDERS) {
    mkdirSync(join(target, folder));
  }
}

function printNextSteps() {
  const kind = FIRST_DEPLOY ? 'eerste upload, mét storage/' : 'update, zonder storage/';

  console.log(`
deploy/ staat klaar (${kind}).

In FileZilla:
  1. Links:  open ${DEPLOY}
  2. Rechts: open de webroot van het domein (bij Strato: /MMC)
  3. Selecteer links alles (Ctrl+A) en sleep het naar rechts.
  4. Kies bij "Doelbestand bestaat al": Overschrijven, en vink
     "Altijd deze actie gebruiken" aan.
${
  FIRST_DEPLOY
    ? '\nMaak daarna op de server de .env aan in de webroot (zie backend/.env.example).\n'
    : '\nstorage/ zit er niet in: de content die de klant in het beheer heeft gezet, blijft staan.\n'
}`);
}
