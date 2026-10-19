# Content-JSON's

Eén bestand per pagina — `home.json`, `over-ons.json`, `projecten.json`,
`contact.json`, `privacy.json`, `terms.json` — plus `site.json` voor wat op álle pagina's
terugkomt. Deze map staat buiten de webroot en is dus niet via de browser op
te vragen (CLAUDE.md §10).

`privacy.json` (privacyverklaring, §15) en `terms.json`
(algemene voorwaarden) zijn gewone pagina's zoals de andere vier — zelfde
sectiesysteem, zelfde Validator — maar staan bewust niet in de
hoofdnavigatie, alleen in de footer.

Dit bestand beschrijft de structuur die de Validator afdwingt. Verandert er
iets aan de vorm, dan verandert het hier mee — in dezelfde commit (§19).

## Opbouw van een bestand

```json
{
  "_todo": ["..."],
  "meta": { "title": "", "description": "" },
  "sections": [ { "type": "...", "...": "..." } ]
}
```

| Sleutel | Verplicht | Betekenis |
|---|---|---|
| `_todo` | nee | Openstaande punten, in gewone taal. Zie hieronder. |
| `meta.title` | ja | De paginatitel. Uniek per pagina (§12). |
| `meta.description` | ja | De meta description. Uniek per pagina (§12). |

### Het `meta`-blok is niet voor het CMS

Deze twee velden zijn de enige bron voor de titel en beschrijving van een
pagina. De bouwstap zet ze in het bijbehorende HTML-bestand, zodat een
crawler ze zonder JavaScript leest.

Daardoor werkt een wijziging hier **pas na een nieuwe build en deploy**. Het
CMS moet daarom alleen `sections` aanbieden: een veld dat lijkt te werken
maar niets verandert op de site, is erger dan geen veld.

Zolang ze leeg zijn waarschuwt elke build erover, en blijft de terugvaltitel
uit het HTML-bestand staan.
| `sections` | ja | De inhoud, op volgorde van weergave. |

## Sleutels die met een underscore beginnen

`_todo` is geen content maar een aantekening voor de ontwikkelaar en de
klant. Afspraak: **elke sleutel die met `_` begint wordt nooit gerenderd**.
Zo staat een openstaand punt zichtbaar in het bestand waar het over gaat, in
plaats van in een los lijstje dat niemand meer opent — JSON kent immers geen
commentaar.

Een `_todo` mag zowel bovenaan het bestand staan (geldt voor de hele pagina)
als binnen één sectie (geldt alleen voor die sectie).

## Sectietypes

Acht types, bewust weinig. Elk type heeft een vaste set velden. De eerste
vijf zijn algemeen; `members`, `projects` en `teaser` horen bij de leden- en
projectenpagina en de vooruitblikken daarop.

### `background` — bij elk type
Elke sectie heeft `background`: `light` (de gewone achtergrond van de
pagina) of `tinted` (een getint vlak over de volle breedte). Welke kleur
dat precies is, bepaalt het design via de tokens in
`frontend/src/styles/tokens.css` — niet de content.

Dit stond eerst in een automatische regel in de frontend, op basis van
sectietype en positie. Die regel is vervallen: welke blokken een vlak
verdienen hangt af van wat erin staat, en dat weet alleen degene die de tekst
schrijft. Twee getinte vlakken onder elkaar lopen samen tot één groot vlak — dat
mag, maar het is dan een keuze en geen bijwerking.

Bij een `hero` met `layout: banner` én een foto doet het veld niets: die foto
vult de hele sectie. Zonder foto valt die kop terug op de gewone indeling, en
dan telt de achtergrond weer wel.

### `hero`
De kop van een pagina. Staat altijd bovenaan en krijgt de enige `h1`.

| Veld | Type | Toelichting |
|---|---|---|
| `kicker` | string | Bovenkopje in kapitalen |
| `heading` | string | De grote kop |
| `text` | string | Inleidende alinea |
| `image` | string of `null` | Pad onder `/uploads/`, of `null` |
| `imageAlt` | string | Verplicht zodra `image` gevuld is (§14) |
| `layout` | `beside` of `banner` | Foto naast de tekst, of breed met de tekst eroverheen |
| `textColor` | `dark` of `light` | Alleen van belang bij `banner`: de kleur van de tekst op de foto |
| `actions` | lijst | Hoogstens twee knoppen; leeg betekent geen knoppen |

Een `banner` zonder foto valt terug op de indeling `beside`. Dat is geen
randgeval maar de normale toestand zolang er nog geen foto geüpload is.

