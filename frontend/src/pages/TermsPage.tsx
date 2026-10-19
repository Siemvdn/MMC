import { PublicPageBody } from '../components/features/PublicPageBody';
import { PageStatus } from '../components/features/PageStatus';
import { usePageContent } from '../hooks/usePageContent';
import { PageLayout } from '../layouts/PageLayout';

const SLUG = 'terms';

export function TermsPage() {
  const { state, retry } = usePageContent(SLUG);

  if (state.status !== 'success') {
    return (
      <PageLayout currentSlug={SLUG}>
        <PageStatus state={state} onRetry={retry} />
      </PageLayout>
    );
  }

  return (
    <PageLayout currentSlug={SLUG} site={state.data.site}>
      <PublicPageBody slug={SLUG} sections={state.data.sections} />
    </PageLayout>
  );
}
