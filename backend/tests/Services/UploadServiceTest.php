<?php

declare(strict_types=1);

namespace App\Tests\Services;

use App\Http\UploadedFile;
use App\Services\UploadService;
use PHPUnit\Framework\TestCase;

/**
 * Het opslaan van een goedgekeurde afbeelding.
 *
 * In productie verplaatst move_uploaded_file() het bestand; die functie
 * weigert elk pad dat niet echt van een upload komt. In een test bestaat zo'n
 * upload niet, dus wordt er een gewone verplaatsing ingezet — de seam die de
 * service daarvoor heeft.
 */
final class UploadServiceTest extends TestCase
{
    private string $source;

    private string $uploads;

    private UploadService $service;

    protected function setUp(): void
    {
        $base = sys_get_temp_dir() . '/app-opslag-' . bin2hex(random_bytes(6));
        $this->source = $base . '/bron';
        $this->uploads = $base . '/uploads';

        mkdir($this->source, 0777, true);

        $this->service = new UploadService(
            $this->uploads,
            mover: static fn (string $from, string $to): bool => rename($from, $to),
        );
    }

    protected function tearDown(): void
    {
        foreach ([$this->uploads, $this->source] as $directory) {
            foreach (glob($directory . '/*') ?: [] as $path) {
                unlink($path);
            }

            if (is_dir($directory)) {
                rmdir($directory);
            }
        }

        rmdir(dirname($this->source));
    }

    /**
     * De kern van deze fase: de aangeleverde naam wordt nergens gebruikt. Die
     * kan mapniveaus, dubbele extensies of tekens bevatten die op de server
     * iets anders betekenen (§11).
     */
    public function testStoresUnderAFreshNameThatHasNothingToDoWithTheSuppliedOne(): void
    {
        $path = $this->service->store($this->givenPng('../../gevaarlijk naam.jpg'));

        self::assertStringStartsWith('/uploads/', $path);
        self::assertStringNotContainsString('gevaarlijk', $path);
        self::assertStringNotContainsString('..', $path);
        self::assertMatchesRegularExpression('#^/uploads/[0-9a-f]{16}\.png$#', $path);
    }

    /**
     * Het pad moet voldoen aan de whitelist die FieldValidator hanteert; anders
     * zou een geüploade foto niet in een sectie opgeslagen kunnen worden.
     */
    public function testTheReturnedPathIsAcceptedByTheContentValidator(): void
    {
        $path = $this->service->store($this->givenPng('foto.png'));

        self::assertMatchesRegularExpression(
            '#^/uploads/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$#',
            $path,
        );
    }

    /** De extensie volgt uit de inhoud, niet uit de naam. */
    public function testTheExtensionFollowsTheContent(): void
    {
        self::assertStringEndsWith('.png', $this->service->store($this->givenPng('foto.jpg')));
    }

    public function testTwoUploadsNeverOverwriteEachOther(): void
    {
        $first = $this->service->store($this->givenPng('a.png'));
        $second = $this->service->store($this->givenPng('b.png'));

        self::assertNotSame($first, $second);
        self::assertCount(2, glob($this->uploads . '/*') ?: []);
    }

    private function givenPng(string $clientName): UploadedFile
    {
        $bytes = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            true,
        );

        self::assertIsString($bytes);

        $path = $this->source . '/' . bin2hex(random_bytes(4));
        file_put_contents($path, $bytes);

        return UploadedFile::forTesting($clientName, $path, strlen($bytes));
    }
}
