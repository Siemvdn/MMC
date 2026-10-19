<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\CsrfToken;
use App\Http\ErrorCode;
use App\Http\JsonResponse;
use App\Http\MalformedRequest;
use App\Http\Request;
use App\Services\AuthService;
use App\Services\LoginResult;
use App\Services\LoginStatus;

/**
 * Inloggen, uitloggen en opvragen wie er ingelogd is.
 *
 * Leest het verzoek, roept de service aan, zet de uitkomst om in een antwoord.
 * Geen business-logica hier (CLAUDE.md §8).
 */
final class AuthController
{
    /**
     * Eén tekst voor elke mislukte poging, ongeacht of de gebruikersnaam of
     * het wachtwoord fout was (§11).
     */
    private const FAILED_MESSAGE = 'Gebruikersnaam of wachtwoord onjuist.';

    public function __construct(
        private readonly AuthService $auth,
        private readonly CsrfToken $csrfToken,
    ) {
    }

    /**
     * Vertelt de frontend of er ingelogd is, en geeft het CSRF-token mee.
     *
     * Vereist geen login: het antwoord "je bent niet ingelogd" is precies wat
     * het inlogscherm nodig heeft. Het token wordt hier uitgegeven zodat de
     * inlogpoging zelf ook beschermd is.
     */
    public function show(): JsonResponse
    {
        return JsonResponse::success([
            'loggedIn' => $this->auth->isLoggedIn(),
            'username' => $this->auth->username(),
            'csrfToken' => $this->csrfToken->issue(),
        ]);
    }

    public function login(Request $request): JsonResponse
    {
        try {
            $body = $request->jsonBody();
        } catch (MalformedRequest) {
            return JsonResponse::error(
                ErrorCode::ValidationError,
                'Vul een gebruikersnaam en wachtwoord in.',
                400,
            );
        }

        $username = $body['username'] ?? null;
        $password = $body['password'] ?? null;

        if (!is_string($username) || !is_string($password)) {
            return JsonResponse::error(
                ErrorCode::ValidationError,
                'Vul een gebruikersnaam en wachtwoord in.',
                400,
            );
        }

        return $this->respondTo(
            $this->auth->attempt($username, $password, $request->clientIp()),
        );
    }

    public function logout(): JsonResponse
    {
        $this->auth->logout();

        return JsonResponse::success(['loggedIn' => false]);
    }

    private function respondTo(LoginResult $result): JsonResponse
    {
        return match ($result->status) {
            LoginStatus::Success => JsonResponse::success([
                'loggedIn' => true,
                'username' => $this->auth->username(),
                // Na het vernieuwen van het sessie-ID hoort de frontend het
                // token opnieuw te krijgen.
                'csrfToken' => $this->csrfToken->issue(),
            ]),

            // Was dit de laatste poging, dan is de blokkade nú ingegaan. Dan
            // "nog 0 pogingen" melden zou de beheerder laten denken dat hij
            // het nog eens mag proberen.
            LoginStatus::Failed => $result->remainingAttempts === 0
                ? self::blockedResponse()
                : JsonResponse::error(
                    ErrorCode::Unauthorized,
                    sprintf(
                        '%s Nog %d %s.',
                        self::FAILED_MESSAGE,
                        $result->remainingAttempts,
                        $result->remainingAttempts === 1 ? 'poging' : 'pogingen',
                    ),
                    401,
                ),

            LoginStatus::Blocked => self::blockedResponse(),

            // De beheerder krijgt dezelfde neutrale tekst; dat het aan de
            // installatie ligt staat in het logbestand.
            LoginStatus::NotConfigured => JsonResponse::error(
                ErrorCode::ServerError,
                'Inloggen is op dit moment niet mogelijk.',
                500,
            ),
        };
    }

    private static function blockedResponse(): JsonResponse
    {
        return JsonResponse::error(
            ErrorCode::RateLimited,
            'Te veel mislukte pogingen. Probeer het over een kwartier opnieuw.',
            429,
        );
    }
}
