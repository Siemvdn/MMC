<?php

declare(strict_types=1);

namespace App\Validators;

/**
 * Controleert één veldwaarde tegen het type dat ervoor verwacht wordt.
 *
 * Staat los van SectionValidator omdat het een andere vraag beantwoordt: die
 * bepaalt wélke velden een sectie moet hebben, deze bepaalt of een gegeven
 * waarde klopt.
 */
final class FieldValidator
{
    public const TYPE_STRING = 'string';
    public const TYPE_NULLABLE_STRING = 'nullable-string';
    public const TYPE_ITEMS = 'items';

    /** Een lijst foto's, elk met een eigen verplichte alt-tekst (de carrousel). */
    public const TYPE_IMAGES = 'images';

    /** Een waarde uit een vaste lijst; welke lijst hangt af van het veld. */
    public const TYPE_CHOICE = 'choice';

    /** De knoppen onder een paginakop: een tekst plus de pagina waarheen. */
    public const TYPE_ACTIONS = 'actions';

    /**
     * Een afbeeldingspad moet hier letterlijk aan voldoen: de uploadmap,
     * gevolgd door één bestandsnaam zonder mapniveaus. Bewust een whitelist en
     * geen lijst met verboden tekens — bij een whitelist kun je niets over het
     * hoofd zien (CLAUDE.md §11).
     */
    private const IMAGE_PATH = '#^/uploads/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$#';

    private const IMAGE_PREFIX = '/uploads/';

    /**
     * De toegestane waarden per keuzeveld.
     *
     * Bewust hier en niet in de frontend: wat geldig is bepaalt de server. Het
     * beheerscherm vraagt deze lijst op en bouwt er zijn keuzemenu mee, zodat
     * de twee niet uit elkaar kunnen lopen.
     *
     * @var array<string, list<string>>
     */
    private const CHOICES = [
        'layout' => ['beside', 'banner'],
        'textColor' => ['dark', 'light'],
        // Waar een knop heen wijst. Bewust de eigen pagina's en geen vrij in
        // te vullen adres: de site telt drie pagina's, en een vrij veld levert
        // alleen kapotte links op (§12).
        'target' => ['home', 'over-ons', 'contact'],
        // De achtergrond van een sectie: de gewone achtergrond van de pagina,
        // of een getint vlak. Per sectie te kiezen, zodat de beheerder
        // zelf het ritme van de pagina bepaalt.
        'background' => ['light', 'tinted'],
        // Hoe een lijst getoond wordt: als losse kaarten naast elkaar, als
        // genummerde stappen, of als een tijdlijn met bolletjes op een lijn.
        // Dezelfde items, andere vorm — daarom een keuze op de lijst en geen
        // apart sectietype.
        'variant' => ['cards', 'steps', 'timeline'],
        // Aan welke kant van de tekst de foto van een prose-sectie staat.
        'imagePosition' => ['left', 'right'],
    ];

    /**
     * Twee knoppen is het maximum: eentje die de bezoeker moet nemen en
     * eentje voor wie eerst meer wil weten. Meer keuzes maken de belangrijkste
     * juist minder duidelijk.
     */
    private const MAX_ACTIONS = 2;

    private const ACTION_LABEL_MAX = 40;

    /** De velden die elk item in een lijst-sectie moet hebben. */
    private const ITEM_FIELDS = ['title', 'text'];

    /**
     * Bovengrenzen per veld, in tekens.
     *
     * Waarom dit bestaat: zonder grens maakt één plakactie in het CMS een
     * contentbestand van megabytes, dat daarna bij élk bezoek van de site
     * ingelezen en verstuurd wordt.
     *
     * De 2000 voor lopende tekst is ongeveer driehonderd woorden: ruim genoeg
     * voor een verhaal op de Over ons-pagina. Zelfs een pagina die vollopt met de
     * maximaal toegestane dertig secties blijft daarmee onder de 60 kB.
     *
     * Geteld met mb_strlen, dus een é telt als één teken en niet als twee.
     *
     * @var array<string, int>
     */
    private const MAX_LENGTHS = [
        'kicker' => 120,
        'heading' => 200,
        'title' => 200,
        'intro' => 400,
        'text' => 2000,
        // De toelichting onder een citaat is bewust kort: het citaat zelf mag
        // de 2000 van `text` gebruiken, maar wat eronder staat hoort een
        // enkele zin te zijn, geen tweede alinea.
        'supportingText' => 200,
        'imageAlt' => 200,
        'buttonLabel' => 60,
    ];

