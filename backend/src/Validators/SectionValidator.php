<?php

declare(strict_types=1);

namespace App\Validators;

/**
 * Bepaalt welke velden een sectie moet hebben, en laat FieldValidator
 * controleren of de waarden kloppen.
 *
 * `background` staat bij elk type: welke achtergrond een sectie krijgt is
 * geen eigenschap van het type maar van de plek op de pagina, en die kiest de
 * beheerder zelf.
 *
 * De tabel hieronder en `backend/storage/content/README.md` beschrijven
 * dezelfde afspraak. Verandert er een veld, dan veranderen ze samen — anders
 * loopt de documentatie uit de pas met wat er werkelijk afgedwongen wordt.
 */
final class SectionValidator
{
    /** @var array<string, array<string, string>> */
    private const SCHEMA = [
        'hero' => [
            'background' => FieldValidator::TYPE_CHOICE,
            'kicker' => FieldValidator::TYPE_STRING,
            'heading' => FieldValidator::TYPE_STRING,
            'text' => FieldValidator::TYPE_STRING,
            'image' => FieldValidator::TYPE_NULLABLE_STRING,
            'imageAlt' => FieldValidator::TYPE_STRING,
            // Naast de tekst, of als brede banner met de tekst eroverheen.
            'layout' => FieldValidator::TYPE_CHOICE,
            // Bij een banner staat de tekst op de foto; welke kleur leesbaar
            // is hangt af van die foto, dus dat kiest de beheerder zelf.
            'textColor' => FieldValidator::TYPE_CHOICE,
            // De knoppen onder de kop. Een lege lijst betekent: geen knoppen.
            'actions' => FieldValidator::TYPE_ACTIONS,
        ],
        'prose' => [
            'background' => FieldValidator::TYPE_CHOICE,
            'heading' => FieldValidator::TYPE_STRING,
            'text' => FieldValidator::TYPE_STRING,
            'image' => FieldValidator::TYPE_NULLABLE_STRING,
            'imageAlt' => FieldValidator::TYPE_STRING,
            // Aan welke kant van de tekst de foto komt te staan.
            'imagePosition' => FieldValidator::TYPE_CHOICE,
        ],
        'quote' => [
            'background' => FieldValidator::TYPE_CHOICE,
            // Het citaat zelf.
            'text' => FieldValidator::TYPE_STRING,
            // Korte toelichting eronder — geen kop, want een citaat opent geen
            // nieuw onderwerp op de pagina.
            'supportingText' => FieldValidator::TYPE_STRING,
            // Een carrousel in plaats van één foto: hoogstens tien, elk met
            // een eigen alt-tekst. Leeg betekent geen foto's.
            'images' => FieldValidator::TYPE_IMAGES,
            'imagePosition' => FieldValidator::TYPE_CHOICE,
        ],
        'list' => [
            'background' => FieldValidator::TYPE_CHOICE,
            'heading' => FieldValidator::TYPE_STRING,
            'intro' => FieldValidator::TYPE_STRING,
            // Kaarten naast elkaar, of genummerde stappen.
            'variant' => FieldValidator::TYPE_CHOICE,
            'items' => FieldValidator::TYPE_ITEMS,
        ],
        'cta' => [
            'background' => FieldValidator::TYPE_CHOICE,
            'heading' => FieldValidator::TYPE_STRING,
            'text' => FieldValidator::TYPE_STRING,
            'buttonLabel' => FieldValidator::TYPE_STRING,
        ],
    ];

    public function __construct(private readonly FieldValidator $fields = new FieldValidator())
    {
    }

    public function validate(mixed $section, int $index): ValidationResult
    {
        $result = new ValidationResult();
        $where = sprintf('sectie %d', $index);

        if (!is_array($section)) {
            $result->add(sprintf('%s: moet een object zijn.', $where));

            return $result;
        }

        $type = $section['type'] ?? null;

        if (!is_string($type) || !array_key_exists($type, self::SCHEMA)) {
            $result->add(sprintf(
                '%s: onbekend sectietype (%s). Toegestaan: %s.',
                $where,
                is_string($type) ? $type : 'ontbreekt',
                implode(', ', array_keys(self::SCHEMA)),
            ));

            return $result;
        }

        $schema = self::SCHEMA[$type];

        $this->checkForUnknownKeys($section, $schema, $where, $result);

        foreach ($schema as $field => $expectedType) {
            if (!array_key_exists($field, $section)) {
                $result->add(sprintf('%s: veld %s ontbreekt.', $where, $field));

                continue;
            }

            $result->absorb($this->fields->check($section[$field], $expectedType, $field, $where));
        }

        $this->checkAlternativeText($section, $where, $result);

        return $result;
    }

    /**
     * Onbekende velden zijn een fout, geen detail. Een typefout als headding
     * zou anders stil verdwijnen en de sectie half leeg opleveren.
     *
     * @param array<array-key, mixed> $section
     * @param array<string, string> $schema
     */
    private function checkForUnknownKeys(
        array $section,
        array $schema,
        string $where,
        ValidationResult $result,
    ): void {
        foreach (array_keys($section) as $key) {
            if (!is_string($key)) {
                $result->add(sprintf('%s: veldnamen moeten tekst zijn.', $where));

                continue;
            }

            // Sleutels met een underscore zijn aantekeningen, geen content.
            if ($key === 'type' || str_starts_with($key, '_')) {
                continue;
            }

            if (!array_key_exists($key, $schema)) {
                $result->add(sprintf('%s: onbekend veld %s.', $where, $key));
            }
        }
    }

    /**
     * Een betekenisvolle afbeelding zonder alt-tekst is ontoegankelijk
     * (CLAUDE.md §14). Zonder afbeelding mag de alt-tekst leeg blijven.
     *
     * @param array<array-key, mixed> $section
     */
    private function checkAlternativeText(
        array $section,
        string $where,
        ValidationResult $result,
    ): void {
        $image = $section['image'] ?? null;
        $alt = $section['imageAlt'] ?? null;

        if (is_string($image) && $image !== '' && (!is_string($alt) || trim($alt) === '')) {
            $result->add(sprintf(
                '%s: er is een afbeelding, dus imageAlt mag niet leeg zijn.',
                $where,
            ));
        }
    }
}
