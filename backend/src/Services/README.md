# Services

**Verantwoordelijkheid:** de business-logica. Hier staat wát er moet
gebeuren: content ophalen en klaarmaken voor de frontend, een aanvraag
valideren en tot een e-mail samenstellen, een wijziging controleren voordat
hij opgeslagen wordt.

**Hoort hier niet:** kennis van HTTP (statuscodes, headers, `$_POST`) en
kennis van hoe content is opgeslagen. Het eerste hoort in de controller, het
tweede achter een repository.

Dankzij die scheiding blijft een service testbaar zonder webserver en zonder
bestandssysteem.
