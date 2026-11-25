import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ROLES } from '@/lib/constants';
import { INSTITUTION_SECTIONS } from '@/lib/institution/sections';

const nav = vi.hoisted(() => ({
  notFound: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => '/dashboard/institution/doctors',
  useSearchParams: () => new URLSearchParams(),
  notFound: () => {
    nav.notFound();
    throw new Error('notFound');
  },
}));

vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', roles: [ROLES.PROVIDER], name: 'Clinique' },
    isAuthenticated: true,
    isLoading: false,
    signOut: vi.fn(),
    isSigningOut: false,
  }),
}));

import InstitutionSectionPage from '@/app/dashboard/institution/[section]/page';
import { InstitutionDirectory } from '@/components/institution/InstitutionDirectory';
import { InstitutionSectionScreen } from '@/components/institution/InstitutionSectionScreen';

describe('InstitutionDirectory', () => {
  it('affiche le titre et l’état vide', () => {
    const section = INSTITUTION_SECTIONS['teachers'];
    expect(section).toBeDefined();
    render(<InstitutionDirectory section={section!} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Mes professeurs' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Aucun professeur enregistré.');
  });
});

describe('InstitutionSectionScreen', () => {
  it('affiche l’écran pour un prestataire', () => {
    const section = INSTITUTION_SECTIONS['doctors'];
    expect(section).toBeDefined();
    render(<InstitutionSectionScreen section={section!} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Mes médecins' })).toBeInTheDocument();
  });
});

describe('InstitutionSectionPage', () => {
  it('rend l’écran du segment', async () => {
    const ui = await InstitutionSectionPage({ params: Promise.resolve({ section: 'classes' }) });
    render(ui);
    expect(screen.getByRole('heading', { level: 1, name: 'Mes classes' })).toBeInTheDocument();
    expect(nav.notFound).not.toHaveBeenCalled();
  });

  it('répond introuvable pour un segment hors menu', async () => {
    await expect(
      InstitutionSectionPage({ params: Promise.resolve({ section: 'inconnu' }) }),
    ).rejects.toThrow('notFound');
    expect(nav.notFound).toHaveBeenCalled();
  });
});
