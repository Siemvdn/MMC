<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Http\ErrorCode;
use App\Http\JsonResponse;
use App\Services\AuthService;

/**
 * Laat alleen een ingelogde beheerder door (CLAUDE.md §9, §11).
 *
 * Elk admin-endpoint gaat hier langs. Nooit vertrouwen op het feit dat de
 * frontend een knop niet toont of dat een adres niet in het menu staat: wie
 * het adres kent, komt er anders gewoon bij.
 */
final class RequireAdmin
{
    public function __construct(private readonly AuthService $auth)
    {
    }

    /** Geeft `null` als het verzoek door mag, anders het antwoord dat het tegenhoudt. */
    public function check(): ?JsonResponse
    {
        if ($this->auth->isLoggedIn()) {
            return null;
        }

        // 401 en niet 403: de sessie is verlopen of er is niet ingelogd, en
        // opnieuw inloggen lost het op. De frontend gebruikt dit verschil om
        // het inlogscherm te tonen in plaats van een foutmelding.
        return JsonResponse::error(
            ErrorCode::Unauthorized,
            'Log opnieuw in om verder te gaan.',
            401,
        );
    }
}