De tekstkleur is een keuze en geen berekening: of wit of zwart leesbaar is
hangt af van wat er toevallig op de foto staat.

Elke knop in `actions` heeft `label` (de tekst, hoogstens 40 tekens) en
`target` — een van `home`, `over-ons`, `projecten` of `contact`. Bewust een pagina van deze
site en geen vrij adres: dat scheelt het intypen van een URL, en daarmee de
meest gemaakte fout. De eerste knop wordt opvallend weergegeven, de tweede
rustig; twee even opvallende knoppen maken van één duidelijke vervolgstap
twee gelijkwaardige.

### `prose`
Een kop met een alinea, eventueel met afbeelding. Het werkpaard van de
meeste pagina's.

Velden: `heading`, `text`, `image`, `imageAlt`, `imagePosition`.

`imagePosition` is `left` of `right` en bepaalt aan welke kant van de tekst
de foto komt te staan. Verplicht, ook zonder foto: zo hoeft de beheerder niet
opnieuw te kiezen zodra hij er later een toevoegt.

### `quote`
Een uitgelicht citaat met een korte toelichting, eventueel met een
foto-carrousel. Voor een uitspraak die niet in een gewoon tekstblok past.

Velden: `text`, `supportingText`, `images`, `imagePosition`.

`text` is het citaat zelf, `supportingText` de korte alinea eronder. Er is
bewust geen `heading`: een citaat opent geen nieuw onderwerp op de pagina, dus
krijgt deze sectie geen eigen kop. `imagePosition` werkt hetzelfde als bij
`prose`.

`images` is een lijst van hoogstens tien foto's, elk `{ image, imageAlt }`.
Anders dan het losse afbeeldingsveld elders is hier geen foto nooit `null`:
een lege plek laat je gewoon weg. Eén foto toont gewoon die ene foto; twee of
meer worden een carrousel die automatisch doorschuift (elke tien seconden) en
met knoppen en bolletjes ook met de hand te bedienen is. Bezoekers die
`prefers-reduced-motion` aan hebben staan krijgen geen automatische wisseling
— alleen de handbediening blijft dan werken (§14).

### `list`
Een kop met een intro en een reeks gelijkvormige items.

Velden: `heading`, `intro`, `variant`, `items`.

`variant` bepaalt de vorm:

| Waarde | Vorm | Waarvoor |
|---|---|---|
| `cards` | losse kaarten naast elkaar | dingen die naast elkaar bestaan |
| `steps` | genummerde stappen | dingen die op volgorde gaan, zoals een werkwijze |
| `timeline` | bolletjes op een lijn, met `title` erboven en `text` eronder | een verloop door de tijd |

Bij `steps` en `timeline` wordt een `<ol>` gerenderd en geen `<ul>`: de
volgorde is daar de betekenis, en die hoort in het element te zitten en niet
alleen in de cijfers of bolletjes die je ziet. Die decoratie staat buiten de
voorleesvolgorde — een schermlezer nummert de lijst al (§14).

`timeline` staat op een brede foto horizontaal, met de lijn erachter; onder de
mobiele breedte (zelfde grens als de kaarten) staat hij verticaal, anders past
er op een telefoon geen leesbare tekst meer naast elk punt.

| Veld | Type | Toelichting |
|---|---|---|
| `heading` | string | |
| `intro` | string | Mag leeg zijn |
| `items` | array | Elk item heeft `title` en `text` |

Een lege `items`-array is geldig en betekent: nog niet aangeleverd (zie
"Lege lijsten" hieronder).

### `cta`
Het afsluitende blok met een knop.

Velden: `heading`, `text`, `buttonLabel`.

### `members`
De leden van het collectief, op de Over ons-pagina.

Velden: `heading`, `intro` (mag leeg), `members`.

Elk lid in `members` (hoogstens 40):

| Veld | Type | Toelichting |
|---|---|---|
| `name` | string | Verplicht, niet leeg |
| `specialty` | string | Mag leeg; dan valt die regel weg |
| `website` | string | Leeg = geen link. Gevuld: een volledig adres dat begint met `https://` of `http://` |
| `image` | string of `null` | Portretfoto, pad onder `/uploads/` |
| `imageAlt` | string | Verplicht zodra `image` gevuld is (§14) |

Het webadres is het enige vrij in te vullen adres in de content. Daarom
alleen `http`/`https`: een `javascript:`-adres in een link is een XSS-lek
(CLAUDE.md §11). De frontend controleert dat nog een keer voordat hij de link
toont, en opent hem in een nieuw tabblad met `rel="noopener noreferrer"`.

