<?php

declare(strict_types=1);

namespace App\Services;

enum ContactStatus
{
    case Success;
    case ValidationError;
    case Blocked;

    /** MAIL_TO/MAIL_FROM ontbreken, of het versturen zelf mislukte. */
    case MailFailed;
}
