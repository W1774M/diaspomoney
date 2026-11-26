/**
 * Tableau de bord super-admin : uniquement des chiffres mesurés. La carte « Coûts
 * d'exploitation » (10 % des revenus, inventée) n'existe plus.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Les graphiques (recharts) ne sont pas l'objet de ce test
vi.mock('@/components/dashboard/charts/RevenueChart', () => ({ default: () => null }));
vi.mock('@/components/dashboard/charts/UsersChart', () => ({ default: () => null }));
vi.mock('@/components/dashboard/charts/TransactionsChart', () => ({ default: () => null }));
vi.mock('@/components/dashboard/charts/UsersByRoleChart', () => ({ default: () => null }));
vi.mock('@/components/dashboard/charts/BookingsByStatusChart', () => ({ default: () => null }));
vi.mock('@/components/dashboard/charts/TopServicesChart', () => ({ default: () => null }));

import SuperAdminStats from '@/components/dashboard/stats/SuperAdminStats';

describe('SuperAdminStats', () => {
  it('affiche paiements et revenus, sans coûts d’exploitation inventés', () => {
    render(<SuperAdminStats stats={{ totalPayments: 9, totalRevenue: 282, loading: false }} loading={false} error={null} />);
    expect(screen.getByText('Paiements encaissés')).toBeInTheDocument();
    expect(screen.getByText('282.00 €')).toBeInTheDocument();
    expect(screen.queryByText(/Coûts d.exploitation/)).not.toBeInTheDocument();
    expect(screen.queryByText('28.20 €')).not.toBeInTheDocument();
  });
});
