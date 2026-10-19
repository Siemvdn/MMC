<?php

declare(strict_types=1);

namespace App\Services;

/**
 * De uitkomst van een inlogpoging, plus hoeveel pogingen er nog over zijn.
 *
 * Dat laatste toont het beheerscherm aan de beheerder ("Nog 3 pogingen"). Het
 * verraadt niets over de inloggegevens zelf — alleen hoe vaak er al misgetikt
 * is — en helpt iemand die zich vergist heeft te begrijpen wat er gebeurt.
 */
final class LoginResult
{
    private function __construct(
        public readonly LoginStatus $status,
        public readonly int $remainingAttempts,
    ) {
    }

    public static function success(): self
    {
        return new self(LoginStatus::Success, RateLimiter::MAX_ATTEMPTS);
    }

    public static function failed(int $remainingAttempts): self
    {
        return new self(LoginStatus::Failed, max(0, $remainingAttempts));
    }

    public static function blocked(): self
    {
        return new self(LoginStatus::Blocked, 0);
    }

    public static function notConfigured(): self
    {
        return new self(LoginStatus::NotConfigured, 0);
    }

    public function isSuccess(): bool
    {
        return $this->status === LoginStatus::Success;
    }
}
