<?php

declare(strict_types=1);

namespace App\Http;

use JsonException;

/**
 * Het binnenkomende verzoek, teruggebracht tot wat de applicatie nodig heeft.
 *
 * Bewust een eigen object in plaats van $_SERVER door de applicatie heen: de
 * rest van de code hoeft dan niet te weten dat superglobals bestaan, en het is
 * testbaar zonder webserver.
 */
final class Request
{
    /**
     * Bovengrens op de body. Een JSON-verzoek van deze applicatie is hooguit
     * een paar kilobyte; alles daarboven is een vergissing of een poging het
     * geheugen vol te laten lopen.
     */
    private const MAX_BODY_BYTES = 262144;

    private const JSON_MAX_DEPTH = 32;

    /**
     * @param array<string, string> $headers Namen in kleine letters, zodat
     *        opzoeken niet afhangt van hoe de client ze schreef.
     */
    private function __construct(
        public readonly string $method,
        public readonly string $path,
        private readonly string $rawBody,
        private readonly array $headers,
        private readonly string $clientIp,
    ) {
    }

    public static function fromGlobals(): self
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? null;
        $uri = $_SERVER['REQUEST_URI'] ?? null;
        $headers = self::headersFromServer();

        return new self(
            method: is_string($method) ? strtoupper($method) : 'GET',
            path: self::pathFromUri(is_string($uri) ? $uri : '/'),
            rawBody: self::readBody($headers['content-type'] ?? ''),
            headers: $headers,
            clientIp: self::clientIpFromServer(),
        );
    }

    /**
     * Voor tests en voor intern gebruik.
     *
     * @param array<string, string> $headers
     */
    public static function create(
        string $method,
        string $path,
        string $body = '',
        array $headers = [],
        string $clientIp = '127.0.0.1',
    ): self {
        $normalised = [];

        foreach ($headers as $name => $value) {
            $normalised[strtolower($name)] = $value;
        }

        return new self(
            method: strtoupper($method),
            path: self::normalisePath($path),
            rawBody: $body,
            headers: $normalised,
            clientIp: $clientIp,
        );
    }

    /** Namen zijn niet hoofdlettergevoelig; geef ze door zoals je wilt. */
    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    /**
     * Het IP-adres van de aanvrager, voor rate limiting.
     *
     * Bewust uitsluitend REMOTE_ADDR, en niet X-Forwarded-For. Die laatste
     * komt van de client en is dus vrij in te vullen — wie hem zou vertrouwen,
     * geeft een aanvaller een knop om zijn eigen inlogblokkade te omzeilen
     * door bij elke poging een ander adres op te geven.
     */
    public function clientIp(): string
    {
        return $this->clientIp;
    }

    /**
     * Het geüploade bestand uit een formulierveld.
     *
     * Geeft null als er niets is meegestuurd. Dat er iets ís, zegt nog niets
     * over of het deugt — dat beoordeelt UploadValidator.
     */
    public function file(string $field): ?UploadedFile
    {
        $entry = $_FILES[$field] ?? null;

        return is_array($entry) ? UploadedFile::fromFilesEntry($entry) : null;
    }

    /**
     * Of het verzoek groter was dan PHP nog accepteert.
     *
     * Bij een overschrijding van post_max_size gooit PHP de hele body weg:
     * $_FILES en $_POST zijn dan leeg, zonder foutmelding. Zonder deze
     * controle zou de bezoeker "kies een bestand" te zien krijgen terwijl hij
     * er net één koos — de meest verwarrende fout die er is.
     */
    public function exceededPostLimit(): bool
    {
        if ($this->method !== 'POST' || $_FILES !== [] || $_POST !== []) {
            return false;
        }

        $length = $this->header('content-length');

        return is_string($length) && (int) $length > 0;
    }

    /**
     * De body als JSON-object.
     *
     * @return array<array-key, mixed>
     *
     * @throws MalformedRequest bij een lege, te grote of ongeldige body
     */
    public function jsonBody(): array
    {
        if ($this->rawBody === '') {
            throw new MalformedRequest('Het verzoek bevat geen gegevens.');
        }

        if (strlen($this->rawBody) > self::MAX_BODY_BYTES) {
            throw new MalformedRequest('Het verzoek is te groot.');
        }

        try {
            $decoded = json_decode($this->rawBody, true, self::JSON_MAX_DEPTH, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new MalformedRequest('Het verzoek bevat geen geldige JSON.', 0, $exception);
        }

        if (!is_array($decoded)) {
            throw new MalformedRequest('Het verzoek bevat geen object.');
        }

        return $decoded;
    }

    /**
     * Leest de body alleen bij een JSON-verzoek.
     *
     * Bij een formulier-upload staat de inhoud in $_FILES en is php://input
     * leeg; hem dan toch uitlezen levert niets op en kost bij een groot
     * bestand onnodig geheugen.
     */
    private static function readBody(string $contentType): string
    {
        if (!str_contains(strtolower($contentType), 'application/json')) {
            return '';
        }

        // Eén byte meer dan de limiet, zodat jsonBody() "te groot" kan melden
        // in plaats van stilletjes af te kappen.
        $body = file_get_contents('php://input', false, null, 0, self::MAX_BODY_BYTES + 1);

        return $body === false ? '' : $body;
    }

    /**
     * Bouwt de headers uit $_SERVER op in plaats van uit getallheaders().
     * Die functie bestaat niet op elke SAPI; deze aanpak werkt overal.
     *
     * @return array<string, string>
     */
    private static function headersFromServer(): array
    {
        $headers = [];

        foreach ($_SERVER as $key => $value) {
            if (!is_string($key) || !is_string($value)) {
                continue;
            }

            if (str_starts_with($key, 'HTTP_')) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = $value;

                continue;
            }

            // Deze twee komen zonder HTTP_-voorvoegsel binnen.
            if ($key === 'CONTENT_TYPE' || $key === 'CONTENT_LENGTH') {
                $headers[strtolower(str_replace('_', '-', $key))] = $value;
            }
        }

        return $headers;
    }

    private static function clientIpFromServer(): string
    {
        $address = $_SERVER['REMOTE_ADDR'] ?? null;

        return is_string($address) && $address !== '' ? $address : 'onbekend';
    }

    private static function pathFromUri(string $uri): string
    {
        $path = parse_url($uri, PHP_URL_PATH);

        return is_string($path) ? self::normalisePath($path) : '/';
    }

    /**
     * Eén schrijfwijze per pad, zodat /contact en /contact/ dezelfde route
     * raken en niet als twee verschillende URL's in zoekresultaten belanden
     * (CLAUDE.md §12, dubbele content).
     */
    private static function normalisePath(string $path): string
    {
        $trimmed = trim($path, '/');

        return $trimmed === '' ? '/' : '/' . $trimmed;
    }
}
