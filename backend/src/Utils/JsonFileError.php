<?php

declare(strict_types=1);

namespace App\Utils;

use RuntimeException;

/**
 * Er ging iets mis bij het lezen of schrijven van een JSON-bestand.
 *
 * Bewust een eigen fout van deze laag, en niet een van de fouten uit
 * Repositories: AtomicJsonFile weet niets van content of van rate limiting en
 * hoort dus ook hun woordenschat niet te gebruiken. Elke aanroeper vertaalt
 * dit naar een fout die past bij wat híj aan het doen was.
 */
final class JsonFileError extends RuntimeException
{
}
