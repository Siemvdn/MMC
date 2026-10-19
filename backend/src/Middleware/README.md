# Middleware

**Verantwoordelijkheid:** controles die vóór een controller draaien en het
verzoek kunnen tegenhouden — authenticatie, CSRF-controle, rate limiting,
CORS.

Elk admin-endpoint wordt hier beveiligd. CLAUDE.md §9 en §11 zijn daar
expliciet over: autorisatie wordt server-side gecontroleerd op élk
admin-endpoint. Nooit vertrouwen op het feit dat de frontend een knop niet
toont, en nooit op "de link is niet zichtbaar".

Rate limiting hoort minimaal op het login-endpoint en het contactformulier
(§9, §11).
