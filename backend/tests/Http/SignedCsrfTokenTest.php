<?php

declare(strict_types=1);

namespace App\Tests\Http;

use App\Http\SignedCsrfToken;
use PHPUnit\Framework\TestCase;

/**
 * Het token voor het publieke contactformulier draagt zijn eigen bewijs —
 * er is geen sessie om tegen te controleren, dus deze test is de enige
 * plek die de handtekening en de verlooptijd afdekt (CLAUDE.md §11, §15).
 */
final class SignedCsrfTokenTest extends TestCase
{
    private SignedCsrfToken $token;

    protected function setUp(): void
    {
        $this->token = new SignedCsrfToken('test-geheim');
    }

    public function testAcceptsATokenItIssuedItself(): void
    {
        self::assertTrue($this->token->verify($this->token->issue()));
    }

    public function testRejectsAMissingOrEmptyToken(): void
    {
        self::assertFalse($this->token->verify(null));
        self::assertFalse($this->token->verify(''));
    }

    public function testRejectsATokenWithATamperedSignature(): void
    {
        [$timestamp] = explode('.', $this->token->issue(), 2);

        self::assertFalse($this->token->verify($timestamp . '.' . str_repeat('a', 64)));
    }

    public function testRejectsATokenSignedWithADifferentSecret(): void
    {
        $andereBoot = new SignedCsrfToken('een-ander-geheim');

        self::assertFalse($this->token->verify($andereBoot->issue()));
    }

    public function testRejectsAMalformedToken(): void
    {
        self::assertFalse($this->token->verify('geen-geldig-formaat'));
        self::assertFalse($this->token->verify('123abc.zzz'));
    }

    public function testRejectsATokenOlderThanTwoHours(): void
    {
        $timestamp = (string) (time() - 7201);
        $signature = hash_hmac('sha256', $timestamp, 'test-geheim');

        self::assertFalse($this->token->verify($timestamp . '.' . $signature));
    }

    public function testAcceptsATokenJustWithinTwoHours(): void
    {
        $timestamp = (string) (time() - 7199);
        $signature = hash_hmac('sha256', $timestamp, 'test-geheim');

        self::assertTrue($this->token->verify($timestamp . '.' . $signature));
    }
}
