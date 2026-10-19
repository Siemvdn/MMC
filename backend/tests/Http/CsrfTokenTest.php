<?php

declare(strict_types=1);

namespace App\Tests\Http;

use App\Http\CsrfToken;
use App\Http\Session;
use PHPUnit\Framework\TestCase;

final class CsrfTokenTest extends TestCase
{
    private CsrfToken $token;

    protected function setUp(): void
    {
        $_SESSION = [];
        $this->token = new CsrfToken(new Session(sys_get_temp_dir() . '/app-csrf'));
    }

    protected function tearDown(): void
    {
        $_SESSION = [];
    }

    public function testIssuesTheSameTokenWithinOneSession(): void
    {
        $eerste = $this->token->issue();

        self::assertSame($eerste, $this->token->issue());
        self::assertSame(64, strlen($eerste));
    }

    public function testMatchesOnlyTheIssuedToken(): void
    {
        $uitgegeven = $this->token->issue();

        self::assertTrue($this->token->matches($uitgegeven));
        self::assertFalse($this->token->matches('iets anders'));
        self::assertFalse($this->token->matches(''));
        self::assertFalse($this->token->matches(null));
    }

    /** Zonder uitgegeven token mag niets matchen, ook geen lege invoer. */
    public function testNothingMatchesBeforeATokenIsIssued(): void
    {
        self::assertFalse($this->token->matches(''));
        self::assertFalse($this->token->matches('van alles'));
    }

    public function testRotatingGivesADifferentToken(): void
    {
        $oud = $this->token->issue();
        $nieuw = $this->token->rotate();

        self::assertNotSame($oud, $nieuw);
        self::assertFalse($this->token->matches($oud));
        self::assertTrue($this->token->matches($nieuw));
    }
}
