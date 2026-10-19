<?php

declare(strict_types=1);

namespace App\Tests\Services;

use App\Repositories\RateLimitRepository;
use App\Services\RateLimiter;
use PHPUnit\Framework\TestCase;

/**
 * De rate limiter is wat brute force tegenhoudt (CLAUDE.md §11). Telt hij
 * verkeerd, dan is er geen bovengrens meer aan het aantal gokpogingen.
 */
final class RateLimiterTest extends TestCase
{
    private const BUCKET = 'login';
    private const IP = '198.51.100.7';

    private string $directory;

    private RateLimiter $limiter;

    protected function setUp(): void
    {
        $this->directory = sys_get_temp_dir() . '/app-limiet-' . bin2hex(random_bytes(6));

        if (!mkdir($this->directory, 0777, true) && !is_dir($this->directory)) {
            self::fail('De tijdelijke testmap kon niet aangemaakt worden.');
        }

        $this->limiter = new RateLimiter(
            new RateLimitRepository($this->directory),
            'test-geheim',
        );
    }

    protected function tearDown(): void
    {
        foreach (glob($this->directory . '/*') ?: [] as $path) {
            unlink($path);
        }

        rmdir($this->directory);
    }

    public function testStartsWithTheFullNumberOfAttempts(): void
    {
        self::assertSame(RateLimiter::MAX_ATTEMPTS, $this->limiter->remainingAttempts(self::BUCKET, self::IP));
        self::assertFalse($this->limiter->isBlocked(self::BUCKET, self::IP));
    }

    public function testCountsDownWithEveryFailure(): void
    {
        $this->limiter->registerFailure(self::BUCKET, self::IP);

        self::assertSame(RateLimiter::MAX_ATTEMPTS - 1, $this->limiter->remainingAttempts(self::BUCKET, self::IP));
    }

    public function testBlocksAfterTheMaximum(): void
    {
        for ($i = 0; $i < RateLimiter::MAX_ATTEMPTS; $i++) {
            self::assertFalse($this->limiter->isBlocked(self::BUCKET, self::IP));
            $this->limiter->registerFailure(self::BUCKET, self::IP);
        }

        self::assertTrue($this->limiter->isBlocked(self::BUCKET, self::IP));
        self::assertSame(0, $this->limiter->remainingAttempts(self::BUCKET, self::IP));
    }

    public function testAFailureFromOneAddressDoesNotBlockAnother(): void
    {
        for ($i = 0; $i < RateLimiter::MAX_ATTEMPTS; $i++) {
            $this->limiter->registerFailure(self::BUCKET, self::IP);
        }

        self::assertTrue($this->limiter->isBlocked(self::BUCKET, self::IP));
        self::assertFalse($this->limiter->isBlocked(self::BUCKET, '203.0.113.9'));
    }

    public function testASuccessfulAttemptWipesTheHistory(): void
    {
        $this->limiter->registerFailure(self::BUCKET, self::IP);
        $this->limiter->registerFailure(self::BUCKET, self::IP);

        $this->limiter->clear(self::BUCKET, self::IP);

        self::assertSame(RateLimiter::MAX_ATTEMPTS, $this->limiter->remainingAttempts(self::BUCKET, self::IP));
    }

    public function testCountsAreKeptPerBucket(): void
    {
        for ($i = 0; $i < RateLimiter::MAX_ATTEMPTS; $i++) {
            $this->limiter->registerFailure('login', self::IP);
        }

        self::assertTrue($this->limiter->isBlocked('login', self::IP));
        self::assertFalse($this->limiter->isBlocked('contact', self::IP));
    }

    /**
     * Een IP-adres is een persoonsgegeven. Er hoort geen lijst met adressen
     * van iedereen die zich vertypte op schijf te staan (§15).
     */
    public function testTheAddressIsNotStoredInReadableForm(): void
    {
        $this->limiter->registerFailure(self::BUCKET, self::IP);

        $contents = file_get_contents($this->directory . '/login.json');

        self::assertIsString($contents);
        self::assertStringNotContainsString(self::IP, $contents);
    }

    /** Een oud record telt niet meer mee; anders zou een blokkade eeuwig duren. */
    public function testAnAttemptOutsideTheWindowNoLongerCounts(): void
    {
        $repository = new RateLimitRepository($this->directory);
        $limiter = new RateLimiter($repository, 'test-geheim');

        for ($i = 0; $i < RateLimiter::MAX_ATTEMPTS; $i++) {
            $limiter->registerFailure(self::BUCKET, self::IP);
        }

        self::assertTrue($limiter->isBlocked(self::BUCKET, self::IP));

        // Het record terugzetten alsof het van vóór het tijdsbestek is.
        $key = array_key_first((array) json_decode(
            (string) file_get_contents($this->directory . '/login.json'),
            true,
        ));
        self::assertIsString($key);

        $repository->save(
            self::BUCKET,
            $key,
            RateLimiter::MAX_ATTEMPTS,
            time() - RateLimiter::WINDOW_SECONDS - 1,
        );

        self::assertFalse($limiter->isBlocked(self::BUCKET, self::IP));
    }
}
