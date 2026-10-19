<?php

declare(strict_types=1);

namespace App\Tests\Http;

use App\Http\MalformedRequest;
use App\Http\Request;
use PHPUnit\Framework\TestCase;

/**
 * Het verzoek is de eerste plek waar gegevens van buiten binnenkomen. Wat hier
 * doorheen glipt, glipt overal doorheen.
 */
final class RequestTest extends TestCase
{
    private const JSON_HEADER = ['Content-Type' => 'application/json'];

    public function testReadsAJsonBody(): void
    {
        $request = Request::create('POST', '/api/admin/login', '{"gebruiker":"beheerder"}', self::JSON_HEADER);

        self::assertSame(['gebruiker' => 'beheerder'], $request->jsonBody());
    }

    public function testEmptyBodyIsRejected(): void
    {
        $this->expectException(MalformedRequest::class);

        Request::create('POST', '/api/admin/login')->jsonBody();
    }

    public function testInvalidJsonIsRejected(): void
    {
        $this->expectException(MalformedRequest::class);

        Request::create('POST', '/api/admin/login', '{dit is geen json', self::JSON_HEADER)->jsonBody();
    }

    /** Een body die geen object is, zou verderop overal een typefout geven. */
    public function testAJsonValueThatIsNotAnObjectIsRejected(): void
    {
        $this->expectException(MalformedRequest::class);

        Request::create('POST', '/api/admin/login', '"gewoon tekst"', self::JSON_HEADER)->jsonBody();
    }

    /**
     * Zonder bovengrens kan iemand het geheugen laten vollopen met één
     * verzoek.
     */
    public function testATooLargeBodyIsRejected(): void
    {
        $enormous = '{"tekst":"' . str_repeat('a', 300000) . '"}';

        $this->expectException(MalformedRequest::class);

        Request::create('POST', '/api/admin/content/home', $enormous, self::JSON_HEADER)->jsonBody();
    }

    /** HTTP-headernamen zijn niet hoofdlettergevoelig. */
    public function testHeaderLookupIgnoresCase(): void
    {
        $request = Request::create('POST', '/api/admin/login', '', ['X-CSRF-Token' => 'abc123']);

        self::assertSame('abc123', $request->header('x-csrf-token'));
        self::assertSame('abc123', $request->header('X-Csrf-Token'));
        self::assertNull($request->header('X-Bestaat-Niet'));
    }

    public function testPathsAreNormalised(): void
    {
        self::assertSame('/api/contact', Request::create('POST', '/api/contact/')->path);
        self::assertSame('/', Request::create('GET', '/')->path);
        self::assertSame('POST', Request::create('post', '/x')->method);
    }
}
