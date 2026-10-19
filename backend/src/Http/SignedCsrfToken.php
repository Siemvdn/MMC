<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Het CSRF-token voor het publieke contactformulier (CLAUDE.md §9, §11, §15).
 *
 * `CsrfToken` leunt op een sessie, en dat is voor een bezoeker die alleen het
 * contactformulier gebruikt precies één cookie te veel — en dus meteen een
 * discussie over een cookiebanner. Dit token draagt zijn eigen bewijs: het is
 * ondertekend met `APP_SECRET`, dus wie het secret niet kent kan er geen
 * geldig exemplaar van namaken, en het draagt zijn eigen tijdstip mee in
 * plaats van dat er iets over onthouden hoeft te worden.
 */
final class SignedCsrfToken
{
    /**
     * Ruim genoeg om het formulier in alle rust in te vullen, kort genoeg dat
     * een onderschept token niet blijvend bruikbaar blijft.
     */
    private const TTL_SECONDS = 7200;

    public function __construct(private readonly string $secret)
    {
    }

    /** @return string "<tijdstip>.<handtekening>" */
    public function issue(): string
    {
        $timestamp = (string) time();

        return $timestamp . '.' . $this->signature($timestamp);
    }

    /**
     * Geldig als de handtekening bij het tijdstip past én dat tijdstip niet
     * langer dan `TTL_SECONDS` geleden is. Er is niets om op te zoeken — een
     * geknoeid token valt al af op de handtekening, dus een verlopen bestand
     * of een tweede keer gebruiken hoeft nergens bijgehouden te worden.
     */
    public function verify(?string $token): bool
    {
        if (!is_string($token) || $token === '') {
            return false;
        }

        $parts = explode('.', $token, 2);

        if (count($parts) !== 2) {
            return false;
        }

        [$timestamp, $signature] = $parts;

        if (!ctype_digit($timestamp)) {
            return false;
        }

        if (!hash_equals($this->signature($timestamp), $signature)) {
            return false;
        }

        return time() - (int) $timestamp <= self::TTL_SECONDS;
    }

    private function signature(string $timestamp): string
    {
        return hash_hmac('sha256', $timestamp, $this->secret);
    }
}
