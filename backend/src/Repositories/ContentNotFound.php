<?php

declare(strict_types=1);

namespace App\Repositories;

use RuntimeException;

/**
 * Het gevraagde contentbestand bestaat niet.
 *
 * Apart van ContentUnavailable omdat het een ander antwoord verdient: dit
 * wordt een 404, een onleesbaar bestand een 500.
 */
final class ContentNotFound extends RuntimeException
{
}
