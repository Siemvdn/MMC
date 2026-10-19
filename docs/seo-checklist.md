# SEO-checklist

Voortbouwend op CLAUDE.md §12. Afvinken vóór en na livegang.

## Al in de code (bij elke build)

- [x] Unieke `<title>` en meta description per pagina, uit `meta` in de content-JSON.
- [x] Absolute canonical, Open Graph-tags en `twitter:card` per pagina (`frontend/vite-seo.ts`).
- [x] LocalBusiness-schema (JSON-LD) op de homepage, uit `site.json`. Wordt alleen gemaakt als naam, telefoon, e-mail en werkgebied gevuld zijn. Bewust zonder straatadres.
- [x] `robots.txt`, `sitemap.xml` en `llms.txt` in `frontend/public/`.
- [x] Eigen 404-pagina (`404.html`) met statuscode 404 via `ErrorDocument` in `.htaccess`.

## Bij elke deploy

- [ ] `lastmod` in `sitemap.xml` bijwerken voor pagina's die inhoudelijk wijzigden.
- [ ] Wijzigde `site.json` (naam, telefoon, e-mail, werkgebied)? Dan is een nieuwe build nodig: het schema wordt bij het bouwen gemaakt, de voettekst leest live.
- [ ] Wijzigde `meta` in een content-JSON? Ook een nieuwe build; het beheer kan dit niet aanpassen.

## Vóór livegang

- [ ] Alle `[TODO]`-plekken weggewerkt: `grep -rn "TODO" --exclude-dir=node_modules .` geeft niets meer in content, `frontend/public/` en `frontend/src/constants/`.
- [ ] Domein ingevuld in `SITE_ORIGIN` (`frontend/src/constants/site.ts`), `robots.txt`, `sitemap.xml` en `llms.txt`.
- [ ] `meta.title` en `meta.description` per pagina ingevuld; de build waarschuwt niet meer.
- [ ] AI-crawlerbeleid in `robots.txt` bevestigd met de klant (nu: toestaan).
- [ ] `llms.txt` met de klant doorgelopen. Alles erin wordt letterlijk door AI-systemen overgenomen; alleen bevestigde feiten uit CLAUDE.md §2.
- [ ] Schema controleren met Google's Rich Results Test op de live homepage.
- [ ] 404-pagina testen: een onbekend adres moet de eigen pagina tonen én status 404 geven.
- [ ] PageSpeed Insights op mobiel en desktop: LCP < 2,5 s, INP < 200 ms, CLS < 0,1.
- [ ] HSTS pas aanzetten nadat https op het echte domein werkt (zie `.htaccess`).

## Na livegang

- [ ] Google Business Profile aanmaken. Naam, telefoon en werkgebied letterlijk gelijk aan Bedrijfsgegevens in het beheer.
- [ ] Links van het profiel en eventuele social media in `site.json` onder `sameAs`, daarna opnieuw bouwen.
- [ ] Google Search Console koppelen en de sitemap indienen.
- [ ] GA4 alleen met cookiebanner met opt-in (§15). Eerst bepalen of het nodig is.

## Open beslissingen

- **Deelafbeelding:** nog `[TODO]`. Een liggende foto van 1200 × 630 staat het mooist in WhatsApp en Facebook. Welke foto of welk logo, bepaalt de klant (CLAUDE.md §2). Aanpassen via `SOCIAL_IMAGE_PATH` in `frontend/src/constants/site.ts`; zet dan ook `twitter:card` op `summary_large_image` in `vite-seo.ts`.
- **Straatadres in het schema:** nu niet. Alleen toevoegen als de klant een adres openbaar wil maken, en dan overal exact gelijk (site, schema, Google Business Profile).
- **Schema-type:** nu `LocalBusiness` (`SCHEMA_BUSINESS_TYPE` in `frontend/src/constants/site.ts`). Een specifieker subtype alleen als het aantoonbaar klopt met wat de klant doet.
