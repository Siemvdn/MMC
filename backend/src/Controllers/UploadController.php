<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\ErrorCode;
use App\Http\JsonResponse;
use App\Http\Request;
use App\Services\UploadService;
use App\Utils\Logger;
use Throwable;

/**
 * POST /api/admin/upload
 *
 * Neemt één afbeelding aan en geeft het pad terug waaronder hij bereikbaar is.
 * Dat pad kan daarna in een sectie gezet worden; de content-validator
 * accepteert precies deze vorm.
 */
final class UploadController
{
    /** De naam van het formulierveld waarin het bestand zit. */
    public const FIELD = 'afbeelding';

    public function __construct(
        private readonly UploadService $uploads,
        private readonly Logger $logger,
    ) {
    }

    public function store(Request $request): JsonResponse
    {
        /*
         * Bij een overschrijding van post_max_size gooit PHP de hele body weg
         * zonder foutmelding. Zonder deze controle zou de beheerder te horen
         * krijgen dat hij geen bestand koos, terwijl hij er net één koos — en
         * dan is het alleen te groot.
         */
        if ($request->exceededPostLimit()) {
            return JsonResponse::error(
                ErrorCode::ValidationError,
                'Het bestand is te groot om te versturen.',
                400,
            );
        }

        $file = $request->file(self::FIELD);
        $validation = $this->uploads->validate($file);

        if (!$validation->isValid() || $file === null) {
            return JsonResponse::error(
                ErrorCode::ValidationError,
                $validation->errors()[0] ?? 'Het bestand kon niet gebruikt worden.',
                400,
            )->withDetails(['errors' => $validation->errors()]);
        }

        try {
            $path = $this->uploads->store($file);
        } catch (Throwable $exception) {
            $this->logger->error('Een afbeelding kon niet opgeslagen worden.', $exception);

            return JsonResponse::error(
                ErrorCode::ServerError,
                'De afbeelding kon niet opgeslagen worden.',
                500,
            );
        }

        return JsonResponse::success(['path' => $path], 201);
    }
}
