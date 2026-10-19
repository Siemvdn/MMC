# Validators

**Verantwoordelijkheid:** controleren of binnengekomen gegevens de vorm
hebben die we verwachten, en dat rapporteren zonder zelf te beslissen wat er
daarna gebeurt.

De frontend valideert ook, maar dat is voor het gemak van de bezoeker. Deze
laag is de echte controle: client-side validatie is nooit de enige
beveiliging (CLAUDE.md §7, §11).

Twee soorten werk komen hier terecht:

- invoer van formulieren (contactaanvraag, login);
- de structuur van een content-JSON vóórdat een repository hem wegschrijft.
