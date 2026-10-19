<?php

declare(strict_types=1);

namespace App\Tests\Repositories;

use App\Repositories\ContentFile;
use App\Repositories\ContentNotFound;
use App\Repositories\ContentRepository;
use App\Repositories\ContentUnavailable;
use App\Repositories\InvalidContent;
use PHPUnit\Framework\TestCase;

/**
 * De Repository is de plek waar een bug de meeste schade aanricht: hier kan
 * content van de klant verloren gaan (CLAUDE.md §16). Deze tests dekken de
 * vier eisen uit §10 — validatie vooraf, backup, atomisch schrijven en de
 * afwezigheid van rommel — plus de bescherming tegen padmanipulatie.
 *
 * Elke test werkt in een eigen wegwerpmap, zodat ze elkaar niet beïnvloeden
 * en de echte content nooit geraakt wordt.
 */
final class ContentRepositoryTest extends TestCase
{
    private string $directory;

    private ContentRepository $repository;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir() . '/app-test-' . bin2hex(random_bytes(6));

        if (!mkdir($this->directory, 0777, true) && !is_dir($this->directory)) {
            self::fail('De tijdelijke testmap kon niet aangemaakt worden.');
        }

        $this->repository = new ContentRepository($this->directory);

        $this->givenFileContains('home.json', self::validPage());
    }

    protected function tearDown(): void
    {
        foreach (glob($this->directory . '/*') ?: [] as $path) {
            unlink($path);
        }

        rmdir($this->directory);
    }

    public function testReadsAValidContentFile(): void
    {
        $content = $this->repository->read(ContentFile::Home);

        self::assertSame('Een titel', $content['meta']['title']);
        self::assertCount(1, $content['sections']);
    }

    public function testMissingFileThrowsContentNotFound(): void
    {
        $this->expectException(ContentNotFound::class);

        $this->repository->read(ContentFile::Contact);
    }

    public function testBrokenJsonThrowsContentUnavailable(): void
    {
        file_put_contents($this->directory . '/home.json', '{ dit is geen json');

        $this->expectException(ContentUnavailable::class);

        $this->repository->read(ContentFile::Home);
    }

    /**
     * De belangrijkste test van dit bestand: een afgekeurde wijziging mag het
     * bestaande bestand met geen byte veranderen.
     */
    public function testInvalidContentIsRejectedAndLeavesTheFileUntouched(): void
    {
        $before = file_get_contents($this->directory . '/home.json');

        $broken = self::validPage();
        $broken['sections'][0]['headding'] = 'typefout';

        try {
            $this->repository->write(ContentFile::Home, $broken);
            self::fail('Er had een InvalidContent gegooid moeten worden.');
        } catch (InvalidContent $exception) {
            self::assertNotEmpty($exception->errors());
        }

        self::assertSame($before, file_get_contents($this->directory . '/home.json'));
    }

    public function testImageWithoutAlternativeTextIsRejected(): void
    {
        $content = self::validPage();
        $content['sections'][0]['image'] = '/uploads/portret.jpg';
        $content['sections'][0]['imageAlt'] = '';

        $this->expectException(InvalidContent::class);

        $this->repository->write(ContentFile::Home, $content);
    }

    public function testImagePathOutsideTheUploadDirectoryIsRejected(): void
    {
        $content = self::validPage();
        $content['sections'][0]['image'] = '/uploads/../../.env';
        $content['sections'][0]['imageAlt'] = 'iets';

        $this->expectException(InvalidContent::class);

        $this->repository->write(ContentFile::Home, $content);
    }

    public function testWritingKeepsABackupOfThePreviousVersion(): void
    {
        $before = file_get_contents($this->directory . '/home.json');

        $updated = self::validPage();
        $updated['meta']['title'] = 'Een nieuwe titel';

        $this->repository->write(ContentFile::Home, $updated);

        self::assertSame(
            'Een nieuwe titel',
            $this->repository->read(ContentFile::Home)['meta']['title'],
        );
        self::assertFileExists($this->directory . '/home.json.bak');
        self::assertSame($before, file_get_contents($this->directory . '/home.json.bak'));
    }

    public function testWritingLeavesNoTemporaryFilesBehind(): void
    {
        $this->repository->write(ContentFile::Home, self::validPage());

        self::assertSame([], glob($this->directory . '/content-*'));
    }

    public function testSiteFileUsesItsOwnStructure(): void
    {
        $this->givenFileContains('site.json', self::validSite());

        $site = self::validSite();
        $site['onbekend'] = true;

        $this->expectException(InvalidContent::class);

        $this->repository->write(ContentFile::Site, $site);
    }

    /**
     * De enum is de bescherming tegen padmanipulatie: de repository stelt
     * nooit zelf een bestandsnaam samen uit binnengekomen tekst.
     */
    public function testOnlyKnownSlugsResolveToAContentFile(): void
    {
        foreach (['../../.env', '../public/index.php', 'home.json', 'HOME', ''] as $attempt) {
            self::assertNull(
                ContentFile::tryFrom($attempt),
                sprintf('%s zou geen contentbestand mogen zijn.', $attempt),
            );
        }

        self::assertSame(ContentFile::Home, ContentFile::tryFrom('home'));
    }

    /** @param array<string, mixed> $content */
    private function givenFileContains(string $filename, array $content): void
    {
        file_put_contents(
            $this->directory . '/' . $filename,
            json_encode($content, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR),
        );
    }

    /** @return array<string, mixed> */
    private static function validPage(): array
    {
        return [
            'meta' => ['title' => 'Een titel', 'description' => 'Een beschrijving'],
            'sections' => [
                [
                    'type' => 'prose',
                    'background' => 'light',
                    'heading' => 'Een kop',
                    'text' => 'Een alinea.',
                    'image' => null,
                    'imageAlt' => '',
                    'imagePosition' => 'right',
                ],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private static function validSite(): array
    {
        return [
            'businessName' => 'Een naam',
            'contact' => ['phone' => '', 'email' => '', 'area' => ''],
            'sameAs' => [],
        ];
    }
}
