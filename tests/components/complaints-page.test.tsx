/**
 * ComplaintsPage : contrôle de rôle réel (useAuthorization non mocké).
 * Seul useAuth est simulé pour fixer les rôles de la session.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseAuth, mockFetchComplaints } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockFetchComplaints: vi.fn(),
}));

vi.mock('@/hooks/auth/useAuth', () => ({ useAuth: () => mockUseAuth() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/hooks/complaints', () => ({
  useComplaints: () => ({
    complaints: [],
    loading: false,
    error: null,
    fetchComplaints: mockFetchComplaints,
  }),
  useComplaintFilters: () => ({
    filters: { searchTerm: '' },
    filteredComplaints: [],
    availableStatuses: [],
    availableTypes: [],
    availablePriorities: [],
    updateFilter: vi.fn(),
    hasActiveFilters: false,
  }),
  useComplaintStats: () => ({}),
}));
vi.mock('@/components/complaints/ComplaintsHeader', () => ({
  default: () => <div>En-tête réclamations</div>,
}));
vi.mock('@/components/complaints/ComplaintsSearch', () => ({ default: () => null }));
vi.mock('@/components/complaints/ComplaintsFilters', () => ({ default: () => null }));
vi.mock('@/components/complaints/ComplaintsTable', () => ({ default: () => null }));
vi.mock('@/components/complaints/ComplaintsStats', () => ({ default: () => null }));

import ComplaintsPage from '@/components/complaints/ComplaintsPage';

function sessionWith(roles: string[], isLoading = false) {
  mockUseAuth.mockReturnValue({
    user: { id: 'u1', roles, status: 'ACTIVE' },
    isAuthenticated: true,
    isLoading,
  });
}

describe('ComplaintsPage — contrôle de rôle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([[['ADMIN']], [['SUPERADMIN']], [['CSM']], [['CUSTOMER']]])(
    'autorise %j',
    (roles) => {
      sessionWith(roles);
      render(<ComplaintsPage />);
      expect(screen.getByText('En-tête réclamations')).toBeInTheDocument();
      expect(screen.queryByText('Accès non autorisé')).not.toBeInTheDocument();
    },
  );

  it('n’affiche pas « Accès non autorisé » pendant le chargement de la session', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false, isLoading: true });
    render(<ComplaintsPage />);
    expect(screen.queryByText('Accès non autorisé')).not.toBeInTheDocument();
    expect(screen.getByText(/Vérification des autorisations/)).toBeInTheDocument();
  });

  it('refuse un rôle sans accès', () => {
    sessionWith(['BENEFICIARY']);
    render(<ComplaintsPage />);
    expect(screen.getByText('Accès non autorisé')).toBeInTheDocument();
  });

  it('un admin charge toutes les réclamations, un client seulement les siennes', async () => {
    sessionWith(['ADMIN']);
    const { unmount } = render(<ComplaintsPage />);
    await waitFor(() => expect(mockFetchComplaints).toHaveBeenCalled());
    expect(mockFetchComplaints).toHaveBeenLastCalledWith({ limit: 1000 });
    unmount();

    mockFetchComplaints.mockClear();
    sessionWith(['CUSTOMER']);
    render(<ComplaintsPage />);
    await waitFor(() => expect(mockFetchComplaints).toHaveBeenCalled());
    expect(mockFetchComplaints).toHaveBeenLastCalledWith({ userId: 'u1', limit: 1000 });
  });
});
