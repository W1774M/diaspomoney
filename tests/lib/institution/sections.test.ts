import { describe, expect, it } from 'vitest';

import { generateMetadata } from '@/app/dashboard/institution/[section]/layout';
import { getInstitutionSection, INSTITUTION_SECTIONS } from '@/lib/institution/sections';

/** Liens du menu Institution dans components/layout/Sidebar.tsx. */
const MENU_HREFS = [
  '/dashboard/institution/doctors',
  '/dashboard/institution/nurses',
  '/dashboard/institution/patients',
  '/dashboard/institution/appointments',
  '/dashboard/institution/freelancers',
  '/dashboard/institution/clients',
  '/dashboard/institution/missions',
  '/dashboard/institution/teachers',
  '/dashboard/institution/students',
  '/dashboard/institution/classes',
  '/dashboard/institution/teams',
];

describe('écrans institution', () => {
  it('chaque lien du menu correspond à un écran', () => {
    for (const href of MENU_HREFS) {
      const slug = href.split('/').pop() ?? '';
      expect(getInstitutionSection(slug)?.title).toBeTruthy();
    }
  });

  it('un segment inconnu n’a pas d’écran', () => {
    expect(getInstitutionSection('inconnu')).toBeUndefined();
  });

  it('donne un titre d’onglet pour un écran connu et un repli sinon', async () => {
    const known = await generateMetadata({ params: Promise.resolve({ section: 'classes' }) });
    expect(known.title).toBe(INSTITUTION_SECTIONS['classes']?.title);
    expect(known.robots).toEqual({ index: false, follow: false });

    const unknown = await generateMetadata({ params: Promise.resolve({ section: 'inconnu' }) });
    expect(unknown.title).toBe('Institution');
  });
});
