<?php

declare(strict_types=1);

namespace App\Services;

use App\Repositories\RateLimitRepository;

/**
 * Bepaalt wanneer er te vaak geprobeerd is (CLAUDE.md §9, §11).
 *
 * Gebruikt voor het inlogformulier en straks voor het contactformulier. De
 * telling zelf staat in RateLimitRepository; hier staat het beleid.
 */
final class RateLimiter
{
    /** Vijf pogingen, met daarna een tijdelijke blokkade (CLAUDE.md §11). */
    public const MAX_ATTEMPTS = 5;

    /**
     * Na dit tijdsbestek begint de telling opnieuw. Vijftien minuten is lang
     * genoeg om geautomatiseerd raden onaantrekkelijk te maken, en kort genoeg
     * dat iemand die zich drie keer vertypte niet zijn middag kwijt is.
     */
    public const WINDOW_SECONDS = 900;

    public function __construct(
        private readonly RateLimitRepository $repository,
        private readonly string $secret,
    ) {
    }

    /** Hoeveel pogingen er nog over zijn. Nul betekent geblokkeerd. */
    public function remainingAttempts(string $bucket, string $identifier): int
    {
        $record = $this->currentRecord($bucket, $identifier);

        if ($record === null) {
            return self::MAX_ATTEMPTS;
        }

        return max(0, self::MAX_ATTEMPTS - $record['attempts']);
    }

    public function isBlocked(string $bucket, string $identifier): bool
    {
        return $this->remainingAttempts($bucket, $identifier) === 0;
    }

    public function registerFailure(string $bucket, string $identifier): void
    {
        $key = $this->keyFor($identifier);
        $record = $this->currentRecord($bucket, $identifier);

        $this->repository->save(
            $bucket,
            $key,
            ($record['attempts'] ?? 0) + 1,
            $record['firstAttempt'] ?? time(),
        );
    }

    /** Na een geslaagde poging telt het verleden niet meer mee. */
    public function clear(string $bucket, string $identifier): void
    {
        $this->repository->remove($bucket, $this->keyFor($identifier));
    }

    /**
     * @return array{attempts: int, firstAttempt: int}|null
     */
    private function currentRecord(string $bucket, string $identifier): ?array
    {
        $record = $this->repository->find($bucket, $this->keyFor($identifier));

        if ($record === null) {
            return null;
        }

        // Buiten het tijdsbestek telt het record niet meer mee.
        if (time() - $record['firstAttempt'] > self::WINDOW_SECONDS) {
            return null;
        }

        return $record;
    }

    /**
     * Het IP-adres wordt niet zelf opgeslagen maar als HMAC.
     *
     * Een IP-adres is een persoonsgegeven, en een lijst met adressen van
     * iedereen die zich vertypte is meer dan we nodig hebben (§15,
     * dataminimalisatie). Tellen kan prima op een afgeleide. Een gewone hash
     * zou hier te weinig zijn — er zijn maar vier miljard IPv4-adressen, dus
     * die zijn zo teruggerekend. Met APP_SECRET als sleutel kan dat niet.
     */
    private function keyFor(string $identifier): string
    {
        return hash_hmac('sha256', $identifier, $this->secret);
    }
}
