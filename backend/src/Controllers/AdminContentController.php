<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\ErrorCode;
use App\Http\JsonResponse;
use App\Http\MalformedRequest;
use App\Http\Request;
use App\Repositories\ContentFile;
use App\Repositories\ContentNotFound;
use App\Repositories\ContentRepository;
use App\Repositories\ContentUnavailable;
use App\Repositories\InvalidContent;
use App\Validators\FieldValidator;
use App\Utils\Logger;

/**
 * Content lezen en opslaan vanuit het beheergedeelte.
 *
 * Het verschil met de publieke ContentController zit in wát er teruggaat: die
 * verwijdert de `_todo`-aantekeningen en laat lege secties weg, want dat is wat
 * een bezoeker moet zien. Hier gaat het bestand ongewijzigd mee, want de
 * beheerder bewerkt de bron.
 *
 * Anders dan publiek is `site` hier wél toegankelijk: daar staan de
 * bedrijfsgegevens die de klant moet kunnen invullen.
 */
final class AdminContentController
{
    private const NOT_FOUND_MESSAGE = 'Deze pagina bestaat niet.';

    public function __construct(
        private readonly ContentRepository $repository,
        private readonly Logger $logger,
    ) {
    }

    /** @param array<string, string> $parameters */
    public function show(array $parameters): JsonResponse
    {
        $file = $this->resolve($parameters);

        if ($file === null) {
            return JsonResponse::error(ErrorCode::NotFound, self::NOT_FOUND_MESSAGE, 404);
        }

        try {
            return JsonResponse::success($this->payloadFor($file));
        } catch (ContentNotFound $exception) {
            $this->logger->error(
                sprintf('Contentbestand ontbreekt voor %s', $file->value),
                $exception,
            );

            return JsonResponse::error(ErrorCode::NotFound, self::NOT_FOUND_MESSAGE, 404);
        } catch (ContentUnavailable $exception) {
            return $this->unavailable($file, $exception);
        }
    }

    /** @param array<string, string> $parameters */
    public function save(Request $request, array $parameters): JsonResponse
    {
        $file = $this->resolve($parameters);

        if ($file === null) {
            return JsonResponse::error(ErrorCode::NotFound, self::NOT_FOUND_MESSAGE, 404);
        }

        try {
            $body = $request->jsonBody();
        } catch (MalformedRequest) {
            return JsonResponse::error(
                ErrorCode::ValidationError,
                'De wijziging kwam niet goed aan. Probeer het opnieuw.',
                400,
            );
        }

        $content = $body['content'] ?? null;

        if (!is_array($content)) {
            return JsonResponse::error(
                ErrorCode::ValidationError,
                'De wijziging kwam niet goed aan. Probeer het opnieuw.',
                400,
            );
        }

        try {
            $this->repository->write($file, $content);
        } catch (InvalidContent $exception) {
            /*
             * Alle fouten in één keer, niet alleen de eerste. Wie een pagina
             * corrigeert wil weten wat er allemaal mis is, in plaats van vijf
             * keer opnieuw op te slaan om vijf fouten te vinden.
             */
            return JsonResponse::error(
                ErrorCode::ValidationError,
                'De wijziging is niet opgeslagen. Er klopt iets niet aan de inhoud.',
                400,
            )->withDetails(['errors' => $exception->errors()]);
        } catch (ContentUnavailable $exception) {
            return $this->unavailable($file, $exception);
        }

        return JsonResponse::success($this->payloadFor($file));
    }

    /**
     * Alles wat het beheerscherm van één document moet weten.
     *
     * De veldgrenzen gaan mee zodat het beheer precies dezelfde getallen toont
     * als hier afgedwongen worden, in plaats van een kopie die achterloopt.
     * Dat gebeurde namelijk: het beheer meldde nog 800 tekens toen de grens al
     * op 2000 stond.
     *
     * @return array<string, mixed>
     */
    private function payloadFor(ContentFile $file): array
    {
        return [
            'page' => $file->value,
            'content' => $this->repository->read($file),
            'hasPreviousVersion' => $this->repository->hasPreviousVersion($file),
            'limits' => FieldValidator::maxLengths(),
            'choices' => FieldValidator::choices(),
        ];
    }

    /** @param array<string, string> $parameters */
    public function restore(array $parameters): JsonResponse
    {
        $file = $this->resolve($parameters);

        if ($file === null) {
            return JsonResponse::error(ErrorCode::NotFound, self::NOT_FOUND_MESSAGE, 404);
        }

        try {
            $this->repository->restorePrevious($file);
        } catch (ContentNotFound) {
            return JsonResponse::error(
                ErrorCode::NotFound,
                'Er is geen vorige versie om terug te zetten.',
                404,
            );
        } catch (InvalidContent $exception) {
            // Kan gebeuren als de structuur is aangescherpt sinds die backup
            // geschreven werd. Terugzetten zou dan corrupte content opleveren.
            return JsonResponse::error(
                ErrorCode::ValidationError,
                'De vorige versie past niet meer bij de huidige opbouw.',
                400,
            )->withDetails(['errors' => $exception->errors()]);
        } catch (ContentUnavailable $exception) {
            return $this->unavailable($file, $exception);
        }

        return $this->show($parameters);
    }

    /**
     * Zet de slug om in een bestand. Elke onbekende waarde valt af; de
     * repository stelt nooit zelf een bestandsnaam samen uit binnengekomen
     * tekst (§11).
     *
     * @param array<string, string> $parameters
     */
    private function resolve(array $parameters): ?ContentFile
    {
        return ContentFile::tryFrom($parameters['page'] ?? '');
    }

    private function unavailable(ContentFile $file, ContentUnavailable $exception): JsonResponse
    {
        $this->logger->error(
            sprintf('Content kon niet gelezen of geschreven worden voor %s', $file->value),
            $exception,
        );

        return JsonResponse::error(
            ErrorCode::ServerError,
            'De inhoud kon niet geladen of opgeslagen worden.',
            500,
        );
    }
}
