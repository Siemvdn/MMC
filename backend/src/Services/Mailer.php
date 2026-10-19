<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Verstuurt één e-mail.
 *
 * Een eigen grens om `mail()` heen, om dezelfde reden als `AtomicJsonFile` een
 * grens om `rename()`/`flock()` legt: de aanroep zelf is niet zinvol te testen
 * zonder een echte mailserver, dus een test geeft hier een eigen
 * implementatie mee die niets verstuurt maar wel onthoudt wat er gevraagd
 * werd. Mocht `mail()` op de hosting niet betrouwbaar blijken, dan komt
 * er een SMTP-implementatie van deze
 * interface bij zonder dat `ContactService` verandert.
 */
interface Mailer
{
    /** `$replyTo` is het adres van de bezoeker, zodat beantwoorden bij de bezoeker uitkomt en niet bij de site. */
    public function send(string $to, string $from, string $replyTo, string $subject, string $body): bool;
}
