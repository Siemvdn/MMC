<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Verstuurt met PHP's ingebouwde `mail()` — geen dependency, zoals CLAUDE.md
 * §3 als uitgangspunt neemt. Of dit op de hosting betrouwbaar aankomt moet
 * bij de eerste deploy getest worden; blijkt dat niet zo,
 * dan komt er een SMTP-implementatie van `Mailer` bij, met toestemming voor de
 * dependency die dat vraagt (§20).
 */
final class NativeMailer implements Mailer
{
    public function send(string $to, string $from, string $replyTo, string $subject, string $body): bool
    {
        $headers = sprintf(
            "From: %s\r\nReply-To: %s\r\nContent-Type: text/plain; charset=utf-8",
            $from,
            $replyTo,
        );

        return mail($to, $subject, $body, $headers);
    }
}