    private const DEFAULT_MAX_LENGTH = 200;

    /**
     * Meer dan dit aantal items in één lijst wijst op een vergissing, niet op
     * een bedoeling.
     */
    private const MAX_ITEMS = 20;

    /** Hoogstens tien foto's per carrousel; meer wijst op een vergissing. */
    private const MAX_IMAGES = 10;

    /**
     * De toegestane waarden per keuzeveld.
     *
     * @return array<string, list<string>>
     */
    public static function choices(): array
    {
        return self::CHOICES;
    }

    /**
     * De maximale lengte per veld, in tekens.
     *
     * Opvraagbaar zodat het beheerscherm dezelfde getallen kan tonen als hier
     * afgedwongen worden. Stonden ze op twee plekken, dan lopen ze uit elkaar
     * — en dat gebeurde ook: het beheer meldde nog 800 toen dit al 2000 was.
     *
     * @return array<string, int>
     */
    public static function maxLengths(): array
    {
        return self::MAX_LENGTHS;
    }

    public function check(
        mixed $value,
        string $expectedType,
        string $field,
        string $where,
    ): ValidationResult {
        $result = new ValidationResult();

        match ($expectedType) {
            self::TYPE_STRING => $this->requireString($value, $field, $where, $result),
            self::TYPE_NULLABLE_STRING => $this->requireImagePath($value, $field, $where, $result),
            self::TYPE_ITEMS => $this->requireItems($value, $field, $where, $result),
            self::TYPE_IMAGES => $this->requireImages($value, $field, $where, $result),
            self::TYPE_CHOICE => $this->requireChoice($value, $field, $where, $result),
            self::TYPE_ACTIONS => $this->requireActions($value, $field, $where, $result),
        };

        return $result;
    }

    private function requireString(
        mixed $value,
        string $field,
        string $where,
        ValidationResult $result,
    ): void {
        if (!is_string($value)) {
            $result->add(sprintf('%s: veld %s moet tekst zijn.', $where, $field));

            return;
        }

        $this->checkLength($value, $field, $where, $result);
    }

    private function requireActions(
        mixed $value,
        string $field,
        string $where,
        ValidationResult $result,
    ): void {
        if (!is_array($value) || !array_is_list($value)) {
            $result->add(sprintf('%s: veld %s moet een lijst zijn.', $where, $field));

            return;
        }

        if (count($value) > self::MAX_ACTIONS) {
            $result->add(sprintf(
                '%s: hoogstens %d knoppen, geen %d.',
                $where,
                self::MAX_ACTIONS,
                count($value),
            ));

            return;
        }

        foreach ($value as $index => $action) {
            if (!is_array($action)) {
                $result->add(sprintf('%s, knop %d: moet een object zijn.', $where, $index));

                continue;
            }

            $label = $action['label'] ?? null;

            if (!is_string($label) || trim($label) === '') {
                $result->add(sprintf('%s, knop %d: de tekst ontbreekt.', $where, $index));
            } elseif (mb_strlen($label) > self::ACTION_LABEL_MAX) {
                $result->add(sprintf(
                    '%s, knop %d: de tekst is te lang (%d tekens, maximaal %d).',
                    $where,
                    $index,
                    mb_strlen($label),
                    self::ACTION_LABEL_MAX,
                ));
            }

            $this->requireChoice($action['target'] ?? null, 'target', sprintf('%s, knop %d', $where, $index), $result);
        }
    }

    private function requireChoice(
        mixed $value,
        string $field,
        string $where,
        ValidationResult $result,
    ): void {
        $allowed = self::CHOICES[$field] ?? [];

        if (!is_string($value) || !in_array($value, $allowed, true)) {
            $result->add(sprintf(
                '%s: veld %s moet een van deze waarden zijn: %s.',
                $where,
                $field,
                implode(', ', $allowed),
            ));
        }
    }

