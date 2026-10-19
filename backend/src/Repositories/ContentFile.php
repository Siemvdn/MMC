<?php

declare(strict_types=1);

namespace App\Repositories;

/**
 * De contentbestanden die bestaan.
 *
 * Dit is niet alleen netjes maar ook de beveiliging tegen padmanipulatie: de
 * repository stelt nooit een bestandsnaam samen uit binnengekomen tekst.
 * Een verzoek om `../../.env` komt simpelweg niet door `tryFrom()` heen en
 * bereikt het bestandssysteem dus nooit (CLAUDE.md §11).
 */
enum ContentFile: string
{
    case Home = 'home';
    case About = 'over-ons';
    case Contact = 'contact';
    case Privacy = 'privacy';
    case Terms = 'terms';
    case Site = 'site';

    public function filename(): string
    {
        return $this->value . '.json';
    }

    /**
     * `site` is geen pagina maar sitebrede gegevens, en heeft daarom een
     * andere structuur en een andere validator.
     */
    public function isPage(): bool
    {
        return $this !== self::Site;
    }
}
