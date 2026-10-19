# Http

**Verantwoordelijkheid:** de HTTP-laag — verzoeken inlezen, routes koppelen,
antwoorden in het vaste formaat versturen.

- `Request` — het verzoek teruggebracht tot methode en pad. Dankzij dit
  object hoeft de rest van de code niets te weten van superglobals, en is
  routering testbaar zonder webserver.
- `Router` — koppelt methode plus pad aan een handler. Bewust minimaal: zes
  endpoints (§9) rechtvaardigen geen routeringsframework.
- `JsonResponse` — het antwoordformaat uit §9, in één class zodat geen enkel
  endpoint zijn eigen variant kan verzinnen.
- `ErrorCode` — de foutcodes als enum (§8).

## Afwijking van CLAUDE.md §5

Deze map staat **niet** in de mappenlijst van §5. Die noemt Controllers,
Services, Repositories, Middleware, Validators, Config en Utils.

De reden om hem toch toe te voegen: een router en een antwoordformaat horen
in geen van die zeven thuis. Een router is geen controller (hij bevat geen
enkel endpoint) en zeker geen util. Ze in `Utils/` proppen zou §5 formeel
volgen maar de bedoeling ervan — één duidelijke verantwoordelijkheid per map
— juist ondermijnen.

Dit is bewust gemeld en niet stilzwijgend gedaan.
