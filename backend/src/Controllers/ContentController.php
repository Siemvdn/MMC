<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\ErrorCode;
use App\Http\JsonResponse;
use App\Repositories\ContentFile;
use App\Repositories\ContentNotFound;
use App\Repositories\ContentUnavailable;
use App\Services\ContentService;
use App\Utils\Logger;

/**
 * GET /api/content/{page}
 *
 * Leest de parameter uit het pad, laat de service het werk doen, en zet de
 * uitkomst om in een antwoord. Geen business-logica hier (CLAUDE.md §8).
 */
final class ContentController
{
    /**
     * Eén tekst voor "bestaat niet", ongeacht de reden. Of een slug onbekend
     * is of het bestand ontbreekt, gaat de bezoeker niet aan — en het verschil
     * prijsgeven vertelt een buitenstaander welke bestanden er wél zijn.
     */
    private const NOT_FOUND_MESSAGE = 'Deze pagina bestaat niet.';

    public function __construct(
        private readonly ContentService $service,
        private readonly Logger $logger,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function show(array $parameters): JsonResponse
    {
        $slug = $parameters['page'] ?? '';
        $page = ContentFile::tryFrom($slug);

        // site.json is geen pagina: het wordt meegestuurd als onderdeel van
        // elke pagina, maar is niet los op te vragen (§9).
        if ($page === null || !$page->isPage()) {
            return JsonResponse::error(ErrorCode::NotFound, self::NOT_FOUND_MESSAGE, 404);
        }

        try {
            return JsonResponse::success($this->service->pageContent($page));
        } catch (ContentNotFound $exception) {
            // Wel loggen: een ontbrekend contentbestand is een fout in de
            // installatie, ook al krijgt de bezoeker gewoon een 404.
            $this->logger->error(
                sprintf('Contentbestand ontbreekt voor pagina %s', $slug),
                $exception,
            );

            return JsonResponse::error(ErrorCode::NotFound, self::NOT_FOUND_MESSAGE, 404);
        } catch (ContentUnavailable $exception) {
            $this->logger->error(
                sprintf('Content kon niet gelezen worden voor pagina %s', $slug),
                $exception,
            );

            return JsonResponse::error(
                ErrorCode::ServerError,
                'De inhoud van deze pagina kon niet geladen worden.',
                500,
            );
        }
    }
}
