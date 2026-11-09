<?php

declare(strict_types=1);

namespace App\Validators;

/**
 * Controleert de lijst leden of projecten in een `members`- of
 * `projects`-sectie.
 *
 * Staat los van FieldValidator omdat een item hier zelf een klein formulier
 * is — tekstvelden, een foto met alt-tekst, bij een lid een webadres — en
 * niet één waarde. Per veld leunt hij wel op FieldValidator, zodat de
 * lengtegrenzen en de regels voor een fotopad op één plek blijven.
 */
final class EntryListValidator
{
    public const TYPE_MEMBERS = 'members';
    public const TYPE_PROJECTS = 'projects';

    /**
     * Per soort lijst: hoeveel items er hoogstens in mogen, welke tekstvelden
     * niet leeg mogen zijn, en welke leeg mogen blijven.
     *
     * `addedLater` zijn velden die er pas later bij kwamen. Die mogen ook
     * helemaal ontbreken: content die al op de server staat, blijft zo geldig
     * zonder dat iemand hem opnieuw hoeft te uploaden (CLAUDE.md §18, §20).
     *
     * De bovengrenzen zijn ruim gekozen voor een collectief, maar houden een
     * plakfout in het beheer tegen voordat die het contentbestand opblaast.
     *
     * @var array<string, array{
     *     label: string,
     *     max: int,
     *     required: list<string>,
     *     optional: list<string>,
     *     addedLater: list<string>,
     * }>
     */
    private const LISTS = [
        self::TYPE_MEMBERS => [
            'label' => 'lid',
            'max' => 40,
            'required' => ['name'],
            'optional' => ['specialty', 'website'],
            'addedLater' => ['bio', 'phone', 'email'],
        ],
        self::TYPE_PROJECTS => [
            'label' => 'project',
            'max' => 30,
            'required' => ['title'],
            'optional' => ['maker', 'category', 'description'],
            'addedLater' => [],
        ],
    ];

    /** Elk item heeft een foto, die net als bij een sectie leeg mag zijn. */
    private const IMAGE_FIELDS = ['image', 'imageAlt'];

    public function __construct(
        private readonly FieldValidator $fields = new FieldValidator(),
        private readonly MemberContactValidator $contact = new MemberContactValidator(),
    ) {
    }

    public static function handles(string $expectedType): bool
    {
        return array_key_exists($expectedType, self::LISTS);
    }

    public function check(mixed $value, string $expectedType, string $where): ValidationResult
    {
        $result = new ValidationResult();
        $list = self::LISTS[$expectedType];

        if (!is_array($value) || !array_is_list($value)) {
            $result->add(sprintf('%s: veld %s moet een lijst zijn.', $where, $expectedType));

            return $result;
        }

        if (count($value) > $list['max']) {
            $result->add(sprintf(
                '%s: te veel items in %s (%d, maximaal %d).',
                $where,
                $expectedType,
                count($value),
                $list['max'],
            ));

            return $result;
        }

        foreach ($value as $index => $entry) {
            $result->absorb($this->checkEntry(
                $entry,
                $list,
                sprintf('%s, %s %d', $where, $list['label'], $index + 1),
            ));
        }

        return $result;
    }

    /**
     * @param array{
     *     label: string,
     *     max: int,
     *     required: list<string>,
     *     optional: list<string>,
     *     addedLater: list<string>,
     * } $list
     */
    private function checkEntry(mixed $entry, array $list, string $where): ValidationResult
    {
        $result = new ValidationResult();

        if (!is_array($entry)) {
            $result->add(sprintf('%s: moet een object zijn.', $where));

            return $result;
        }

        $textFields = [...$list['required'], ...$list['optional']];

        $this->checkForUnknownKeys(
            $entry,
            [...$textFields, ...$list['addedLater'], ...self::IMAGE_FIELDS],
            $where,
            $result,
        );

        foreach ([...$textFields, ...$list['addedLater']] as $field) {
            if (!array_key_exists($field, $entry)) {
                if (!in_array($field, $list['addedLater'], true)) {
                    $result->add(sprintf('%s: veld %s ontbreekt.', $where, $field));
                }

                continue;
            }

            $result->absorb(
                $this->fields->check($entry[$field], FieldValidator::TYPE_STRING, $field, $where),
            );
        }

        foreach ($list['required'] as $field) {
            if (is_string($entry[$field] ?? null) && trim($entry[$field]) === '') {
                $result->add(sprintf('%s: veld %s mag niet leeg zijn.', $where, $field));
            }
        }

        $this->contact->check($entry, $where, $result);
        $this->checkImage($entry, $where, $result);

        return $result;
    }

    /**
     * Onbekende velden zijn een fout, net als bij een sectie: een typefout
     * zou anders stil verdwijnen.
     *
     * @param array<array-key, mixed> $entry
     * @param list<string> $allowed
     */
    private function checkForUnknownKeys(
        array $entry,
        array $allowed,
        string $where,
        ValidationResult $result,
    ): void {
        foreach (array_keys($entry) as $key) {
            if (is_string($key) && (str_starts_with($key, '_') || in_array($key, $allowed, true))) {
                continue;
            }

            $result->add(sprintf('%s: onbekend veld %s.', $where, (string) $key));
        }
    }

    /**
     * Zelfde regel als bij een sectie: zodra er een foto is, is een
     * beschrijving verplicht (CLAUDE.md §14).
     *
     * @param array<array-key, mixed> $entry
     */
    private function checkImage(array $entry, string $where, ValidationResult $result): void
    {
        foreach (self::IMAGE_FIELDS as $field) {
            if (!array_key_exists($field, $entry)) {
                $result->add(sprintf('%s: veld %s ontbreekt.', $where, $field));
            }
        }

        $result->absorb($this->fields->check(
            $entry['image'] ?? null,
            FieldValidator::TYPE_NULLABLE_STRING,
            'image',
            $where,
        ));

        $alt = $entry['imageAlt'] ?? null;

        if (!is_string($alt)) {
            return;
        }

        $result->absorb($this->fields->check($alt, FieldValidator::TYPE_STRING, 'imageAlt', $where));

        if (is_string($entry['image'] ?? null) && $entry['image'] !== '' && trim($alt) === '') {
            $result->add(sprintf('%s: er is een foto, dus imageAlt mag niet leeg zijn.', $where));
        }
    }
}
