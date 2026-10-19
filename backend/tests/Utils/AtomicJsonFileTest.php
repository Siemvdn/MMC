<?php

declare(strict_types=1);

namespace App\Tests\Utils;

use App\Utils\AtomicJsonFile;
use App\Utils\JsonFileError;
use PHPUnit\Framework\TestCase;

/**
 * Deze class draagt inmiddels zowel de content van de klant als de
 * inlogpogingen. Gaat hier iets mis, dan gaat er data verloren.
 */
final class AtomicJsonFileTest extends TestCase
{
    private string $directory;

    private string $path;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir() . '/app-atomic-' . bin2hex(random_bytes(6));

        if (!mkdir($this->directory, 0777, true) && !is_dir($this->directory)) {
            self::fail('De tijdelijke testmap kon niet aangemaakt worden.');
        }

        $this->path = $this->directory . '/gegevens.json';
    }

    protected function tearDown(): void
    {
        foreach (glob($this->directory . '/*') ?: [] as $path) {
            unlink($path);
        }

        rmdir($this->directory);
    }

    public function testWritesAndReadsBack(): void
    {
        $file = new AtomicJsonFile($this->path);

        self::assertFalse($file->exists());

        $file->write(['naam' => 'waarde', 'lijst' => [1, 2, 3]]);

        self::assertTrue($file->exists());
        self::assertSame(['naam' => 'waarde', 'lijst' => [1, 2, 3]], $file->read());
    }

    public function testKeepsThepreviousVersionAsBackup(): void
    {
        $file = new AtomicJsonFile($this->path);

        $file->write(['versie' => 1]);
        $eersteVersie = file_get_contents($this->path);

        $file->write(['versie' => 2]);

        self::assertSame(['versie' => 2], $file->read());
        self::assertFileExists($this->path . '.bak');
        self::assertSame($eersteVersie, file_get_contents($this->path . '.bak'));
    }

    /**
     * Vluchtige gegevens zoals inlogpogingen hebben geen backup nodig; die zou
     * alleen ruis opleveren in de map.
     */
    public function testCanBeToldNotToKeepABackup(): void
    {
        $file = new AtomicJsonFile($this->path, keepBackup: false);

        $file->write(['poging' => 1]);
        $file->write(['poging' => 2]);

        self::assertFileDoesNotExist($this->path . '.bak');
    }

    public function testLeavesNoTemporaryFilesBehind(): void
    {
        (new AtomicJsonFile($this->path))->write(['iets' => true]);

        self::assertSame([], glob($this->directory . '/atomic-*'));
    }

    public function testReadingAMissingFileFails(): void
    {
        $this->expectException(JsonFileError::class);

        (new AtomicJsonFile($this->path))->read();
    }

    public function testReadingBrokenJsonFails(): void
    {
        file_put_contents($this->path, '{ dit is geen json');

        $this->expectException(JsonFileError::class);

        (new AtomicJsonFile($this->path))->read();
    }

    /** De map wordt aangemaakt als hij nog niet bestaat. */
    public function testCreatesTheDirectoryWhenWriting(): void
    {
        $nested = $this->directory . '/dieper/gegevens.json';

        (new AtomicJsonFile($nested))->write(['ok' => true]);

        self::assertFileExists($nested);

        // Opruimen, want tearDown kijkt maar één niveau diep.
        foreach (glob($this->directory . '/dieper/*') ?: [] as $path) {
            unlink($path);
        }

        rmdir($this->directory . '/dieper');
    }
}
