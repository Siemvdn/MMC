<?php

declare(strict_types=1);

namespace App\Tests\Validators;

use App\Http\UploadedFile;
use App\Validators\UploadValidator;
use PHPUnit\Framework\TestCase;

/**
 * De uploadcontrole. Dit is de plek waar een fout het duurst is: een bestand
 * dat hier doorheen komt, staat daarna publiek op de server.
 *
 * De rode draad in deze tests: de bestandsnaam en de opgegeven extensie doen
 * er niet toe, alleen wat er ín het bestand staat.
 */
final class UploadValidatorTest extends TestCase
{
    private string $directory;

    private UploadValidator $validator;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir() . '/app-upload-' . bin2hex(random_bytes(6));

        if (!mkdir($this->directory, 0777, true) && !is_dir($this->directory)) {
            self::fail('De tijdelijke testmap kon niet aangemaakt worden.');
        }

        $this->validator = new UploadValidator();
    }

    protected function tearDown(): void
    {
        foreach (glob($this->directory . '/*') ?: [] as $path) {
            unlink($path);
        }

        rmdir($this->directory);
    }

    public function testAcceptsARealPngImage(): void
    {
        $file = $this->givenFile('foto.png', $this->pngBytes());

        $result = $this->validator->validate($file);

        self::assertTrue($result->isValid(), $result->asText());
        self::assertSame('png', $this->validator->extensionFor($file));
    }

    /**
     * De klassieke aanval: een uitvoerbaar bestand dat zich voordoet als
     * afbeelding. De naam zegt .jpg, de inhoud is PHP.
     */
    public function testRejectsAPhpFileDisguisedAsAnImage(): void
    {
        $file = $this->givenFile('foto.jpg', '<?php echo "kwaadaardig"; ?>');

        $result = $this->validator->validate($file);

        self::assertFalse($result->isValid());
        self::assertNull($this->validator->extensionFor($file));
    }

    /** Ook met een dubbele extensie erin verstopt. */
    public function testRejectsADoubleExtension(): void
    {
        $file = $this->givenFile('foto.jpg.php', '<?php phpinfo();');

        self::assertFalse($this->validator->validate($file)->isValid());
    }

    /**
     * Andersom telt net zo goed: een echte afbeelding met een misleidende
     * naam is gewoon een afbeelding, en de extensie volgt uit de inhoud.
     */
    public function testTheExtensionComesFromTheContentNotTheName(): void
    {
        $file = $this->givenFile('van-alles.txt', $this->pngBytes());

        self::assertTrue($this->validator->validate($file)->isValid());
        self::assertSame('png', $this->validator->extensionFor($file));
    }

    public function testRejectsAFileThatIsTooLarge(): void
    {
        $file = UploadedFile::forTesting(
            'groot.jpg',
            $this->writeFile('groot.jpg', $this->pngBytes()),
            UploadValidator::MAX_BYTES + 1,
        );

        $result = $this->validator->validate($file);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('te groot', $result->asText());
    }

    public function testRejectsAnEmptyFile(): void
    {
        self::assertFalse($this->validator->validate($this->givenFile('leeg.jpg', ''))->isValid());
    }

    public function testRejectsAMissingFile(): void
    {
        self::assertFalse($this->validator->validate(null)->isValid());
    }

    /** PHP's eigen foutcodes worden vertaald naar begrijpelijke taal. */
    public function testReportsAnUploadErrorInPlainLanguage(): void
    {
        $file = UploadedFile::forTesting('foto.jpg', '', 0, UPLOAD_ERR_PARTIAL);

        $result = $this->validator->validate($file);

        self::assertFalse($result->isValid());
        self::assertStringContainsString('afgebroken', $result->asText());
    }

    /** Een GIF is een echte afbeelding, maar staat niet op de whitelist. */
    public function testRejectsAnUnsupportedImageFormat(): void
    {
        $gif = base64_decode('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', true);
        self::assertIsString($gif);

        self::assertFalse($this->validator->validate($this->givenFile('plaatje.gif', $gif))->isValid());
    }

    private function givenFile(string $name, string $contents): UploadedFile
    {
        return UploadedFile::forTesting(
            $name,
            $this->writeFile($name, $contents),
            strlen($contents),
        );
    }

    private function writeFile(string $name, string $contents): string
    {
        $path = $this->directory . '/' . $name;
        file_put_contents($path, $contents);

        return $path;
    }

    /** Een geldige PNG van één pixel. */
    private function pngBytes(): string
    {
        $bytes = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            true,
        );

        self::assertIsString($bytes);

        return $bytes;
    }
}
