<?php

declare(strict_types=1);

namespace App\Validators;

/**
 * Controleert een compleet paginabestand: home.json, over-ons.json,
 * contact.json.
 *
 * Dit draait vóór elke schrijfactie (CLAUDE.md §10). Wat hier niet doorheen
 * komt, wordt niet weggeschreven — corrupte content mag nooit live komen.
 */
final class PageContentValidator
{
    private const ALLOWED_KEYS = ['meta', 'sections'];

    private const META_FIELDS = ['title', 'description'];

    /**
     * Bovengrenzen. Een pagina met dertig secties is geen pagina meer, en een
     * titel of description die langer is dan dit wordt in zoekresultaten toch
     * afgekapt (§12).
     */
    private const MAX_SECTIONS = 30;

    private const MAX_META_LENGTHS = ['title' => 70, 'description' => 200];

    public function __construct(
        private readonly SectionValidator $sections = new SectionValidator(),
    ) {
    }

    public function validate(mixed $content): ValidationResult
    {
        $result = new ValidationResult();

        if (!is_array($content)) {
            $result->add('De inhoud moet een object zijn.');

            return $result;
        }

        $this->checkForUnknownKeys($content, $result);
        $this->checkMeta($content['meta'] ?? null, $result);
        $this->checkSections($content['sections'] ?? null, $result);

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
     * meta.title en meta.description zijn verplicht aanwezig maar mogen leeg
     * zijn: ze zijn er nog niet (zie de _todo-lijsten in de content). Leeg
     * blijven ze een bewuste lege plek; ontbreken zou betekenen dat de vorm
     * zelf niet klopt.
     */
    private function checkMeta(mixed $meta, ValidationResult $result): void
    {
        if (!is_array($meta)) {
            $result->add('Het meta-blok ontbreekt of is geen object.');

            return;
        }

        foreach (self::META_FIELDS as $field) {
            if (!array_key_exists($field, $meta)) {
                $result->add(sprintf('meta: veld %s ontbreekt.', $field));

                continue;
            }

            $value = $meta[$field];

            if (!is_string($value)) {
                $result->add(sprintf('meta: veld %s moet tekst zijn.', $field));

                continue;
            }

            $maximum = self::MAX_META_LENGTHS[$field];

            if (mb_strlen($value) > $maximum) {
                $result->add(sprintf(
                    'meta: veld %s is te lang (%d tekens, maximaal %d).',
                    $field,
                    mb_strlen($value),
                    $maximum,
                ));
            }
        }
    }

    private function checkSections(mixed $sections, ValidationResult $result): void
    {
        if (!is_array($sections) || !array_is_list($sections)) {
            $result->add('Het veld sections ontbreekt of is geen lijst.');

            return;
        }

        if (count($sections) > self::MAX_SECTIONS) {
            $result->add(sprintf(
                'Te veel secties (%d, maximaal %d).',
                count($sections),
                self::MAX_SECTIONS,
            ));

            return;
        }

        foreach ($sections as $index => $section) {
            $result->absorb($this->sections->validate($section, $index));
        }
    }
}
