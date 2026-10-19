<?php

declare(strict_types=1);

namespace App\Tests\Services;

use App\Services\Mailer;

/**
 * Verstuurt niets, onthoudt alleen wat er gevraagd werd.
 *
 * `mail()` zelf is niet zinvol te testen zonder een echte mailserver; deze
 * dubbelganger is de seam die `ContactService` daarvoor gebruikt.
 */
final class FakeMailer implements Mailer
{
    /** @var list<array{to: string, from: string, replyTo: string, subject: string, body: string}> */
    public array $sent = [];

    public bool $shouldSucceed = true;

    public function send(string $to, string $from, string $replyTo, string $subject, string $body): bool
    {
        $this->sent[] = [
            'to' => $to,
            'from' => $from,
            'replyTo' => $replyTo,
            'subject' => $subject,
            'body' => $body,
        ];

        return $this->shouldSucceed;
    }
}
