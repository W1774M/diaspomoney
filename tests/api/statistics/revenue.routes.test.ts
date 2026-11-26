/**
 * /api/statistics/platform et /api/statistics/admin : les revenus reposent sur les
 * paiements réels. En prod, tous les paiements passent par le chemin canonique
 * (réservation confirmée, aucune transaction) : les revenus affichaient 0,00 €.
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockAuth, repos } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  repos: {
    users: { findAll: vi.fn() },
    bookings: { findBookingsWithFilters: vi.fn() },
    transactions: { findTransactionsWithFilters: vi.fn() },
    invoices: { findInvoicesWithFilters: vi.fn() },
    complaints: { findComplaintsWithFilters: vi.fn() },
  },
}));

vi.mock('@/auth', () => ({ auth: mockAuth }));
vi.mock('@/lib/logger', () => ({
  childLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));
vi.mock('@/repositories', () => ({
  getUserRepository: () => repos.users,
  getBookingRepository: () => repos.bookings,
  getTransactionRepository: () => repos.transactions,
  getInvoiceRepository: () => repos.invoices,
  getComplaintRepository: () => repos.complaints,
}));

import { GET as getPlatform } from '@/app/api/statistics/platform/route';
import { GET as getAdmin } from '@/app/api/statistics/admin/route';

const now = new Date();
const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1, 12).toISOString();
const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15, 12).toISOString();

function prodShapedBookings() {
  const amounts = ['2', '2', '2', '2', '2', '2', '40', '170', '60'];
  return amounts.map((totalAmount, i) => ({
    status: 'CONFIRMED',
    createdAt: i < 6 ? lastMonth : thisMonth,
    metadata: {
      paymentStatus: 'confirmed',
      totalAmount,
      paymentIntentId: `pi_${i}`,
      paymentConfirmedAt: i < 6 ? lastMonth : thisMonth,
    },
  }));
}

describe('statistiques : revenus sur les paiements réels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repos.users.findAll.mockResolvedValue([]);
    repos.bookings.findBookingsWithFilters.mockResolvedValue({
      data: [...prodShapedBookings(), { status: 'PENDING', createdAt: thisMonth, metadata: {} }],
    });
    repos.transactions.findTransactionsWithFilters.mockResolvedValue({ data: [] });
    repos.invoices.findInvoicesWithFilters.mockResolvedValue({ data: [] });
    repos.complaints.findComplaintsWithFilters.mockResolvedValue({ data: [] });
  });

  it('superadmin : revenus totaux, du mois et nombre de paiements', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'sa', roles: ['SUPERADMIN'] } });

    const res = await getPlatform(new NextRequest('http://localhost/api/statistics/platform'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.statistics.overview.totalRevenue).toBe(282);
    expect(body.statistics.overview.revenueThisMonth).toBe(270);
    expect(body.statistics.overview.totalPayments).toBe(9);
    const months = body.statistics.charts.monthlyData;
    expect(months[months.length - 1]).toMatchObject({ revenue: 270, transactions: 3 });
    expect(months[months.length - 2]).toMatchObject({ revenue: 12, transactions: 6 });
  });

  it.each([
    ['un admin seul', ['ADMIN']],
    ['un admin avec d’autres rôles (ancienne règle)', ['ADMIN', 'CUSTOMER', 'PROVIDER']],
  ])('statistiques plateforme refusées à %s : rôle SUPERADMIN explicite requis', async (_label, roles) => {
    mockAuth.mockResolvedValue({ user: { id: 'a', roles } });
    const res = await getPlatform(new NextRequest('http://localhost/api/statistics/platform'));
    expect(res.status).toBe(403);
  });

  it('admin : revenus plateforme et paiements du mois', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'a', roles: ['ADMIN'] } });

    const res = await getAdmin(new NextRequest('http://localhost/api/statistics/admin'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.statistics.platformRevenue).toBe(282);
    expect(body.statistics.monthlyTransactions).toBe(3);
  });
});
