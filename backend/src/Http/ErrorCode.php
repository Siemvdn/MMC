<?php

declare(strict_types=1);

namespace App\Http;

/**
 * De foutcodes die de API naar buiten geeft.
 *
 * Een enum in plaats van losse strings (CLAUDE.md §8): de frontend kan erop
 * vertrouwen dat de set eindig is, en een typefout in een code wordt hier
 * een fout bij het schrijven van de code in plaats van bij het uitvoeren.
 *
 * Deze codes zijn bedoeld voor de frontend, niet voor de bezoeker. De tekst
 * die een mens leest staat in het aparte `message`-veld.
 */
enum ErrorCode: string
{
    case ValidationError = 'VALIDATION_ERROR';
    case NotFound = 'NOT_FOUND';
    case MethodNotAllowed = 'METHOD_NOT_ALLOWED';
    case Unauthorized = 'UNAUTHORIZED';
    case Forbidden = 'FORBIDDEN';
    case RateLimited = 'RATE_LIMITED';
    case ServerError = 'SERVER_ERROR';
}
