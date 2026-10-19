<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\ErrorCode;
use App\Http\JsonResponse;
use App\Http\MalformedRequest;
use App\Http\Request;
use App\Http\SignedCsrfToken;
use App\Services\ContactResult;
use App\Services\ContactService;
use App\Services\ContactStatus;

/**
 * Het publieke contactformulier: een token ophalen en een aanvraag versturen.
 *
 * Leest het verzoek, roept de service aan, zet de uitkomst om in een
 * antwoord — geen business-logica hier (CLAUDE.md §8).
 */
final class ContactController
{
    private const MALFORMED_MESSAGE = 'Het verzoek kwam niet goed aan. Probeer het opnieuw.';

    private const INVALID_TOKEN_MESSAGE = 'Dit formulier is verlopen. Ververs de pagina en probeer het opnieuw.';

    public function __construct(
        private readonly ContactService $service,
        private readonly SignedCsrfToken $csrfToken,
    ) {
    }

    /**
     * GET /api/contact/token
     *
     * Geen sessie, geen cookie — het token draagt zijn eigen bewijs (§11, §15).
     */
    public function token(): JsonResponse
    {
        return JsonResponse::success(['csrfToken' => $this->csrfToken->issue()]);
    }

    /** POST /api/contact */
    public function send(Request $request): JsonResponse
    {
        if (!$this->csrfToken->verify($request->header('X-CSRF-Token'))) {
            return JsonResponse::error(ErrorCode::Forbidden, self::INVALID_TOKEN_MESSAGE, 403);
        }

        try {
            $body = $request->jsonBody();
        } catch (MalformedRequest) {
            return JsonResponse::error(ErrorCode::ValidationError, self::MALFORMED_MESSAGE, 400);
        }

        return $this->respondTo($this->service->send($body, $request->clientIp()));
    }

    private function respondTo(ContactResult $result): JsonResponse
    {
        return match ($result->status) {
            ContactStatus::Success => JsonResponse::success(['sent' => true]),

            ContactStatus::ValidationError => JsonResponse::error(
                ErrorCode::ValidationError,
                'Vul het formulier volledig en juist in.',
                400,
            )->withDetails(['errors' => $result->errors]),

            ContactStatus::Blocked => JsonResponse::error(
                ErrorCode::RateLimited,
                'Te veel aanvragen. Probeer het over een kwartier opnieuw.',
                429,
            ),

            // De bezoeker krijgt een neutrale melding; de reden staat in het
            // logbestand (§8).
            ContactStatus::MailFailed => JsonResponse::error(
                ErrorCode::ServerError,
                'Het versturen is niet gelukt. Probeer het later opnieuw.',
                500,
            ),
        };
    }
}
