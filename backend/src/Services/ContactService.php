<?php

declare(strict_types=1);

namespace App\Services;

use App\Config\Config;
use App\Utils\Logger;
use App\Validators\ContactValidator;

/**
 * Het contactformulier: valideert, verstuurt een mail, en bewaart niets
 * (CLAUDE.md §10, §15 — en de belofte op de contactpagina zelf).
 */
final class ContactService
{
    public const RATE_LIMIT_BUCKET = 'contact';

    private const SUBJECT = 'Nieuwe aanvraag via het contactformulier';

    public function __construct(
        private readonly Config $config,
        private readonly ContactValidator $validator,
        private readonly RateLimiter $rateLimiter,
        private readonly Mailer $mailer,
        private readonly Logger $logger,
    ) {
    }

    /** @param array<array-key, mixed> $body */
    public function send(array $body, string $clientIp): ContactResult
    {
        if ($this->rateLimiter->isBlocked(self::RATE_LIMIT_BUCKET, $clientIp)) {
            return ContactResult::blocked();
        }

        /*
         * Elke poging telt mee, ook een geldige. Anders dan bij inloggen is er
         * hier geen "juist antwoord" dat de teller weer op nul zet — het doel
         * is spam beperken, niet raden tegenhouden.
         */
        $this->rateLimiter->registerFailure(self::RATE_LIMIT_BUCKET, $clientIp);

        $validation = $this->validator->validate($body);

        if (!$validation->isValid()) {
            return ContactResult::invalid($validation->errors());
        }

        $submission = ContactSubmission::fromValidatedBody($body);

        $to = $this->config->get('MAIL_TO');
        $from = $this->config->get('MAIL_FROM');

        if ($to === '' || $from === '') {
            $this->logger->error(
                'Contactformulier kan geen mail versturen: MAIL_TO of MAIL_FROM ontbreekt in .env.',
            );

            return ContactResult::mailFailed();
        }

        $sent = $this->mailer->send(
            $to,
            $from,
            $submission->email,
            self::SUBJECT,
            self::bodyFor($submission),
        );

        if (!$sent) {
            $this->logger->error('Het versturen van de contactmail is mislukt.');

            return ContactResult::mailFailed();
        }

        return ContactResult::success();
    }

    private static function bodyFor(ContactSubmission $submission): string
    {
        return implode("\n", [
            sprintf('Naam: %s', $submission->name),
            sprintf('E-mailadres: %s', $submission->email),
            '',
            $submission->message,
        ]);
    }
}
