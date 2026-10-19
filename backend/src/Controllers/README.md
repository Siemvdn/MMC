# Controllers

**Verantwoordelijkheid:** één laag dun. Een controller leest het verzoek,
roept één service aan, en zet het resultaat om in een `JsonResponse`.

**Hoort hier niet:** business-logica, validatie-regels, en alles wat met
bestanden of opslag te maken heeft. Als een controller begint te rekenen of
te beslissen, hoort dat stuk in een service.

**Vuistregel:** een controllermethode die langer is dan een schermvol, doet
te veel.
