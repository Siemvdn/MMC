<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Http\CsrfToken;
use App\Http\ErrorCode;
use App\Http\JsonResponse;
use App\Http\Request;

/**
 * Controleert het CSRF-token op elk verzoek dat iets wijzigt (CLAUDE.md §11).
 *
 * Het token komt mee in de header `X-CSRF-Token`. Een andere site kan die
 * header niet zetten op een verzoek namens de bezoeker, en kan het token ook
 * niet uitlezen — dus komt zo'n verzoek hier niet langs.
 */
final class VerifyCsrfToken
{
    public const HEADER = 'X-CSRF-Token';

    /**
     * Methodes die niets wijzigen en dus geen token nodig hebben.
     *
     * §11 vraagt om een token op alles wat state wijzigt. Een GET doet dat
     * niet, en een aanvallende site kan het antwoord er toch niet van lezen —
     * dat verbiedt de browser via CORS. Een token eisen op een leesverzoek
     * levert dus geen bescherming op, maar wel een extra manier waarop het
     * beheerscherm kan stukgaan.
     */
    private const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

    public function __construct(private readonly CsrfToken $token)
    {
    }

    /** Geeft `null` als het verzoek door mag, anders het antwoord dat het tegenhoudt. */
    public function check(Request $request): ?JsonResponse
    {
        if (in_array($request->method, self::SAFE_METHODS, true)) {
            return null;
        }

        if ($this->token->matches($request->header(self::HEADER))) {
            return null;
        }

        // 403 en niet 401: er ís ingelogd, maar dit specifieke verzoek is niet
        // te vertrouwen. Opnieuw inloggen helpt niet; het token opnieuw ophalen
        // wel.
        return JsonResponse::error(
            ErrorCode::Forbidden,
            'Dit verzoek kon niet gecontroleerd worden. Ververs de pagina en probeer het opnieuw.',
            403,
        );
    }
}
