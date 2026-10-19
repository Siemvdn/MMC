import type {
  ContentSection,
  Member,
  MembersSection,
  Project,
  ProjectsSection,
} from '../types/content';

/**
 * De leden uit de eerste ledensectie van een pagina, of een lege lijst.
 *
 * De vooruitblik op de homepage gebruikt dit om de leden van de Over
 * ons-pagina te tonen zonder er een kopie van te bewaren.
 */
export function membersIn(sections: ContentSection[]): Member[] {
  const section = sections.find(
    (candidate): candidate is MembersSection => candidate.type === 'members',
  );

  return section?.members ?? [];
}

/** De projecten uit de eerste projectensectie van een pagina, of een lege lijst. */
export function projectsIn(sections: ContentSection[]): Project[] {
  const section = sections.find(
    (candidate): candidate is ProjectsSection => candidate.type === 'projects',
  );

  return section?.projects ?? [];
}
