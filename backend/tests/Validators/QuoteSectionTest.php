<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\SectionValidator;
use PHPUnit\Framework\TestCase;

/**
 * Het uitgelichte citaat, met een korte toelichting en een optionele
 * foto-carrousel.
 *
 * Anders dan de andere sectietypes heeft dit type geen `heading` — een citaat
 * opent geen nieuw onderwerp op de pagina, dus is dat veld hier bewust niet
 * onderdeel van het schema.
 */
final class QuoteSectionTest extends TestCase
{
    private SectionValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SectionValidator();
    }

    public function testAcceptsAValidQuote(): void
    {
        $result = $this->validator->validate(self::quote(), 0);

        self::assertTrue($result->isValid(), $result->asText());
    }

    public function testAcceptsAQuoteWithoutAnyPhotos(): void
    {
        $quote = self::quote();
        $quote['images'] = [];

        self::assertTrue($this->validator->validate($quote, 0)->isValid());
    }

    public function testAcceptsUpToTenPhotos(): void
    {
        $quote = self::quote();
        $quote['images'] = self::photos(10);

        self::assertTrue($this->validator->validate($quote, 0)->isValid());
    }

    /** Hoogstens tien foto's per carrousel. */
    public function testRejectsMoreThanTenPhotos(): void
    {
        $quote = self::quote();
        $quote['images'] = self::photos(11);

        $result = $this->validator->validate($quote, 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('images', $result->asText());
    }

    /** Een citaat opent geen nieuw onderwerp, dus hoort er geen kop bij. */
    public function testHasNoHeadingField(): void
    {
        $quote = self::quote();
        $quote['heading'] = 'Dit hoort er niet te zijn';

        $result = $this->validator->validate($quote, 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('heading', $result->asText());
    }

    public function testRejectsAMissingSupportingText(): void
    {
        $quote = self::quote();
        unset($quote['supportingText']);

        self::assertFalse($this->validator->validate($quote, 0)->isValid());
    }

    public function testRejectsAnUnknownImagePosition(): void
    {
        $quote = self::quote();
        $quote['imagePosition'] = 'midden';

        $result = $this->validator->validate($quote, 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('imagePosition', $result->asText());
    }

    /**
     * Anders dan het losse afbeeldingsveld elders is een foto in de carrousel
     * nooit `null` — een lege plek laat je gewoon weg. Alt-tekst is daarom
     * hier altijd verplicht, niet alleen wanneer er toevallig een foto staat
     * (CLAUDE.md §14).
     */
    public function testRejectsAPhotoWithoutAltText(): void
    {
        $quote = self::quote();
        $quote['images'] = [['image' => '/uploads/foto.jpg', 'imageAlt' => '']];

        self::assertFalse($this->validator->validate($quote, 0)->isValid());
    }

    public function testRejectsAPhotoWithAMalformedPath(): void
    {
        $quote = self::quote();
        $quote['images'] = [['image' => '../../.env', 'imageAlt' => 'Een foto']];

        self::assertFalse($this->validator->validate($quote, 0)->isValid());
    }

    /** @return array<string, mixed> */
    private static function quote(): array
    {
        return [
            'type' => 'quote',
            'background' => 'light',
            'text' => 'Een citaat.',
            'supportingText' => 'Een korte toelichting.',
            'images' => [
                ['image' => '/uploads/voorbeeld.jpg', 'imageAlt' => 'Een beschrijving van de foto'],
            ],
            'imagePosition' => 'right',
        ];
    }

    /** @return list<array{image: string, imageAlt: string}> */
    private static function photos(int $count): array
    {
        return array_map(
            static fn (int $index): array => [
                'image' => sprintf('/uploads/foto-%d.jpg', $index),
                'imageAlt' => sprintf('Foto %d', $index),
            ],
            range(1, $count),
        );
    }
}