    private function checkLength(
        string $value,
        string $field,
        string $where,
        ValidationResult $result,
    ): void {
        $maximum = self::MAX_LENGTHS[$field] ?? self::DEFAULT_MAX_LENGTH;
        $length = mb_strlen($value);

        if ($length > $maximum) {
            $result->add(sprintf(
                '%s: veld %s is te lang (%d tekens, maximaal %d).',
                $where,
                $field,
                $length,
                $maximum,
            ));
        }
    }

    /**
     * Een afbeeldingspad is null, of precies één bestandsnaam binnen de
     * uploadmap. Alles daarbuiten — mapniveaus, bovenliggende mappen,
     * absolute paden, een Windows-pad — valt af omdat het niet aan de
     * whitelist voldoet.
     */
    private function requireImagePath(
        mixed $value,
        string $field,
        string $where,
        ValidationResult $result,
    ): void {
        if ($value === null) {
            return;
        }

        if (!is_string($value)) {
            $result->add(sprintf('%s: veld %s moet tekst of null zijn.', $where, $field));

            return;
        }

        if (preg_match(self::IMAGE_PATH, $value) !== 1) {
            $result->add(sprintf(
                '%s: veld %s moet %s zijn plus één bestandsnaam.',
                $where,
                $field,
                self::IMAGE_PREFIX,
            ));
        }
    }

    private function requireItems(
        mixed $value,
        string $field,
        string $where,
        ValidationResult $result,
    ): void {
        if (!is_array($value) || !array_is_list($value)) {
            $result->add(sprintf('%s: veld %s moet een lijst zijn.', $where, $field));

            return;
        }

        if (count($value) > self::MAX_ITEMS) {
            $result->add(sprintf(
                '%s: veld %s heeft te veel items (%d, maximaal %d).',
                $where,
                $field,
                count($value),
                self::MAX_ITEMS,
            ));

            return;
        }

        foreach ($value as $index => $item) {
            if (!is_array($item)) {
                $result->add(sprintf('%s, item %d: moet een object zijn.', $where, $index));

                continue;
            }

            foreach (self::ITEM_FIELDS as $required) {
                $itemValue = $item[$required] ?? null;

                if (!is_string($itemValue)) {
                    $result->add(sprintf(
                        '%s, item %d: veld %s ontbreekt of is geen tekst.',
                        $where,
                        $index,
                        $required,
                    ));

                    continue;
                }

                $this->checkLength(
                    $itemValue,
                    $required,
                    sprintf('%s, item %d', $where, $index),
                    $result,
                );
            }
        }
    }

    /**
     * Een lijst foto's voor een carrousel. Anders dan het losse afbeeldingsveld
     * (dat null mag zijn zolang er nog geen foto is) heeft elk item hier al
     * een foto — een lege plek in de lijst laat je gewoon weg — dus is het pad
     * hier verplicht en niet nullable, en is de alt-tekst altijd verplicht in
     * plaats van alleen wanneer er toevallig een foto staat (§14).
     */
    private function requireImages(
        mixed $value,
        string $field,
        string $where,
        ValidationResult $result,
    ): void {
        if (!is_array($value) || !array_is_list($value)) {
            $result->add(sprintf('%s: veld %s moet een lijst zijn.', $where, $field));

            return;
        }

        if (count($value) > self::MAX_IMAGES) {
            $result->add(sprintf(
                '%s: veld %s heeft te veel foto\'s (%d, maximaal %d).',
                $where,
                $field,
                count($value),
                self::MAX_IMAGES,
            ));

            return;
        }

        foreach ($value as $index => $entry) {
            if (!is_array($entry)) {
                $result->add(sprintf('%s, foto %d: moet een object zijn.', $where, $index));

                continue;
            }

            $image = $entry['image'] ?? null;

            if (!is_string($image) || preg_match(self::IMAGE_PATH, $image) !== 1) {
                $result->add(sprintf(
                    '%s, foto %d: moet %s zijn plus één bestandsnaam.',
                    $where,
                    $index,
                    self::IMAGE_PREFIX,
                ));
            }

            $alt = $entry['imageAlt'] ?? null;

            if (!is_string($alt) || trim($alt) === '') {
                $result->add(sprintf('%s, foto %d: alt-tekst ontbreekt.', $where, $index));

                continue;
            }

            $this->checkLength($alt, 'imageAlt', sprintf('%s, foto %d', $where, $index), $result);
        }
    }
}
