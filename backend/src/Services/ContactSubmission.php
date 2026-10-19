<?php

declare(strict_types=1);

namespace App\Services;

/**
 * De gevalideerde inhoud van één contactaanvraag.
 *
 * Bestaat pas ná een geslaagde `ContactValidator::validate()` — de velden
 * hoeven dus niet nogmaals gecontroleerd te worden, alleen samengevoegd.
 */
final class ContactSubmission
{
    private function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $message,
    ) {
    }

    /** @param array<array-key, mixed> $body */
    public static function fromValidatedBody(array $body): self
    {
        return new self(
            name: trim((string) $body['name']),
            email: trim((string) $body['email']),
            message: trim((string) $body['message']),
        );
    }
}
