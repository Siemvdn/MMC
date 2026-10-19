<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Utils\AtomicJsonFile;
use App\Utils\JsonFileError;
use App\Validators\PageContentValidator;
use App\Validators\SiteContentValidator;
use App\Validators\ValidationResult;

/**
 * De enige laag die de content-JSON's leest en schrijft (CLAUDE.md §8, §10).
 *
 * Het veilig wegschrijven zelf — slot, backup, tijdelijk bestand, rename —
 * zit in AtomicJsonFile, omdat de rate limiter datzelfde nodig heeft. Wat híer
 * staat is wat eigen is aan content: welke bestanden er bestaan, welke
 * validator erbij hoort, en hoe een fout vertaald wordt naar iets waar de
 * bovenliggende laag mee kan werken.
 *
 * De volgorde bij schrijven is het punt: **eerst valideren, dan pas schrijven**.
 * Komt de content de validator niet door, dan is er niets op schijf gewijzigd.
 */
final class ContentRepository
{
    public function __construct(
        private readonly string $directory,
        private readonly PageContentValidator $pageValidator = new PageContentValidator(),
        private readonly SiteContentValidator $siteValidator = new SiteContentValidator(),
    ) {
    }

    /**
     * @return array<array-key, mixed>
     *
     * @throws ContentNotFound als het bestand niet bestaat
     * @throws ContentUnavailable als het bestand onleesbaar of kapot is
     */
    public function read(ContentFile $file): array
    {
        $jsonFile = $this->fileFor($file);

        if (!$jsonFile->exists()) {
            throw new ContentNotFound(
                sprintf('Contentbestand %s bestaat niet.', $file->filename()),
            );
        }

        try {
            return $jsonFile->read();
        } catch (JsonFileError $exception) {
            throw new ContentUnavailable(
                sprintf('Contentbestand %s kon niet gelezen worden.', $file->filename()),
                0,
                $exception,
            );
        }
    }

    /**
     * @param array<array-key, mixed> $content
     *
     * @throws InvalidContent als de structuur niet klopt; er is dan niets
     *         gewijzigd op schijf
     * @throws ContentUnavailable als het schrijven zelf misgaat
     */
    public function write(ContentFile $file, array $content): void
    {
        $validation = $this->validate($file, $content);

        if (!$validation->isValid()) {
            throw new InvalidContent($validation);
        }

        try {
            $this->fileFor($file)->write($content);
        } catch (JsonFileError $exception) {
            throw new ContentUnavailable(
                sprintf('Contentbestand %s kon niet geschreven worden.', $file->filename()),
                0,
                $exception,
            );
        }
    }

    public function hasPreviousVersion(ContentFile $file): bool
    {
        return $this->fileFor($file)->hasBackup();
    }

    /**
     * Zet de vorige versie terug.
     *
     * Loopt bewust via write(), en niet door het backupbestand er overheen te
     * kopiëren. Dat levert twee dingen op: de teruggezette inhoud gaat eerst
     * door de validator, en de huidige versie wordt de nieuwe backup. Twee keer
     * terugzetten brengt je dus weer waar je begon — er gaat nooit een versie
     * verloren doordat iemand zich vergist in welke kant hij op wil.
     *
     * @throws ContentNotFound als er geen vorige versie is
     * @throws InvalidContent als de vorige versie niet meer geldig is
     * @throws ContentUnavailable als het lezen of schrijven misgaat
     */
    public function restorePrevious(ContentFile $file): void
    {
        $jsonFile = $this->fileFor($file);

        if (!$jsonFile->hasBackup()) {
            throw new ContentNotFound(
                sprintf('Er is geen vorige versie van %s.', $file->filename()),
            );
        }

        try {
            $previous = $jsonFile->readBackup();
        } catch (JsonFileError $exception) {
            throw new ContentUnavailable(
                sprintf('De vorige versie van %s kon niet gelezen worden.', $file->filename()),
                0,
                $exception,
            );
        }

        $this->write($file, $previous);
    }

    /** @param array<array-key, mixed>|mixed $content */
    public function validate(ContentFile $file, mixed $content): ValidationResult
    {
        return $file->isPage()
            ? $this->pageValidator->validate($content)
            : $this->siteValidator->validate($content);
    }

    private function fileFor(ContentFile $file): AtomicJsonFile
    {
        // Content krijgt wél een backup: een foutieve wijziging moet terug te
        // draaien zijn (§10).
        return new AtomicJsonFile($this->directory . '/' . $file->filename(), keepBackup: true);
    }
}
