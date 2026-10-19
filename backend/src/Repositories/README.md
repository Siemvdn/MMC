# Repositories

**Verantwoordelijkheid:** de enige laag die de content-JSON's in
`storage/content/` leest en schrijft (CLAUDE.md §8, §10).

Waarom die strengheid: er is bewust geen database gekozen, maar dat kan
veranderen zodra er data bij komt die relaties of zoekopdrachten nodig heeft.
Zolang alleen deze laag weet hóé content is opgeslagen, verandert bij zo'n
overstap alleen deze map — niet de controllers en niet de services.

Het schrijven moet aan vier eisen voldoen (§10), en die staan er vanaf het
begin in plaats van als latere toevoeging:

- atomisch schrijven via een tijdelijk bestand plus `rename()`;
- `flock()` tegen gelijktijdig schrijven;
- automatische backup van de vorige versie;
- validatie tegen de verwachte structuur vóór er iets weggeschreven wordt.

Corrupte JSON mag niet kunnen ontstaan, ook niet als een schrijfactie
halverwege afbreekt.

## Wat er staat

| Bestand | Rol |
|---|---|
| `ContentFile` | Enum met de contentbestanden die bestaan. Tevens de bescherming tegen padmanipulatie: de repository stelt nooit een bestandsnaam samen uit binnengekomen tekst. |
| `ContentRepository` | Lezen en schrijven. |
| `ContentNotFound` | Het bestand bestaat niet — wordt een 404. |
| `ContentUnavailable` | Het bestand is onleesbaar of het schrijven mislukte — wordt een 500. |
| `InvalidContent` | De structuur klopt niet. Draagt alle validatiefouten mee, niet alleen de eerste. |

## Waarom lezen geen lock nodig heeft

Elke schrijfactie eindigt met een `rename()`, en dat is één ondeelbare stap.
Een lezer ziet daardoor altijd het volledige oude óf het volledige nieuwe
bestand, nooit iets halfs. Een leeslock zou alleen vertraging toevoegen.

Het slot bij het schrijven ligt om diezelfde reden op een apart
`.lock`-bestand en niet op het contentbestand zelf: dat wordt tijdens het
schrijven vervangen, waarmee een slot erop zijn betekenis zou verliezen.

## Wat de volgorde bij schrijven doet

1. **Valideren.** Klopt de structuur niet, dan stopt het hier en is er niets
   op schijf gewijzigd.
2. **Naar JSON omzetten.** Mislukt dat, dan idem.
3. **Slot nemen.**
4. **Backup maken.** Mislukt de kopie, dan gaat de schrijfactie niet door —
   §10 eist een backup bij elke update, en doorgaan zonder zou betekenen dat
   een foutieve wijziging niet terug te draaien is.
5. **Tijdelijk bestand schrijven, rechten zetten, hernoemen.** Gaat er iets
   mis, dan wordt het tijdelijke bestand opgeruimd en blijft het echte
   bestand ongemoeid.
6. **Slot vrijgeven** — in een `finally`, dus ook als er iets misging.
