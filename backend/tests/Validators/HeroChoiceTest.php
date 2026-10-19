<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\FieldValidator;
use App\Validators\SectionValidator;
use PHPUnit\Framework\TestCase;

/**
 * De keuzevelden op de paginakop: hoe hij is ingedeeld, en welke kleur de
 * tekst op de foto krijgt.
 *
 * Wat hier doorheen komt, komt op de site. Een onbekende waarde zou een
 * sectie opleveren die nergens naar rendert.
 */
final class HeroChoiceTest extends TestCase
{
    private SectionValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SectionValidator();
    }

    public function testAcceptsTheAllowedCombinations(): void
    {
        foreach (['beside', 'banner'] as $layout) {
            foreach (['dark', 'light'] as $colour) {
                $result = $this->validator->validate(self::hero($layout, $colour), 0);

                self::assertTrue($result->isValid(), $result->asText());
            }
        }
    }

    public function testRejectsAnUnknownLayout(): void
    {
        $result = $this->validator->validate(self::hero('vanalles', 'dark'), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('layout', $result->asText());
    }

    public function testRejectsAnUnknownTextColour(): void
    {
        self::assertFalse($this->validator->validate(self::hero('banner', 'roze'), 0)->isValid());
    }

    /** Een keuzeveld dat ontbreekt is net zo goed fout als een verkeerde waarde. */
    public function testRejectsAMissingChoice(): void
    {
        $hero = self::hero('banner', 'light');
        unset($hero['textColor']);

        self::assertFalse($this->validator->validate($hero, 0)->isValid());
    }

    /**
     * Het beheerscherm bouwt zijn keuzemenu met deze lijst. Wijkt hij af van
     * wat de validator accepteert, dan biedt het menu iets aan dat bij het
     * opslaan geweigerd wordt.
     */
    public function testTheOfferedChoicesMatchWhatIsAccepted(): void
    {
        $choices = FieldValidator::choices();

        self::assertSame(['beside', 'banner'], $choices['layout']);
        self::assertSame(['dark', 'light'], $choices['textColor']);

        foreach ($choices['layout'] as $layout) {
            self::assertTrue($this->validator->validate(self::hero($layout, 'dark'), 0)->isValid());
        }
    }

    /** @return array<string, mixed> */
    private static function hero(string $layout, string $textColor): array
    {
        return [
            'type' => 'hero',
            'background' => 'light',
            'kicker' => 'Over ons',
            'heading' => 'Een kop',
            'text' => '',
            'image' => null,
            'imageAlt' => '',
            'layout' => $layout,
            'textColor' => $textColor,
            'actions' => [],
        ];
    }
}
