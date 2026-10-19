<?php

declare(strict_types=1);

namespace App\Utils;

use JsonException;
use Throwable;

/**
 * Eén JSON-bestand op schijf, dat nooit half geschreven kan achterblijven.
 *
 * Deze machinerie zat eerst in ContentRepository. Nu de rate limiter precies
 * hetzelfde nodig heeft, staat hij hier — CLAUDE.md §4: iets uitnemen zodra
 * het écht een tweede keer voorkomt, niet eerder.
 *
 * Wat een schrijfactie doet, in deze volgorde:
 *
 *   1. naar JSON omzetten (mislukt dat, dan is er nog niets gebeurd);
 *   2. een exclusief slot nemen op een apart .lock-bestand;
 *   3. de vorige versie bewaren als .bak, indien gewenst;
 *   4. volledig naar een tijdelijk bestand in dezelfde map schrijven;
 *   5. dat er in één stap overheen schuiven met rename().
 *
 * Lezen gebeurt bewust zonder slot. Omdat elke schrijfactie eindigt met een
 * rename() — één ondeelbare stap — ziet een lezer altijd het volledige oude of
 * het volledige nieuwe bestand, nooit iets halfs.
 */
final class AtomicJsonFile
{
    private const BACKUP_SUFFIX = '.bak';
    private const LOCK_SUFFIX = '.lock';
    private const TEMPORARY_PREFIX = 'atomic-';

    /**
     * Expliciet gezet omdat tempnam() platformafhankelijke rechten geeft
     * (0600 op Linux, 0666 op Windows) en het doelbestand die na de rename
     * erft. Zonder deze regel zou het bestand op de server 0600 worden, en dan
     * kan de webserver het niet meer lezen als die onder een andere gebruiker
     * draait dan degene die schreef.
     *
     * Let op: chmod() doet op Windows niets meer dan het read-only-attribuut
     * omzetten. Lokaal blijft een bestand daarom 0666 en is deze regel niet te
     * controleren; op Linux-hosting werkt hij wel — en daar doet
     * hij ertoe.
     */
    private const FILE_PERMISSIONS = 0644;

    private const ENCODE_FLAGS = JSON_PRETTY_PRINT
        | JSON_UNESCAPED_SLASHES
        | JSON_UNESCAPED_UNICODE
        | JSON_THROW_ON_ERROR;

    private const MAX_DEPTH = 32;

    /**
     * @param bool $keepBackup Of de vorige versie bewaard moet worden. Aan voor
     *        content, waar een foutieve wijziging terug te draaien moet zijn
     *        (§10). Uit voor vluchtige gegevens zoals inlogpogingen, waar een
     *        .bak alleen ruis oplevert.
     */
    public function __construct(
        private readonly string $path,
        private readonly bool $keepBackup = true,
    ) {
    }

    public function exists(): bool
    {
        return is_file($this->path);
    }

    /**
     * @return array<array-key, mixed>
     *
     * @throws JsonFileError als het bestand ontbreekt, onleesbaar is of geen
     *         geldig JSON-object bevat
     */
    public function read(): array
    {
        if (!$this->exists()) {
            throw new JsonFileError(sprintf('%s bestaat niet.', $this->path));
        }

        $raw = file_get_contents($this->path);

        if ($raw === false) {
            throw new JsonFileError(sprintf('%s kon niet gelezen worden.', $this->path));
        }

        try {
            $decoded = json_decode($raw, true, self::MAX_DEPTH, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new JsonFileError(
                sprintf('%s bevat ongeldige JSON.', $this->path),
                0,
                $exception,
            );
        }

        if (!is_array($decoded)) {
            throw new JsonFileError(sprintf('%s bevat geen object.', $this->path));
        }

        return $decoded;
    }

    public function hasBackup(): bool
    {
        return is_file($this->path . self::BACKUP_SUFFIX);
    }

    /**
     * De vorige versie, zoals die bij de laatste schrijfactie bewaard is.
     *
     * Deze methode zet niets terug; dat is een beslissing voor de laag
     * erboven, die eerst wil valideren wat er teruggezet wordt.
     *
     * @return array<array-key, mixed>
     *
     * @throws JsonFileError als er geen bruikbare backup is
     */
    public function readBackup(): array
    {
        return (new self($this->path . self::BACKUP_SUFFIX, keepBackup: false))->read();
    }

    /**
     * @param array<array-key, mixed> $data
     *
     * @throws JsonFileError als er iets misgaat; het bestaande bestand blijft
     *         dan ongemoeid
     */
    public function write(array $data): void
    {
        try {
            $json = json_encode($data, self::ENCODE_FLAGS);
        } catch (JsonException $exception) {
            throw new JsonFileError('De gegevens konden niet naar JSON omgezet worden.', 0, $exception);
        }

        $lock = $this->acquireLock();

        try {
            $this->backup();
            $this->writeAtomically($json);
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    /**
     * Het slot ligt op een apart .lock-bestand en niet op het bestand zelf.
     * Dat moet ook: het bestand wordt tijdens het schrijven vervangen door een
     * rename(), waarmee een slot dáárop zijn betekenis zou verliezen.
     *
     * @return resource
     */
    private function acquireLock(): mixed
    {
        $directory = dirname($this->path);

        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            throw new JsonFileError(sprintf('De map %s kon niet aangemaakt worden.', $directory));
        }

        $handle = fopen($this->path . self::LOCK_SUFFIX, 'c');

        if ($handle === false) {
            throw new JsonFileError('Het slotbestand kon niet geopend worden.');
        }

        if (!flock($handle, LOCK_EX)) {
            fclose($handle);

            throw new JsonFileError('Er kon geen exclusief slot verkregen worden.');
        }

        return $handle;
    }

    /**
     * Mislukt de backup, dan gaat de schrijfactie niet door. §10 eist een
     * backup bij elke update; doorgaan zonder zou betekenen dat een foutieve
     * wijziging niet meer terug te draaien is.
     */
    private function backup(): void
    {
        if (!$this->keepBackup || !$this->exists()) {
            return;
        }

        if (!copy($this->path, $this->path . self::BACKUP_SUFFIX)) {
            throw new JsonFileError(
                'De backup van de vorige versie mislukte; er is niets weggeschreven.',
            );
        }
    }

    /**
     * Schrijft eerst volledig naar een tijdelijk bestand in dezelfde map, en
     * schuift dat er daarna in één stap overheen. Dat het tijdelijke bestand in
     * dezelfde map staat is geen detail: een rename() is alleen ondeelbaar
     * binnen hetzelfde bestandssysteem.
     */
    private function writeAtomically(string $json): void
    {
        $temporary = tempnam(dirname($this->path), self::TEMPORARY_PREFIX);

        if ($temporary === false) {
            throw new JsonFileError('Er kon geen tijdelijk bestand aangemaakt worden.');
        }

        try {
            if (file_put_contents($temporary, $json) === false) {
                throw new JsonFileError('Het tijdelijke bestand kon niet geschreven worden.');
            }

            if (!chmod($temporary, self::FILE_PERMISSIONS)) {
                throw new JsonFileError('De rechten op het tijdelijke bestand konden niet gezet worden.');
            }

            if (!rename($temporary, $this->path)) {
                throw new JsonFileError('Het bestand kon niet op zijn plaats gezet worden.');
            }
        } catch (Throwable $exception) {
            // Laat geen half bestand achter naast het echte.
            if (is_file($temporary)) {
                unlink($temporary);
            }

            throw $exception;
        }
    }
}
