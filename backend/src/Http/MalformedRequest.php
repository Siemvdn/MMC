<?php

declare(strict_types=1);

namespace App\Http;

use RuntimeException;

/**
 * Het verzoek zelf klopt niet: geen geldige JSON, of een body die de limiet
 * overschrijdt.
 *
 * Dit is iets anders dan een validatiefout. Bij een validatiefout begrijpen we
 * wat er binnenkwam en deugt de inhoud niet; hier komen we niet eens zo ver.
 * Het wordt een 400, met een neutrale tekst.
 */
final class MalformedRequest extends RuntimeException
{
}
