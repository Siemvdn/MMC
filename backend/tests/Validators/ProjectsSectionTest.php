<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Validators\SectionValidator;
use PHPUnit\Framework\TestCase;

/**
 * De projecten van de leden. Alleen de titel is verplicht: maker, soort
 * project en beschrijving mogen leeg blijven, en dan valt die regel op de
 * site gewoon weg.
 */
final class ProjectsSectionTest extends TestCase
{
    private SectionValidator $validator;

    protected function setUp(): void
    {
        $this->validator = new SectionValidator();
    }

    public function testAcceptsACompleteProject(): void
    {
        $result = $this->validator->validate(self::section([self::project()]), 0);

        self::assertTrue($result->isValid(), $result->asText());
    }

    public function testAcceptsAProjectWithOnlyATitle(): void
    {
        $project = self::project([
            'maker' => '',
            'category' => '',
            'description' => '',
            'image' => null,
            'imageAlt' => '',
        ]);

        self::assertTrue($this->validator->validate(self::section([$project]), 0)->isValid());
    }

    public function testRejectsAProjectWithoutTitle(): void
    {
        $result = $this->validator->validate(self::section([self::project(['title' => ''])]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('title', $result->asText());
    }

    public function testRejectsAMissingField(): void
    {
        $project = self::project();
        unset($project['category']);

        $result = $this->validator->validate(self::section([$project]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('category', $result->asText());
    }

    public function testRejectsADescriptionThatIsTooLong(): void
    {
        $project = self::project(['description' => str_repeat('a', 601)]);

        $result = $this->validator->validate(self::section([$project]), 0);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('description', $result->asText());
    }

    /** Een project heeft geen eigen webadres; dat veld hoort alleen bij een lid. */
    public function testRejectsAWebsiteOnAProject(): void
    {
        $project = self::project();
        $project['website'] = 'https://voorbeeld.nl';

        self::assertFalse($this->validator->validate(self::section([$project]), 0)->isValid());
    }

    public function testRejectsMoreThanThirtyProjects(): void
    {
        $projects = array_fill(0, 31, self::project());

        self::assertFalse($this->validator->validate(self::section($projects), 0)->isValid());
    }

    public function testRejectsProjectsThatAreNotAList(): void
    {
        $section = self::section([]);
        $section['projects'] = ['eerste' => self::project()];

        self::assertFalse($this->validator->validate($section, 0)->isValid());
    }

    /**
     * @param array<string, mixed> $overrides
     *
     * @return array<string, mixed>
     */
    private static function project(array $overrides = []): array
    {
        return [
            'title' => 'Eiken eettafel',
            'maker' => 'Een lid',
            'category' => 'Tafel',
            'description' => 'Een korte beschrijving.',
            'image' => '/uploads/tafel.webp',
            'imageAlt' => 'Eiken eettafel in een woonkamer',
            ...$overrides,
        ];
    }

    /**
     * @param list<array<string, mixed>> $projects
     *
     * @return array<string, mixed>
     */
    private static function section(array $projects): array
    {
        return [
            'type' => 'projects',
            'background' => 'light',
            'heading' => 'Alle projecten',
            'intro' => '',
            'projects' => $projects,
        ];
    }
}
