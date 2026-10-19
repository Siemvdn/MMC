<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\FieldValidator;
use App\Validators\SectionValidator;
use PHPUnit\Framework\TestCase;

/**
 * Aan welke kant van de tekst de foto van een prose-sectie staat.
 *
 * Wat hier doorheen komt, komt op de site. Een onbekende waarde zou een
 * sectie opleveren die nergens naar rendert.
 */
final class ProseImagePositionTest extends TestCase
{
    private SectionValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SectionValidator();
    }

    public function testAcceptsBothPositions(): void
    {
        foreach (['left', 'right'] as $position) {
            $result = $this->validator->validate(self::prose($position), 0);

            self::assertTrue($result->isValid(), $result->asText());
        }
    }

    public function testRejectsAnUnknownPosition(): void
    {
        $result = $this->validator->validate(self::prose('midden'), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('imagePosition', $result->asText());
    }

    /** Verplicht, ook zonder foto: anders moet de beheerder alsnog kiezen zodra hij er later een uploadt. */
    public function testRejectsAMissingPosition(): void
    {
        $section = self::prose('right');
        unset($section['imagePosition']);

        self::assertFalse($this->validator->validate($section, 0)->isValid());
    }

    /**
     * Het beheerscherm bouwt zijn keuzemenu met deze lijst. Wijkt hij af van
     * wat de validator accepteert, dan biedt het menu iets aan dat bij het
     * opslaan geweigerd wordt.
     */
    public function testTheOfferedPositionsMatchWhatIsAccepted(): void
    {
        self::assertSame(['left', 'right'], FieldValidator::choices()['imagePosition']);
    }

    /** @return array<string, mixed> */
    private static function prose(string $imagePosition): array
    {
        return [
            'type' => 'prose',
            'background' => 'light',
            'heading' => 'Een kop',
            'text' => '',
            'image' => null,
            'imageAlt' => '',
            'imagePosition' => $imagePosition,
        ];
    }
}
