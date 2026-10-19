<?php

declare(strict_types=1);

namespace App\Http;

use JsonException;

/**
 * Het antwoord van de API, in het vaste formaat uit CLAUDE.md §9.
 *
 * Succes:  { "success": true,  "data": ... }
 * Fout:    { "success": false, "error": { "code": "...", "message": "..." } }
 *
 * Een foutantwoord mag daarnaast een "details"-object dragen. Dat is een
 * uitbreiding op §9, bewust en beperkt: bij een validatiefout wil de beheerder
 * álle fouten in één keer zien, niet alleen de eerste. De "message" blijft de
 * tekst voor de gebruiker; "details" is er voor wie hem kan verwerken.
 *
 * Alle endpoints geven dit object terug, zodat de frontend nooit hoeft te
 * raden hoe een antwoord eruitziet.
 */
final class JsonResponse
{
    /** @param array<string, mixed> $body */
    private function __construct(
        public readonly int $status,
        public readonly array $body,
    ) {
    }

    public static function success(mixed $data, int $status = 200): self
    {
        return new self($status, ['success' => true, 'data' => $data]);
    }

    public static function error(ErrorCode $code, string $message, int $status): self
    {
        return new self($status, [
            'success' => false,
            'error' => ['code' => $code->value, 'message' => $message],
        ]);
    }

    /**
     * Vult een foutantwoord aan met machineleesbare details.
     *
     * Geeft een nieuw antwoord terug in plaats van dit te wijzigen: de body is
     * readonly, en een antwoord dat onderweg nog verandert is lastiger te
     * volgen dan een antwoord dat af is zodra het gemaakt is.
     *
     * @param array<string, mixed> $details
     */
    public function withDetails(array $details): self
    {
        $body = $this->body;
        $error = $body['error'] ?? null;

        if (!is_array($error)) {
            return $this;
        }

        $error['details'] = $details;
        $body['error'] = $error;

        return new self($this->status, $body);
    }

    /**
     * @throws JsonException als de body niet naar JSON om te zetten is. Dat
     *         gebeurt vóórdat er headers verstuurd zijn, zodat de
     *         foutafhandeling in de front controller er nog een nette 500
     *         van kan maken in plaats van een half antwoord.
     */
    public function send(): void
    {
        $payload = json_encode(
            $this->body,
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
        );

        if (!headers_sent()) {
            http_response_code($this->status);
            header('Content-Type: application/json; charset=utf-8');
        }

        echo $payload;
    }
}
