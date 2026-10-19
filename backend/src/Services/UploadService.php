<?php

declare(strict_types=1);

namespace App\Services;

use App\Http\UploadedFile;
use App\Validators\UploadValidator;
use App\Validators\ValidationResult;
use RuntimeException;

/**
 * Zet een goedgekeurd bestand op zijn plaats in de uploadmap.
 *
 * Bewust dun: het oordeel of een bestand deugt zit in UploadValidator. Wat
 * hier gebeurt is het verplaatsen, en dat gebeurt onder een nieuwe naam.
 */
final class UploadService
{
    /**
     * Het publieke pad waaronder afbeeldingen bereikbaar zijn. Moet blijven
     * passen bij de whitelist in FieldValidator, die precies deze vorm eist.
     */
    private const PUBLIC_PREFIX = '/uploads/';

    /** Acht bytes geeft zestien hextekens; genoeg om nooit te botsen. */
    private const NAME_BYTES = 8;

    private const DIRECTORY_PERMISSIONS = 0755;

    private const FILE_PERMISSIONS = 0644;

    /**
     * @param callable(string, string): bool $mover Verplaatst het tijdelijke
     *        bestand naar zijn plek. Standaard move_uploaded_file(), dat
     *        weigert elk pad dat niet echt van een upload komt — de
     *        bescherming tegen een verzoek dat de server een willekeurig
     *        bestand van schijf laat verplaatsen. In tests wordt hier een
     *        gewone verplaatsing ingezet, omdat er dan geen echte upload is.
     */
    public function __construct(
        private readonly string $directory,
        private readonly UploadValidator $validator = new UploadValidator(),
        private $mover = null,
    ) {
    }

    public function validate(?UploadedFile $file): ValidationResult
    {
        return $this->validator->validate($file);
    }

    /**
     * Slaat het bestand op en geeft het publieke pad terug.
     *
     * Roep dit alleen aan nadat validate() akkoord gaf.
     *
     * @throws RuntimeException als het opslaan misgaat
     */
    public function store(UploadedFile $file): string
    {
        $extension = $this->validator->extensionFor($file);

        if ($extension === null) {
            throw new RuntimeException('Het bestandstype kon niet bepaald worden.');
        }

        if (!is_dir($this->directory)
            && !mkdir($this->directory, self::DIRECTORY_PERMISSIONS, true)
            && !is_dir($this->directory)
        ) {
            throw new RuntimeException('De uploadmap kon niet aangemaakt worden.');
        }

        /*
         * Een volledig nieuwe naam, opgebouwd uit toeval en de extensie die
         * uit de ínhoud volgt. De aangeleverde naam wordt nergens gebruikt:
         * die kan van alles bevatten — mapniveaus, dubbele extensies,
         * tekens die op de server iets anders betekenen (§11).
         */
        $name = bin2hex(random_bytes(self::NAME_BYTES)) . '.' . $extension;
        $target = $this->directory . '/' . $name;

        if (!$this->move($file->temporaryPath, $target)) {
            throw new RuntimeException('Het bestand kon niet opgeslagen worden.');
        }

        // Niet als leesbaar-voor-iedereen laten staan of juist te streng: net
        // als bij de content zetten we de rechten expliciet, want ze zijn
        // platformafhankelijk.
        chmod($target, self::FILE_PERMISSIONS);

        return self::PUBLIC_PREFIX . $name;
    }

    private function move(string $from, string $to): bool
    {
        if ($this->mover !== null) {
            return ($this->mover)($from, $to);
        }

        /*
         * move_uploaded_file() controleert zelf dat $from daadwerkelijk via
         * een upload binnenkwam. Zonder die controle zou een verzoek dat een
         * pad naar bijvoorbeeld .env meestuurt, dat bestand naar de publieke
         * map kunnen laten verhuizen.
         */
        return move_uploaded_file($from, $to);
    }
}
