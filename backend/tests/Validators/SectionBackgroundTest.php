<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\FieldValidator;
use App\Validators\SectionValidator;
use PHPUnit\Framework\TestCase;

/**
 * De achtergrond van een sectie.
 *
 * Zat eerst in een automatische regel in de frontend, op basis van sectietype
 * en positie. Nu kiest de beheerder hem per sectie, en dus moet de server hem
 * bewaken: een onbekende waarde levert een sectie op die naar geen enkele
 * stijlregel rendert.
 */
final class SectionBackgroundTest extends TestCase
{
    private SectionValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SectionValidator();
    }

    /** Elk sectietype heeft het veld; het hoort bij de plek, niet bij het type. */
    public function testEveryTypeAcceptsBothBackgrounds(): void
    {
        foreach (['light', 'tinted'] as $background) {
            foreach (self::sectionsOfEveryType($background) as $type => $section) {
                $result = $this->validator->validate($section, 0);

                self::assertTrue($result->isValid(), $type . ': ' . $result->asText());
            }
        }
    }

    public function testRejectsAnUnknownBackground(): void
    {
        $section = self::sectionsOfEveryType('light')['prose'];
        $section['background'] = 'donkerbruin';

        $result = $this->validator->validate($section, 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('background', $result->asText());
    }

    public function testRejectsAMissingBackground(): void
    {
        $section = self::sectionsOfEveryType('light')['list'];
        unset($section['background']);

        self::assertFalse($this->validator->validate($section, 0)->isValid());
    }

    /**
     * Het beheerscherm vult zijn keuzemenu met deze lijst. Wijkt hij af van
     * wat de validator accepteert, dan biedt het menu iets aan dat bij het
     * opslaan geweigerd wordt.
     */
    public function testTheOfferedBackgroundsMatchWhatIsAccepted(): void
    {
        self::assertSame(['light', 'tinted'], FieldValidator::choices()['background']);
    }

    /** @return array<string, array<string, mixed>> */
    private static function sectionsOfEveryType(string $background): array
    {
        return [
            'hero' => [
                'type' => 'hero',
                'background' => $background,
                'kicker' => '',
                'heading' => 'Kop',
                'text' => '',
                'image' => null,
                'imageAlt' => '',
                'layout' => 'beside',
                'textColor' => 'dark',
                'actions' => [],
            ],
            'prose' => [
                'type' => 'prose',
                'background' => $background,
                'heading' => 'Kop',
                'text' => '',
                'image' => null,
                'imageAlt' => '',
                'imagePosition' => 'right',
            ],
            'quote' => [
                'type' => 'quote',
                'background' => $background,
                'text' => 'Een citaat.',
                'supportingText' => '',
                'images' => [],
                'imagePosition' => 'right',
            ],
            'list' => [
                'type' => 'list',
                'background' => $background,
                'heading' => 'Kop',
                'intro' => '',
                'variant' => 'cards',
                'items' => [],
            ],
            'cta' => [
                'type' => 'cta',
                'background' => $background,
                'heading' => 'Kop',
                'text' => '',
                'buttonLabel' => 'Neem contact op',
            ],
        ];
    }
}
