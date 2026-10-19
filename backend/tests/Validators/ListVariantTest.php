<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\FieldValidator;
use App\Validators\SectionValidator;
use PHPUnit\Framework\TestCase;

/**
 * Hoe een lijst getoond wordt: als kaarten naast elkaar, als genummerde
 * stappen, of als een tijdlijn.
 *
 * Dezelfde items, andere vorm — daarom een keuze op de lijst en geen tweede
 * sectietype met precies dezelfde velden.
 */
final class ListVariantTest extends TestCase
{
    private SectionValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SectionValidator();
    }

    public function testAcceptsEveryVariant(): void
    {
        foreach (['cards', 'steps', 'timeline'] as $variant) {
            $result = $this->validator->validate(self::list($variant), 0);

            self::assertTrue($result->isValid(), $result->asText());
        }
    }

    public function testRejectsAnUnknownVariant(): void
    {
        $result = $this->validator->validate(self::list('carrousel'), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('variant', $result->asText());
    }

    public function testRejectsAMissingVariant(): void
    {
        $section = self::list('cards');
        unset($section['variant']);

        self::assertFalse($this->validator->validate($section, 0)->isValid());
    }

    /**
     * Het beheerscherm vult zijn keuzemenu met deze lijst. Wijkt hij af van
     * wat de validator accepteert, dan biedt het menu iets aan dat bij het
     * opslaan geweigerd wordt.
     */
    public function testTheOfferedVariantsMatchWhatIsAccepted(): void
    {
        $variants = FieldValidator::choices()['variant'];

        self::assertSame(['cards', 'steps', 'timeline'], $variants);

        foreach ($variants as $variant) {
            self::assertTrue($this->validator->validate(self::list($variant), 0)->isValid());
        }
    }

    /** @return array<string, mixed> */
    private static function list(string $variant): array
    {
        return [
            'type' => 'list',
            'background' => 'light',
            'heading' => 'Een lijst',
            'intro' => '',
            'variant' => $variant,
            'items' => [
                ['title' => 'Stap', 'text' => 'Een korte uitleg.'],
            ],
        ];
    }
}
