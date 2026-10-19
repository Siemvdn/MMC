<?php

declare(strict_types=1);

namespace App\Validators;

/**
 * Controleert site.json: de gegevens die op élke pagina terugkomen.
 *
 * Dit bestand heeft geen secties. Het draagt de bedrijfsnaam, de
 * NAP-gegevens en de sameAs-links, en voedt daarmee zowel de footer als het
 * LocalBusiness-schema (CLAUDE.md §12).
 */
final class SiteContentValidator
{
    private const ALLOWED_KEYS = ['businessName', 'contact', 'sameAs'];

    private const CONTACT_FIELDS = ['phone', 'email', 'area'];

    /**
     * Bovengrenzen. Deze velden staan in de footer van élke pagina; iets langs
     * hoort er niet in thuis.
     *
     * @var array<string, int>
     */
    private const MAX_LENGTHS = [
        'businessName' => 80,
        'phone' => 30,
        'email' => 120,
        'area' => 120,
    ];

    /** Meer dan dit aantal sameAs-links wijst op een vergissing. */
    private const MAX_SAME_AS = 10;

    public function validate(mixed $content): ValidationResult
    {
        $result = new ValidationResult();

        if (!is_array($content)) {
            $result->add('De inhoud moet een object zijn.');

            return $result;
        }

        $this->checkForUnknownKeys($content, $result);

        $businessName = $content['businessName'] ?? null;

        if (!is_string($businessName)) {
            $result->add('Het veld businessName ontbreekt of is geen tekst.');
        } else {
            $this->checkLength($businessName, 'businessName', $result);
        }

        $this->checkContact($content['contact'] ?? null, $result);
        $this->checkSameAs($content['sameAs'] ?? null, $result);

        return $result;
    }

    /** @param array<array-key, mixed> $content */
    private function checkForUnknownKeys(array $content, ValidationResult $result): void
    {
        foreach (array_keys($content) as $key) {
            if (!is_string($key)) {
                $result->add('Sleutels op het hoogste niveau moeten tekst zijn.');

                continue;
            }

            if (str_starts_with($key, '_') || in_array($key, self::ALLOWED_KEYS, true)) {
                continue;
            }

            $result->add(sprintf('Onbekende sleutel %s op het hoogste niveau.', $key));
        }
    }

    /**
     * De velden zijn verplicht aanwezig maar mogen leeg zijn: de klant heeft
     * ze nog niet aangeleverd. Wat er niet mag gebeuren is dat het veld zelf
     * verdwijnt — dan zou de footer stilzwijgend niets tonen in plaats van
     * zichtbaar leeg te zijn.
     */
    private function checkContact(mixed $contact, ValidationResult $result): void
    {
        if (!is_array($contact)) {
            $result->add('Het contact-blok ontbreekt of is geen object.');

            return;
        }

        foreach (self::CONTACT_FIELDS as $field) {
            if (!array_key_exists($field, $contact)) {
                $result->add(sprintf('contact: veld %s ontbreekt.', $field));

                continue;
            }

            $value = $contact[$field];

            if (!is_string($value)) {
                $result->add(sprintf('contact: veld %s moet tekst zijn.', $field));

                continue;
            }

            $this->checkLength($value, $field, $result, 'contact: ');
        }
    }

    private function checkSameAs(mixed $sameAs, ValidationResult $result): void
    {
        if (!is_array($sameAs) || !array_is_list($sameAs)) {
            $result->add('Het veld sameAs ontbreekt of is geen lijst.');

            return;
        }

        if (count($sameAs) > self::MAX_SAME_AS) {
            $result->add(sprintf(
                'Te veel sameAs-links (%d, maximaal %d).',
                count($sameAs),
                self::MAX_SAME_AS,
            ));

            return;
        }

        foreach ($sameAs as $index => $link) {
            if (!is_string($link)) {
                $result->add(sprintf('sameAs, item %d: moet tekst zijn.', $index));
            }
        }
    }

    private function checkLength(
        string $value,
        string $field,
        ValidationResult $result,
        string $prefix = '',
    ): void {
        $maximum = self::MAX_LENGTHS[$field] ?? 120;

        if (mb_strlen($value) > $maximum) {
            $result->add(sprintf(
                '%sveld %s is te lang (%d tekens, maximaal %d).',
                $prefix,
                $field,
                mb_strlen($value),
                $maximum,
            ));
        }
    }
}
