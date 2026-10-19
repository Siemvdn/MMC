<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Http\JsonResponse;
use App\Http\Request;
use App\Http\Session;
use Closure;

/**
 * Zet de controles vóór een admin-endpoint in de juiste volgorde.
 *
 * Bestaat zodat die volgorde op één plek staat. Zou elk endpoint zijn eigen
 * controles aanroepen, dan is één vergeten regel genoeg om een endpoint
 * onbeschermd te laten — en dat zie je aan het gedrag niet.
 *
 * De sessie wordt hier gestart en nergens anders. Dat is met opzet: een sessie
 * starten zet een cookie, en dat hoort alleen te gebeuren bij wie het
 * admin-gedeelte gebruikt. Deed de front controller het voor elk verzoek, dan
 * kreeg iedere bezoeker van de publieke site een cookie die hij niet nodig
 * heeft (§15).
 */
final class AdminPipeline
{
    public function __construct(
        private readonly Session $session,
        private readonly RequireAdmin $requireAdmin,
        private readonly VerifyCsrfToken $verifyCsrfToken,
    ) {
    }

    /**
     * Alleen een sessie, geen controles.
     *
     * Voor het opvragen van de inlogstatus: het antwoord "je bent niet
     * ingelogd" is precies wat het inlogscherm nodig heeft, dus daar een login
     * voor eisen zou rondjes draaien.
     *
     * @param Closure(Request, array<string, string>): JsonResponse $handler
     */
    public function withSession(Closure $handler): Closure
    {
        return function (Request $request, array $parameters) use ($handler): JsonResponse {
            $this->session->start();

            return $handler($request, $parameters);
        };
    }

    /**
     * Wel een tokencontrole, geen login.
     *
     * Voor de inlogpoging zelf. §11 eist een CSRF-token op élk formulier dat
     * iets wijzigt, en inloggen wijzigt de sessie.
     *
     * @param Closure(Request, array<string, string>): JsonResponse $handler
     */
    public function withToken(Closure $handler): Closure
    {
        return $this->withSession(
            function (Request $request, array $parameters) use ($handler): JsonResponse {
                return $this->verifyCsrfToken->check($request) ?? $handler($request, $parameters);
            },
        );
    }

    /**
     * Ingelogd én een geldig token. De normale bescherming voor alles wat
     * content of bestanden wijzigt.
     *
     * De volgorde telt: eerst de login, dan pas het token. Een verlopen
     * sessie geeft zo een 401 (log opnieuw in) in plaats van een 403 over een
     * token dat samen met die sessie verdween.
     *
     * @param Closure(Request, array<string, string>): JsonResponse $handler
     */
    public function withLogin(Closure $handler): Closure
    {
        return $this->withSession(
            function (Request $request, array $parameters) use ($handler): JsonResponse {
                return $this->requireAdmin->check()
                    ?? $this->verifyCsrfToken->check($request)
                    ?? $handler($request, $parameters);
            },
        );
    }
}
