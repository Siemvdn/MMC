<?php

declare(strict_types=1);

namespace App\Tests\Repositories;

use App\Repositories\ContentFile;
use App\Repositories\ContentNotFound;
use App\Repositories\ContentRepository;
use PHPUnit\Framework\TestCase;

/**
 * Het terugzetten van de vorige versie. Dit is de knop waar de beheerder op
 * drukt als hij iets kapot heeft gemaakt, dus hij moet betrouwbaar zijn.
 */
final class ContentRestoreTest extends TestCase
{
    private string $directory;

    private ContentRepository $repository;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir() . '/app-herstel-' . bin2hex(random_bytes(6));

        if (!mkdir($this->directory, 0777, true) && !is_dir($this->directory)) {
            self::fail('De tijdelijke testmap kon niet aangemaakt worden.');
        }

        $this->repository = new ContentRepository($this->directory);

        file_put_contents(
            $this->directory . '/home.json',
            json_encode(self::page('eerste'), JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR),
        );
    }

    protected function tearDown(): void
    {
        foreach (glob($this->directory . '/*') ?: [] as $path) {
            unlink($path);
        }

        rmdir($this->directory);
    }

    public function testThereIsNoPreviousVersionBeforeTheFirstSave(): void
    {
        self::assertFalse($this->repository->hasPreviousVersion(ContentFile::Home));

        $this->expectException(ContentNotFound::class);

        $this->repository->restorePrevious(ContentFile::Home);
    }

    public function testRestoringBringsBackTheVersionFromBeforeTheLastSave(): void
    {
        $this->repository->write(ContentFile::Home, self::page('tweede'));

        self::assertTrue($this->repository->hasPreviousVersion(ContentFile::Home));
        self::assertSame('tweede', $this->headingOf(ContentFile::Home));

        $this->repository->restorePrevious(ContentFile::Home);

        self::assertSame('eerste', $this->headingOf(ContentFile::Home));
    }

    /**
     * Twee keer terugzetten brengt je weer waar je begon. Dat volgt uit de
     * opzet — terugzetten loopt via de normale schrijfactie, dus de huidige
     * versie wordt de nieuwe backup — en betekent dat er nooit een versie
     * verloren gaat door een misklik.
     */
    public function testRestoringTwiceReturnsToWhereYouWere(): void
    {
        $this->repository->write(ContentFile::Home, self::page('tweede'));

        $this->repository->restorePrevious(ContentFile::Home);
        self::assertSame('eerste', $this->headingOf(ContentFile::Home));

        $this->repository->restorePrevious(ContentFile::Home);
        self::assertSame('tweede', $this->headingOf(ContentFile::Home));
    }

    private function headingOf(ContentFile $file): string
    {
        $content = $this->repository->read($file);
        $heading = $content['sections'][0]['heading'] ?? null;

        self::assertIsString($heading);

        return $heading;
    }

    /** @return array<string, mixed> */
    private static function page(string $heading): array
    {
        return [
            'meta' => ['title' => 'Titel', 'description' => 'Beschrijving'],
            'sections' => [
                [
                    'type' => 'prose',
                    'background' => 'light',
                    'heading' => $heading,
                    'text' => 'Tekst.',
                    'image' => null,
                    'imageAlt' => '',
                    'imagePosition' => 'right',
                ],
            ],
        ];
    }
}
