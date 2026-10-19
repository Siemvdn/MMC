<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\FieldValidator;
use App\Validators\SectionValidator;
use PHPUnit\Framework\TestCase;

/**
 * Een vooruitblik op de leden of de projecten. De sectie bevat zelf geen
 * items, alleen een verwijzing naar waar ze staan — zo bestaan de gegevens
 * maar op één plek.
 */
final class TeaserSectionTest extends TestCase
{
    private SectionValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SectionValidator();
    }

    /**
     * Het beheerscherm vult zijn keuzemenu met deze lijst. Wijkt hij af van
     * wat de validator accepteert, dan biedt het menu iets aan dat bij het
     * opslaan geweigerd wordt.
     */
    public function testEveryOfferedSourceIsAccepted(): void
    {
        $sources = FieldValidator::choices()['source'];

        self::assertSame(['members', 'projects'], $sources);

        foreach ($sources as $source) {
            $result = $this->validator->validate(self::teaser($source), 0);

            self::assertTrue($result->isValid(), $result->asText());
        }
    }

    public function testRejectsAnUnknownSource(): void
    {
        $result = $this->validator->validate(self::teaser('nieuws'), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('source', $result->asText());
    }

    /** Items horen op de pagina waarnaar verwezen wordt, niet in een kopie hier. */
    public function testRejectsItemsInsideTheTeaser(): void
    {
        $section = self::teaser('members');
        $section['members'] = [];

        self::assertFalse($this->validator->validate($section, 0)->isValid());
    }

    public function testRejectsALinkLabelThatIsTooLong(): void
    {
        $section = self::teaser('projects');
        $section['linkLabel'] = str_repeat('a', 41);

        self::assertFalse($this->validator->validate($section, 0)->isValid());
    }

    /** @return array<string, mixed> */
    private static function teaser(string $source): array
    {
        return [
            'type' => 'teaser',
            'background' => 'light',
            'heading' => 'Maak kennis met de makers',
            'source' => $source,
            'linkLabel' => 'Alle leden',
        ];
    }
}
