import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PageSections } from './PageSections';
import type {
  Member,
  MembersSection,
  PageContent,
  Project,
  ProjectsSection,
  TeaserSection,
} from '../../types/content';

function member(overrides: Partial<Member> = {}): Member {
  return {
    name: 'Een lid',
    specialty: 'Kasten op maat',
    website: '',
    image: null,
    imageAlt: '',
    ...overrides,
  };
}

function project(overrides: Partial<Project> = {}): Project {
  return {
    title: 'Een tafel',
    maker: 'Een lid',
    category: 'Tafel',
    description: '',
    image: null,
    imageAlt: '',
    ...overrides,
  };
}

function membersSection(members: Member[]): MembersSection {
  return { type: 'members', background: 'tinted', heading: 'Onze leden', intro: '', members };
}

function projectsSection(projects: Project[]): ProjectsSection {
  return { type: 'projects', background: 'light', heading: 'Projecten', intro: '', projects };
}

describe('de leden', () => {
  it('toont elk lid met zijn naam en specialisme', () => {
    render(<PageSections sections={[membersSection([member(), member({ name: 'Ander lid' })])]} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Ander lid')).not.toBeNull();
    expect(screen.getAllByText('Kasten op maat')).toHaveLength(2);
  });

  it('linkt naar de eigen site in een nieuw tabblad, met de naam erbij voor schermlezers', () => {
    render(
      <PageSections sections={[membersSection([member({ website: 'https://voorbeeld.nl' })])]} />,
    );

    const link = screen.getByRole('link', { name: /website van een lid/i });

    expect(link.getAttribute('href')).toBe('https://voorbeeld.nl/');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('maakt geen link zonder site, en ook niet van een onveilig adres', () => {
    render(
      <PageSections
        sections={[
          membersSection([member(), member({ name: 'Ander lid', website: 'javascript:alert(1)' })]),
        ]}
      />,
    );

    expect(screen.queryByRole('link')).toBeNull();
  });

  it('geeft de namen een kop onder de kop van de sectie', () => {
    const { container } = render(
      <PageSections sections={[membersSection([member()])]} firstHeadingLevel={2} />,
    );

    expect(container.querySelector('h2')?.textContent).toBe('Onze leden');
    expect(container.querySelector('h3')?.textContent).toBe('Een lid');
  });

  it('toont de omschrijving, en telefoon en e-mail als link met de naam erbij', () => {
    render(
      <PageSections
        sections={[
          membersSection([
            member({
              bio: 'Maakt kasten van massief eiken.',
              phone: '+31 (0)6 12 34 56 78',
              email: 'lid@voorbeeld.nl',
            }),
          ]),
        ]}
      />,
    );

    expect(screen.getByText('Maakt kasten van massief eiken.')).not.toBeNull();
    expect(screen.getByRole('link', { name: /bel een lid/i }).getAttribute('href')).toBe(
      'tel:+31612345678',
    );
    expect(screen.getByRole('link', { name: /mail een lid/i }).getAttribute('href')).toBe(
      'mailto:lid@voorbeeld.nl',
    );
  });

  it('laat lege of ontbrekende contactgegevens weg', () => {
    const { container } = render(
      <PageSections sections={[membersSection([member({ bio: '', phone: '' })])]} />,
    );

    expect(screen.queryByRole('link')).toBeNull();
    // Alleen het lid zelf: geen lege contactlijst eronder.
    expect(container.querySelectorAll('li')).toHaveLength(1);
  });
});

describe('de projecten', () => {
  it('toont het eerste project groot als uitgelicht, en de rest als kaarten', () => {
    const { container } = render(
      <PageSections
        sections={[
          projectsSection([
            project({ title: 'Eerste', description: 'Over het eerste project.' }),
            project({ title: 'Tweede' }),
            project({ title: 'Derde' }),
          ]),
        ]}
      />,
    );

    const featured = container.querySelector('article');

    expect(featured?.textContent).toContain('Uitgelicht');
    expect(featured?.textContent).toContain('Eerste');
    expect(featured?.textContent).toContain('Over het eerste project.');
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      expect.stringContaining('Tweede'),
      expect.stringContaining('Derde'),
    ]);
  });

  it('laat lege velden weg in plaats van een leeg label te tonen', () => {
    render(<PageSections sections={[projectsSection([project({ maker: '', category: '' })])]} />);

    expect(screen.queryByText(/^door/)).toBeNull();
    expect(screen.queryByText('Tafel')).toBeNull();
  });
});

describe('de vooruitblik', () => {
  function teaser(source: TeaserSection['source']): TeaserSection {
    return {
      type: 'teaser',
      background: 'light',
      heading: 'Maak kennis met de makers',
      source,
      linkLabel: 'Alle leden',
    };
  }

  function pageWith(sections: PageContent['sections']): Response {
    const content: PageContent = {
      meta: { title: '', description: '' },
      sections,
      site: { businessName: '', contact: { phone: '', email: '', area: '' }, sameAs: [] },
    };

    return new Response(JSON.stringify({ success: true, data: content }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('haalt de eerste vier leden op van de Over ons-pagina', async () => {
    const members = ['Een', 'Twee', 'Drie', 'Vier', 'Vijf'].map((name) => member({ name }));
    fetchMock.mockResolvedValue(pageWith([membersSection(members)]));

    render(<PageSections sections={[teaser('members')]} firstHeadingLevel={2} />);

    expect(await screen.findByText('Vier')).not.toBeNull();
    expect(screen.queryByText('Vijf')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/content/over-ons', expect.anything());
    expect(screen.getByRole('link', { name: /alle leden/i }).getAttribute('href')).toBe(
      '/over-ons',
    );
  });

  it('blijft compact: geen omschrijving of contactgegevens op de homepage', async () => {
    const withDetails = member({
      name: 'Een',
      bio: 'Een omschrijving.',
      phone: '0612345678',
      email: 'lid@voorbeeld.nl',
      website: 'https://voorbeeld.nl',
    });
    fetchMock.mockResolvedValue(pageWith([membersSection([withDetails])]));

    render(<PageSections sections={[teaser('members')]} firstHeadingLevel={2} />);

    expect(await screen.findByText('Een')).not.toBeNull();
    expect(screen.queryByText('Een omschrijving.')).toBeNull();
    // Alleen de link naar de hele pagina, geen bel-, mail- of websitelink.
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('toont de eerste drie projecten van de Projecten-pagina', async () => {
    const projects = ['Een', 'Twee', 'Drie', 'Vier'].map((title) => project({ title }));
    fetchMock.mockResolvedValue(pageWith([projectsSection(projects)]));

    render(<PageSections sections={[teaser('projects')]} firstHeadingLevel={2} />);

    expect(await screen.findByText('Drie')).not.toBeNull();
    expect(screen.queryByText('Vier')).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith('/api/content/projecten', expect.anything());
  });

  it('meldt dat hij laadt zolang de leden er nog niet zijn', () => {
    fetchMock.mockReturnValue(new Promise(() => undefined));

    render(<PageSections sections={[teaser('members')]} firstHeadingLevel={2} />);

    expect(screen.getByRole('status').textContent).toContain('De leden worden geladen');
  });

  it('verdwijnt als er nog geen leden zijn', async () => {
    fetchMock.mockResolvedValue(pageWith([]));

    const { container } = render(
      <PageSections sections={[teaser('members')]} firstHeadingLevel={2} />,
    );

    await vi.waitFor(() => {
      expect(container.querySelector('section')).toBeNull();
    });
  });
});