De volgorde is de volgorde op de site. De eerste vier staan ook in de
vooruitblik op de homepage.

### `projects`
De projecten van de leden, op de Projecten-pagina.

Velden: `heading`, `intro` (mag leeg), `projects`.

Elk project in `projects` (hoogstens 30):

| Veld | Type | Toelichting |
|---|---|---|
| `title` | string | Verplicht, niet leeg |
| `maker` | string | Mag leeg. Gewone tekst en geen koppeling aan een lid: die zou breken zodra een lid vertrekt |
| `category` | string | Soort project, mag leeg |
| `description` | string | Korte beschrijving, hoogstens 600 tekens, mag leeg |
| `image` | string of `null` | Pad onder `/uploads/` |
| `imageAlt` | string | Verplicht zodra `image` gevuld is (§14) |

Het eerste project wordt groot getoond als uitgelicht project, met zijn
beschrijving ernaast; de rest staat als kaarten eronder. Een ander project
uitlichten is dus: het bovenaan zetten. De eerste drie staan ook in de
vooruitblik op de homepage.

### `teaser`
Een vooruitblik op de leden of de projecten, bijvoorbeeld op de homepage.

Velden: `heading`, `source`, `linkLabel`.

`source` is `members` (de eerste vier leden uit `over-ons.json`) of
`projects` (de eerste drie projecten uit `projecten.json`). De sectie bevat
zelf geen items, alleen die verwijzing: zo staan de gegevens op één plek, en
verschijnt een nieuw lid vanzelf ook op de homepage. De frontend haalt de
items op via `GET /api/content/{page}`; is de lijst daar leeg, dan toont hij
de vooruitblik niet. `linkLabel` is de tekst op de link naar die pagina
(hoogstens 40 tekens).

### Lege lijsten
Een `list` zonder items, een `members` zonder leden en een `projects` zonder
projecten zijn geldig en betekenen: nog niet aangeleverd. De publieke API
laat zo'n sectie weg, zodat er geen kop zonder inhoud op de site staat.

## `site.json` — wat op elke pagina terugkomt

Dit bestand heeft géén `sections`. Het bevat de gegevens die op alle
pagina's gelijk moeten zijn:

| Sleutel | Betekenis |
|---|---|
| `businessName` | De merknaam in de header en in het schema |
| `contact.phone` | Telefoonnummer |
| `contact.email` | E-mailadres |
| `contact.area` | Werkgebied |
| `sameAs` | Links naar Google Business Profile en social media |

Waarom apart en niet in `contact.json`: deze gegevens staan in de footer op
élke pagina en voeden het `LocalBusiness`-schema. §12 eist dat ze exact
gelijk zijn aan het Google Business Profile — met één bron kunnen ze niet uit
elkaar gaan lopen. Dat weegt hier zwaarder dan de letter van "één bestand per
pagina" uit §10.

Zolang `businessName` en `contact` leeg zijn, mag het `LocalBusiness`-schema
niet gegenereerd worden. Halve of verzonnen NAP-gegevens zijn schadelijker
dan geen schema.

## Waarom een `type` per sectie

De opzet in §10 schetst secties met `heading`, `text` en `image`. Dat dekt een
tekstpagina, maar niet een homepage: een lijst diensten bestaat uit losse
items, en het CTA-blok heeft een knoptekst. Die in één alinea platslaan zou
de structuur weggooien die de pagina nodig heeft.

Met een `type`-veld blijft het één array — het CMS kan er gewoon doorheen
lopen en secties toevoegen — terwijl elk type zijn eigen validatie krijgt.

Deze afwijking van §10 is voorgelegd en goedgekeurd, en staat vastgelegd in
CLAUDE.md §10 zelf.

## Wat er nog ontbreekt

De bestanden in deze map zijn seeds: hetzelfde schema, maar met
`[TODO: …]` op elke plek waar klantcontent hoort. Alle open punten staan in
de `_todo`-lijsten in de bestanden zelf. Kort samengevat: alle teksten, alle
`meta`-teksten, de NAP-gegevens in `site.json` en de foto's.

Let op het verschil tussen de twee soorten plaatsvervangers:

- **Tekstvelden** krijgen `[TODO: …]`. Zo zie je op de pagina meteen waar
  nog iets moet komen.
- **De NAP-velden in `site.json`** blijven leeg. Leeg betekent voor de code
  "nog niet aangeleverd": de footer toont een plaatsvervanger en het
  `LocalBusiness`-schema wordt overgeslagen. Een tekst als `[TODO]` zou als
  echt telefoonnummer in het schema belanden (§12).
