# Config

**Verantwoordelijkheid:** configuratie en paden inlezen en beschikbaar
stellen. Dit is de enige map die weet dat er een `.env`-bestand bestaat en
waar de mappen op schijf staan.

- `Config` — leest `.env`. Ontbreekt dat bestand, dan gelden de defaults, en
  die wijzen altijd de veilige kant op (productie, geen zichtbare fouten).
- `Environment` — productie of ontwikkeling, als enum in plaats van losse
  strings.
- `Paths` — alle mappaden op één plek, zodat nergens anders in de code een
  pad wordt samengesteld.

Secrets staan nooit in de broncode (CLAUDE.md §11, §20).
