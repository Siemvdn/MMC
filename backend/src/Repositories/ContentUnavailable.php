<?php

declare(strict_types=1);

namespace App\Repositories;

use RuntimeException;

/**
 * Het bestand bestaat wel, maar kon niet gelezen of geschreven worden:
 * kapotte JSON, geen leesrechten, een mislukte schrijfactie.
 *
 * Dit is altijd een serverprobleem, nooit iets waar de bezoeker iets aan kan
 * doen — het wordt dus een 500, en de details gaan naar het log en niet naar
 * de browser (CLAUDE.md §8, §11).
 */
final class ContentUnavailable extends RuntimeException
{
}
