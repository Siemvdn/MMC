<?php

declare(strict_types=1);

namespace App\Tests\Services;

use App\Repositories\ContentFile;
use App\Repositories\ContentRepository;
use App\Services\ContentService;
use PHPUnit\Framework\TestCase;

/**
 * Wat de publieke API van een pagina teruggeeft.
 *
 * Een lijst die nog wacht op inhoud — een `list` zonder items, of de leden
 * en projecten zolang die er nog niet zijn — valt weg, zodat er geen kop
 * zonder inhoud op de site staat. Aantekeningen (`_todo`) gaan nooit mee.
 */
final class ContentServiceTest extends TestCase
{
    private string $directory;

    private ContentService $service;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir() . '/app-test-' . bin2hex(random_bytes(6));

        if (!mkdir($this->directory, 0777, true) && !is_dir($this->directory)) {
            self::fail('De tijdelijke testmap kon niet aangemaakt worden.');
        }

        $this->service = new ContentService(new ContentRepository($this->directory));

        $this->givenFileContains('site.json', [
            'businessName' => 'Een naam',
            'contact' => ['phone' => '', 'email' => '', 'area' => ''],
            'sameAs' => [],
        ]);
    }

    protected function tearDown(): void
    {
        foreach (glob($this->directory . '/*') ?: [] as $path) {
            unlink($path);
        }

        rmdir($this->directory);
    }

    public function testLeavesOutMembersAndProjectsThatAreStillEmpty(): void
    {
        $this->givenPage([
            self::members([]),
            self::projects([]),
            self::teaser(),
        ]);

        $types = array_column($this->service->pageContent(ContentFile::Projects)['sections'], 'type');

        self::assertSame(['teaser'], $types);
    }

    public function testKeepsMembersAndProjectsOnceTheyAreFilled(): void
    {
        $this->givenPage([
            self::members([[
                'name' => 'Een lid',
                'specialty' => '',
                'website' => '',
                'image' => null,
                'imageAlt' => '',
                '_todo' => 'Foto volgt.',
            ]]),
            self::projects([[
                'title' => 'Een tafel',
                'maker' => '',
                'category' => '',
                'description' => '',
                'image' => null,
                'imageAlt' => '',
            ]]),
        ]);

        $sections = $this->service->pageContent(ContentFile::Projects)['sections'];

        self::assertSame(['members', 'projects'], array_column($sections, 'type'));
        self::assertArrayNotHasKey('_todo', $sections[0]['members'][0]);
    }

    /** @param list<array<string, mixed>> $sections */
    private function givenPage(array $sections): void
    {
        $this->givenFileContains('projecten.json', [
            'meta' => ['title' => 'Projecten', 'description' => ''],
            'sections' => $sections,
        ]);
    }

    /** @param array<string, mixed> $content */
    private function givenFileContains(string $filename, array $content): void
    {
        file_put_contents(
            $this->directory . '/' . $filename,
            json_encode($content, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR),
        );
    }

    /**
     * @param list<array<string, mixed>> $members
     *
     * @return array<string, mixed>
     */
    private static function members(array $members): array
    {
        return [
            'type' => 'members',
            'background' => 'tinted',
            'heading' => 'Leden',
            'intro' => '',
            'members' => $members,
        ];
    }

    /**
     * @param list<array<string, mixed>> $projects
     *
     * @return array<string, mixed>
     */
    private static function projects(array $projects): array
    {
        return [
            'type' => 'projects',
            'background' => 'light',
            'heading' => 'Projecten',
            'intro' => '',
            'projects' => $projects,
        ];
    }

    /** @return array<string, mixed> */
    private static function teaser(): array
    {
        return [
            'type' => 'teaser',
            'background' => 'light',
            'heading' => 'Leden',
            'source' => 'members',
            'linkLabel' => 'Alle leden',
        ];
    }
}
