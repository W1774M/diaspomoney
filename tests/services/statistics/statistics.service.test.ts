// @vitest-environment node
/**
 * Statistiques personnelles : budgets, dépenses du mois et de l'année, tendances sur 12 mois,
 * services et prestataires les plus utilisés, compteurs de réservations, panier moyen.
 * Repositories injectés (constructeur) ; journal, mesure et cache neutres.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ passThrough: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d }));
vi.mock('@/lib/decorators', () => ({ Cacheable: h.passThrough, Log: h.passThrough, Performance: h.passThrough }));
vi.mock('@/repositories', () => ({ getBookingRepository: () => ({}), getTransactionRepository: () => ({}), getUserRepository: () => ({}) }));

import { StatisticsService } from '@/services/statistics/statistics.service';

const NOW = new Date('2026-11-22T12:00:00Z');
const PROVIDER_A = '6b0300000000000000000001';
const PROVIDER_B = '6b0300000000000000000002';
const at = (iso: string) => new Date(iso);

const bookings = vi.fn();
const transactions = vi.fn();
const findById = vi.fn();
const findAll = vi.fn();
const svc = () =>
  new StatisticsService(
    { findBookingsWithFilters: bookings } as never,
    { findTransactionsWithFilters: transactions } as never,
    { findById, findAll } as never,
  );

const tx = (amount: number, iso: string) => ({ amount, status: 'COMPLETED', createdAt: iso });
const page = <T>(data: T[]) => ({ data, total: data.length });

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.clearAllMocks();
  findById.mockResolvedValue({ id: 'u1', monthlyBudget: 500 });
  findAll.mockResolvedValue([
    { _id: PROVIDER_A, name: 'Dr Bah', roles: ['PROVIDER'], providerInfo: { rating: 4.5 }, avatar: 'a.png' },
    { id: PROVIDER_B, firstName: 'Awa', lastName: 'Sow', roles: 'PROVIDER' },
  ]);
  bookings.mockResolvedValue(page([
    { status: 'FINISHED', providerId: PROVIDER_A, selectedService: { name: 'Consultation', price: 40 }, createdAt: '2026-10-01T10:00:00Z' },
    { status: 'CONFIRMED', providerId: PROVIDER_A, selectedService: { name: 'Consultation', price: 40 }, createdAt: '2026-11-10T10:00:00Z' },
    { status: 'CANCELLED', providerId: PROVIDER_B, selectedService: { name: 'Analyse' }, amount: 25, createdAt: '2026-09-01T10:00:00Z' },
    { status: 'PENDING', selectedService: undefined, metadata: { basePrice: 30, additionalOptions: JSON.stringify([{ price: '5' }, { price: 5 }]), discountAmount: 10 }, createdAt: '2026-11-20T10:00:00Z' },
  ]));
  // Mois en cours, année en cours, puis 12 derniers mois (même jeu ; filtré par date côté service)
  transactions.mockImplementation(async (filters: { dateFrom: Date }) =>
    page([tx(100, '2026-11-05T10:00:00Z'), tx(50, '2026-03-01T10:00:00Z'), tx(30, '2025-12-15T10:00:00Z')].filter((t) => at(t.createdAt) >= filters.dateFrom)),
  );
});

afterEach(() => {
  vi.useRealTimers();
});

describe('StatisticsService.getPersonalStatistics', () => {
  it('calcule budgets et dépenses du mois et de l’année', async () => {
    const s = await svc().getPersonalStatistics('u1');
    expect(s.budget.monthly).toMatchObject({ budget: 500, spent: 100, remaining: 400, percentage: 20 });
    expect(s.budget.annual).toMatchObject({ budget: 6000, spent: 150, remaining: 5850, percentage: 3 });
    expect(transactions).toHaveBeenCalledWith(expect.objectContaining({ payerId: 'u1', status: 'COMPLETED' }), expect.objectContaining({ limit: 1000 }));
  });

  it('trace les 12 derniers mois, du plus ancien au plus récent', async () => {
    const { trends } = (await svc().getPersonalStatistics('u1')).budget;
    expect(trends).toHaveLength(12);
    expect(trends[0]).toEqual({ period: '2025-12', budget: 500, spent: 30 });
    expect(trends.find((t) => t.period === '2026-03')!.spent).toBe(50);
    expect(trends[11]).toEqual({ period: '2026-11', budget: 500, spent: 100 });
  });

  it('classe services et prestataires les plus utilisés', async () => {
    const s = await svc().getPersonalStatistics('u1');
    expect(s.services.mostUsed[0]).toMatchObject({ serviceName: 'Consultation', count: 2, totalAmount: 80, averageAmount: 40 });
    expect(s.services.mostUsed[0]!.lastUsed).toEqual(at('2026-11-10T10:00:00Z'));
    expect(s.services.mostUsed.map((m) => m.serviceName)).toEqual(['Consultation', 'Analyse', 'Service']);

    expect(s.providers.favorites[0]).toMatchObject({ providerId: PROVIDER_A, providerName: 'Dr Bah', rating: 4.5, orderCount: 2, totalAmount: 80, avatar: 'a.png' });
    expect(s.providers.favorites[0]!.lastOrderDate).toEqual(at('2026-11-10T10:00:00Z'));
    expect(s.providers.favorites[1]).toMatchObject({ providerId: PROVIDER_B, providerName: 'Awa Sow', rating: 0, totalAmount: 25 });
    expect(s.providers.mostUsed[0]).toMatchObject({ providerId: PROVIDER_A, averageRating: 4.5 });
  });

  it('compte les réservations ; le panier moyen ne retient que les réservations payées', async () => {
    const { bookings: b } = await svc().getPersonalStatistics('u1');
    expect(b).toMatchObject({ total: 4, completed: 1, cancelled: 1, totalSpent: 80, averageBasketValue: 40 });
  });

  it('ne compte pas les réservations annulées parmi les actives', async () => {
    const { bookings: b } = await svc().getPersonalStatistics('u1');
    expect(b.active).toBe(2); // CONFIRMED + PENDING
  });

  it('calcule le montant d’une réservation sans prix direct (base + options − remise)', async () => {
    bookings.mockResolvedValueOnce(page([
      { status: 'CONFIRMED', metadata: { basePrice: 30, additionalOptions: [{ price: 5 }, { price: '5' }], discountAmount: 10 }, createdAt: '2026-11-20T10:00:00Z' },
      { status: 'FINISHED', metadata: { servicePrice: 20, optionsPrice: 4, additionalOptions: '{mauvais json' }, createdAt: '2026-11-20T10:00:00Z' },
      { status: 'FINISHED', metadata: { totalAmount: 99 }, createdAt: '2026-11-20T10:00:00Z' },
      { status: 'FINISHED', metadata: { discountAmount: 50 }, createdAt: '2026-11-20T10:00:00Z' },
    ]));
    const { bookings: b } = await svc().getPersonalStatistics('u1');
    expect(b.totalSpent).toBe(30 + 24 + 99 + 0);
    expect(b.averageBasketValue).toBe(153 / 4);
  });

  it('économies : rien d’inventé sans remise (avant : 10 % des dépenses)', async () => {
    const { savings } = await svc().getPersonalStatistics('u1');
    // La seule remise du jeu de base porte sur une réservation PENDING (non payée)
    expect(savings).toMatchObject({ total: 0, breakdown: [], projections: { monthly: 0, annual: 0 } });
  });

  it('économies : somme des remises des réservations payées de l’année', async () => {
    bookings.mockResolvedValueOnce(page([
      { status: 'FINISHED', metadata: { discountAmount: 10 }, createdAt: '2026-02-01T10:00:00Z' },
      { status: 'CONFIRMED', metadata: { discountAmount: '5,50 €' }, createdAt: '2026-11-01T10:00:00Z' },
      { status: 'FINISHED', metadata: { discountAmount: 20 }, createdAt: '2025-12-31T10:00:00Z' }, // année précédente
      { status: 'CANCELLED', metadata: { discountAmount: 99 }, createdAt: '2026-06-01T10:00:00Z' }, // non payée
      { status: 'FINISHED', metadata: { discountAmount: 'n/a' }, createdAt: '2026-06-01T10:00:00Z' },
    ]));
    const { savings } = await svc().getPersonalStatistics('u1');
    expect(savings.total).toBe(15.5);
    expect(savings.breakdown).toEqual([expect.objectContaining({ type: 'discount', amount: 15.5, description: 'Réductions et codes promo' })]);
    // 11 mois écoulés au 22 novembre
    expect(savings.projections).toEqual({ monthly: 1.41, annual: 15.5 });
  });

  it('lit les budgets en texte et retombe sur 1 000 € par défaut', async () => {
    findById.mockResolvedValueOnce({ id: 'u1', monthlyBudget: '250', annualBudget: '2000' });
    expect((await svc().getPersonalStatistics('u1')).budget).toMatchObject({ monthly: { budget: 250 }, annual: { budget: 2000 } });
    findById.mockResolvedValueOnce({ id: 'u1', monthlyBudget: 'abc', annualBudget: 'xyz' });
    expect((await svc().getPersonalStatistics('u1')).budget).toMatchObject({ monthly: { budget: 1000 }, annual: { budget: 12000 } });
    findById.mockResolvedValueOnce({ id: 'u1', monthlyBudget: 0, annualBudget: 3000 });
    expect((await svc().getPersonalStatistics('u1')).budget).toMatchObject({ monthly: { budget: 1000 }, annual: { budget: 3000 } });
  });

  it('parcourt toutes les pages de réservations et de transactions', async () => {
    const full = Array.from({ length: 1000 }, () => ({ status: 'PENDING', createdAt: '2026-11-01T10:00:00Z' }));
    bookings.mockResolvedValueOnce(page(full)).mockResolvedValueOnce(page([{ status: 'PENDING', createdAt: '2026-11-01T10:00:00Z' }]));
    const { bookings: b } = await svc().getPersonalStatistics('u1');
    expect(b.total).toBe(1001);
    expect(bookings).toHaveBeenNthCalledWith(2, { requesterId: 'u1' }, expect.objectContaining({ offset: 1000 }));
  });

  it('retombe sur une lecture individuelle si la recherche groupée des prestataires échoue', async () => {
    findAll.mockRejectedValueOnce(new Error('mongo HS'));
    findById.mockImplementation(async (id: string) =>
      id === 'u1' ? { id: 'u1' } : id === PROVIDER_A ? { id, firstName: 'Dr', lastName: 'Bah', roles: ['PROVIDER'] } : null,
    );
    const s = await svc().getPersonalStatistics('u1');
    expect(s.providers.favorites.find((f) => f.providerId === PROVIDER_A)!.providerName).toBe('Dr Bah');
    expect(s.providers.favorites.find((f) => f.providerId === PROVIDER_B)!.providerName).toBe('Prestataire');
  });

  it('ignore les identifiants de prestataire invalides', async () => {
    bookings.mockResolvedValueOnce(page([{ status: 'PENDING', providerId: 'pas-un-id', createdAt: '2026-11-01T10:00:00Z' }]));
    const s = await svc().getPersonalStatistics('u1');
    expect(findAll).not.toHaveBeenCalled();
    expect(s.providers.favorites[0]).toMatchObject({ providerId: 'pas-un-id', providerName: 'Prestataire' });
  });

  it('échoue pour un utilisateur introuvable', async () => {
    findById.mockResolvedValueOnce(null);
    await expect(svc().getPersonalStatistics('u1')).rejects.toThrow('Utilisateur non trouvé');
  });
});
