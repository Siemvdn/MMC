<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Utils\AtomicJsonFile;
use App\Utils\JsonFileError;

/**
 * Houdt mislukte pogingen bij, per soort actie.
 *
 * Er is geen database (§3), dus dit gaat in JSON-bestanden — via dezelfde
 * atomische schrijfwijze als de content, zodat twee gelijktijdige pogingen
 * elkaars telling niet overschrijven.
 *
 * Deze laag telt alleen; wát een teveel is, bepaalt RateLimiter.
 */
final class RateLimitRepository
{
    /**
     * Records ouder dan dit worden bij elke schrijfactie opgeruimd. Zonder dat
     * groeit het bestand eindeloos door met adressen die nooit meer terugkomen
     * — en dat zijn persoonsgegevens die we niet langer hoeven te bewaren dan
     * nodig (§15, bewaartermijn).
     */
    private const MAX_AGE_SECONDS = 86400;

    public function __construct(private readonly string $directory)
    {
    }

    /**
     * @return array{attempts: int, firstAttempt: int}|null
     */
    public function find(string $bucket, string $key): ?array
    {
        $records = $this->readAll($bucket);
        $record = $records[$key] ?? null;

        if (!is_array($record)) {
            return null;
        }

        $attempts = $record['attempts'] ?? null;
        $firstAttempt = $record['firstAttempt'] ?? null;

        if (!is_int($attempts) || !is_int($firstAttempt)) {
            return null;
        }

        return ['attempts' => $attempts, 'firstAttempt' => $firstAttempt];
    }

    public function save(string $bucket, string $key, int $attempts, int $firstAttempt): void
    {
        $records = $this->prune($this->readAll($bucket));
        $records[$key] = ['attempts' => $attempts, 'firstAttempt' => $firstAttempt];

        $this->fileFor($bucket)->write($records);
    }

    public function remove(string $bucket, string $key): void
    {
        $records = $this->prune($this->readAll($bucket));

        if (!array_key_exists($key, $records)) {
            return;
        }

        unset($records[$key]);

        $this->fileFor($bucket)->write($records);
    }

    /**
     * Een onleesbaar bestand levert een lege telling op in plaats van een
     * fout.
     *
     * Dat is hier de juiste kant om op te falen: raakt het bestand beschadigd,
     * dan mag dat niemand buitensluiten die niets misdaan heeft. Het gevolg is
     * hooguit dat een aanvaller even opnieuw mag beginnen te tellen, en dat
     * weegt niet op tegen een beheerder die er niet meer in komt.
     *
     * @return array<string, mixed>
     */
    private function readAll(string $bucket): array
    {
        $file = $this->fileFor($bucket);

        if (!$file->exists()) {
            return [];
        }

        try {
            return $file->read();
        } catch (JsonFileError) {
            return [];
        }
    }

    /**
     * @param array<string, mixed> $records
     *
     * @return array<string, mixed>
     */
    private function prune(array $records): array
    {
        $cutoff = time() - self::MAX_AGE_SECONDS;

        return array_filter(
            $records,
            static function (mixed $record) use ($cutoff): bool {
                if (!is_array($record)) {
                    return false;
                }

                $firstAttempt = $record['firstAttempt'] ?? null;

                return is_int($firstAttempt) && $firstAttempt > $cutoff;
            },
        );
    }

    private function fileFor(string $bucket): AtomicJsonFile
    {
        // Geen backup: dit zijn vluchtige gegevens, en een .bak zou alleen
        // langer bewaren wat we juist willen opruimen.
        return new AtomicJsonFile(
            $this->directory . '/' . $this->safeBucketName($bucket) . '.json',
            keepBackup: false,
        );
    }

    /**
     * De naam komt uit de code en nooit uit een verzoek, maar dit maakt dat
     * hard in plaats van iets om op te vertrouwen.
     */
    private function safeBucketName(string $bucket): string
    {
        $safe = preg_replace('#[^a-z0-9-]#', '', strtolower($bucket));

        return $safe === null || $safe === '' ? 'onbekend' : $safe;
    }
}
