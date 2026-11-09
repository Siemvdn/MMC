<?php

declare(strict_types=1);

namespace App\Validators;

/**
 * Controleert de contactgegevens van een lid: eigen website, telefoon en
 * e-mail. Alle drie mogen leeg zijn of ontbreken; dan toont de site ze niet.
 *
 * Staat los van EntryListValidator omdat elk van de drie een eigen vorm
 * heeft, en omdat ze alle drie als link op de site komen: wat hier doorheen
 * komt, belandt in een `href` (CLAUDE.md §11).
 */
final class MemberContactValidator
{
    /**
     * Een eigen site van een lid is het enige vrij in te vullen adres in de
     * content. Alleen deze twee schema's mogen: een `javascript:`-adres in een
     * link is een XSS-lek (CLAUDE.md §11).
     */
    private const WEBSITE_SCHEMES = ['http', 'https'];

    /** Cijfers, spaties, haakjes en streepjes, met eventueel een + vooraan. */
    private const PHONE_PATTERN = '/^\+?[0-9 ()\-]+$/';

    /**
     * Een Nederlands vast of mobiel nummer heeft tien cijfers; internationaal
     * zijn het er hoogstens vijftien (E.164). Minder dan zes is een tikfout.
     */
    private const PHONE_MIN_DIGITS = 6;
    private const PHONE_MAX_DIGITS = 15;

    /** @param array<array-key, mixed> $entry */
    public function check(array $entry, string $where, ValidationResult $result): void
    {
        $this->checkWebsite($entry['website'] ?? null, $where, $result);
        $this->checkPhone($entry['phone'] ?? null, $where, $result);
        $this->checkEmail($entry['email'] ?? null, $where, $result);
    }

    /** Leeg betekent: geen eigen site. Gevuld moet het een volledig webadres zijn. */
    private function checkWebsite(mixed $website, string $where, ValidationResult $result): void
    {
        if (!is_string($website) || $website === '') {
            return;
        }

        $scheme = strtolower((string) parse_url($website, PHP_URL_SCHEME));

        if (
            filter_var($website, FILTER_VALIDATE_URL) === false
            || !in_array($scheme, self::WEBSITE_SCHEMES, true)
        ) {
            $result->add(sprintf(
                '%s: het webadres moet volledig zijn en beginnen met https:// (of http://).',
                $where,
            ));
        }
    }

    private function checkPhone(mixed $phone, string $where, ValidationResult $result): void
    {
        if (!is_string($phone) || $phone === '') {
            return;
        }

        $digits = preg_match_all('/\d/', $phone);

        if (
            preg_match(self::PHONE_PATTERN, $phone) !== 1
            || $digits < self::PHONE_MIN_DIGITS
            || $digits > self::PHONE_MAX_DIGITS
        ) {
            $result->add(sprintf(
                '%s: het telefoonnummer mag alleen cijfers, spaties, haakjes, streepjes en een + bevatten.',
                $where,
            ));
        }
    }

    private function checkEmail(mixed $email, string $where, ValidationResult $result): void
    {
        if (!is_string($email) || $email === '') {
            return;
        }

        if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
            $result->add(sprintf('%s: het e-mailadres is niet geldig.', $where));
        }
    }
}
