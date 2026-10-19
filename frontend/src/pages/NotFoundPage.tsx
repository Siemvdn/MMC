import { ButtonLink } from '../components/ui/ButtonLink';
import { StatusMessage } from '../components/ui/StatusMessage';
import { usePageContent } from '../hooks/usePageContent';
import { pathForSlug } from '../constants/routes';
import { PageLayout } from '../layouts/PageLayout';

/**
 * De pagina bij een onbekend adres (CLAUDE.md §21).
 *
 * Header en footer blijven werken, ook als het laden van de bedrijfsgegevens
 * mislukt: een bezoeker die hier belandt moet altijd verder kunnen.
 */
export function NotFoundPage() {
  const { state } = usePageContent('home');

  return (
    <PageLayout site={state.status === 'success' ? state.data.site : undefined}>
      <StatusMessage
        heading="Deze pagina bestaat niet"
        text="Het adres klopt niet of de pagina is verplaatst. Via de homepage vindt u alles terug."
      />
      <ButtonLink href={pathForSlug('home')}>Naar de homepage</ButtonLink>
    </PageLayout>
  );
}
