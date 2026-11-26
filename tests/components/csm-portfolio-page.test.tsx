/**
 * Portefeuille CSM : un ADMIN / SUPERADMIN passe AuthorizedRoute (accès à
 * tout) mais n'a pas de portefeuille ; l'API exige le rôle CSM et répondait
 * 403. La page doit l'expliquer sans appeler l'API.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('@/hooks/auth/useAuth', () => ({ useAuth: () => mockUseAuth() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/components/ui/Notification', () => ({
  useNotificationManager: () => ({ addError: vi.fn(), addSuccess: vi.fn() }),
}));
vi.mock('@/components/dashboard/DashboardHeader', () => ({
  default: () => <div>En-tête portefeuille</div>,
}));

import CSMPorfolioPage from '@/app/dashboard/csm/portfolio/page';
import { hasExplicitRole } from '@/lib/auth/explicit-role';

const fetchMock = vi.fn();

function sessionWith(roles: string[]) {
  mockUseAuth.mockReturnValue({
    user: { id: 'u1', name: 'Test', roles, status: 'ACTIVE' },
    isAuthenticated: true,
    isLoading: false,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockImplementation(async (url: string) => ({
    ok: true,
    json: async () =>
      url.startsWith('/api/csm/portfolio/providers')
        ? { success: true, providerIds: [] }
        : { data: [] },
  }));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Page portefeuille CSM', () => {
  it.each([['ADMIN'], ['SUPERADMIN']])(
    'explique la page à un %s sans appeler l’API du portefeuille',
    async (role) => {
      sessionWith([role]);
      render(<CSMPorfolioPage />);

      expect(await screen.findByText('Portefeuille CSM')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Candidatures prestataires' })).toHaveAttribute(
        'href',
        '/dashboard/admin/candidatures',
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it('charge le portefeuille pour un CSM', async () => {
    sessionWith(['CSM']);
    render(<CSMPorfolioPage />);

    expect(await screen.findByText('Ajouter un prestataire')).toBeInTheDocument();
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/csm/portfolio/providers'),
    );
  });

  it('charge aussi le portefeuille pour un CSM qui est également admin', async () => {
    sessionWith(['ADMIN', 'CSM']);
    render(<CSMPorfolioPage />);

    expect(await screen.findByText('Ajouter un prestataire')).toBeInTheDocument();
  });
});

describe('hasExplicitRole', () => {
  it('exige le rôle porté par le compte (sans équivalence admin)', () => {
    expect(hasExplicitRole({ roles: ['CSM'] }, 'CSM')).toBe(true);
    expect(hasExplicitRole({ roles: ['csm'] }, 'CSM')).toBe(true);
    expect(hasExplicitRole({ roles: ['ADMIN'] }, 'CSM')).toBe(false);
    expect(hasExplicitRole({ roles: ['SUPERADMIN'] }, 'CSM')).toBe(false);
    expect(hasExplicitRole(null, 'CSM')).toBe(false);
    expect(hasExplicitRole({}, 'CSM')).toBe(false);
  });
});
