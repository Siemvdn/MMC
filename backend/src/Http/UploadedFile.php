<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Eén geüpload bestand, zoals PHP het in $_FILES aanlevert.
 *
 * Alles hierin komt van buiten en is dus onbetrouwbaar — óók de naam en het
 * MIME-type, die de browser gewoon meestuurt zoals de aanvrager ze opgeeft.
 * Deze class doet daarom niets anders dan de gegevens bij elkaar houden; het
 * oordeel of het bestand deugt hoort in UploadValidator.
 */
final class UploadedFile
{
    private function __construct(
        /**
         * De naam die de aanvrager opgaf. Uitsluitend om aan de gebruiker te
         * tonen — nooit gebruiken om mee op te slaan (CLAUDE.md §11).
         */
        public readonly string $clientName,
        public readonly string $temporaryPath,
        public readonly int $size,
        public readonly int $errorCode,
    ) {
    }

    /**
     * @param array<array-key, mixed> $entry één ingang uit $_FILES
     */
    public static function fromFilesEntry(array $entry): ?self
    {
        // Bij een meervoudige upload zijn de velden arrays. Dit endpoint
        // accepteert er één tegelijk; alles anders valt hier af.
        $name = $entry['name'] ?? null;
        $temporaryPath = $entry['tmp_name'] ?? null;
        $size = $entry['size'] ?? null;
        $errorCode = $entry['error'] ?? null;

        if (!is_string($name) || !is_string($temporaryPath) || !is_int($size) || !is_int($errorCode)) {
            return null;
        }

        return new self($name, $temporaryPath, $size, $errorCode);
    }

    public static function forTesting(
        string $clientName,
        string $temporaryPath,
        int $size,
        int $errorCode = UPLOAD_ERR_OK,
    ): self {
        return new self($clientName, $temporaryPath, $size, $errorCode);
    }

    public function hasUploadError(): bool
    {
        return $this->errorCode !== UPLOAD_ERR_OK;
    }
}
