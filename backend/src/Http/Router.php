<?php

declare(strict_types=1);

namespace App\Http;

use Closure;
use InvalidArgumentException;
use RuntimeException;

/**
 * Koppelt een methode plus pad aan een handler.
 *
 * Bewust klein gehouden: de API telt zes endpoints (CLAUDE.md §9), dus een
 * routeringsframework zou hier alleen gewicht toevoegen. Wat deze router
 * kent is precies wat dit project nodig heeft — vaste paden met hoogstens
 * een `{naam}`-placeholder erin.
 */
final class Router
{
    /**
     * Toegestane vorm van een patroon: segmenten met kleine letters, cijfers
     * en koppeltekens, of een placeholder. Bewust géén vrije regex: zo kan
     * een punt of een sterretje nooit per ongeluk als jokerteken werken.
     */
    private const VALID_PATTERN = '#^(?:/(?:[a-z0-9-]+|\{[a-z][a-z0-9_]*\}))+$#';

    private const PLACEHOLDER = '#\{([a-z][a-z0-9_]*)\}#';

    /** @var list<array{method: string, regex: string, handler: Closure}> */
    private array $routes = [];

    /**
     * @param Closure(Request, array<string, string>): JsonResponse $handler
     *        Krijgt het verzoek plus de placeholderwaarden uit het pad; bij
     *        /api/content/{page} dus ['page' => 'over-ons'].
     *
     *        Het verzoek gaat mee omdat een POST-handler de body, de headers
     *        en het IP-adres nodig heeft. Een handler die alleen de parameters
     *        gebruikt, laat het eerste argument ongebruikt.
     */
    public function add(string $method, string $pattern, Closure $handler): void
    {
        if (preg_match(self::VALID_PATTERN, $pattern) !== 1) {
            throw new InvalidArgumentException(
                sprintf('Ongeldig routepatroon: "%s"', $pattern),
            );
        }

        $this->routes[] = [
            'method' => strtoupper($method),
            'regex' => self::toRegex($pattern),
            'handler' => $handler,
        ];
    }

    public function dispatch(Request $request): JsonResponse
    {
        $pathExists = false;

        foreach ($this->routes as $route) {
            if (preg_match($route['regex'], $request->path, $matches) !== 1) {
                continue;
            }

            // Het pad bestaat; of de methode klopt is een aparte vraag.
            $pathExists = true;

            if ($route['method'] !== $request->method) {
                continue;
            }

            /** @var array<string, string> $parameters */
            $parameters = array_filter($matches, is_string(...), ARRAY_FILTER_USE_KEY);

            return ($route['handler'])($request, $parameters);
        }

        // 405 en 404 uit elkaar houden is niet alleen netjes (CLAUDE.md §9);
        // het vertelt de frontend of de URL fout is of de methode.
        return $pathExists
            ? JsonResponse::error(
                ErrorCode::MethodNotAllowed,
                'Deze methode is niet toegestaan op dit adres.',
                405,
            )
            : JsonResponse::error(
                ErrorCode::NotFound,
                'Dit adres bestaat niet.',
                404,
            );
    }

    private static function toRegex(string $pattern): string
    {
        $regex = preg_replace(self::PLACEHOLDER, '(?P<$1>[^/]+)', $pattern);

        if ($regex === null) {
            throw new RuntimeException(
                sprintf('Routepatroon kon niet omgezet worden: "%s"', $pattern),
            );
        }

        return '#^' . $regex . '$#';
    }
}
