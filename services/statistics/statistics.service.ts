/**
 * Statistics Service - DiaspoMoney
 * Service de gestion des statistiques personnelles
 * Basé sur la charte de développement et les design patterns
 */

import { Cacheable, Log } from '@/lib/decorators';
import { logger } from '@/lib/logger';
import {
  getBookingRepository,
  getTransactionRepository,
  getUserRepository,
  IBookingRepository,
  ITransactionRepository,
  IUserRepository,
} from '@/repositories';
import type {
  PersonalStatistics,
  StatisticsTransaction,
  StatisticsBooking,
  StatisticsProvider,
  UserWithBudgets,
} from '@/lib/types/statistics.types';
import { TransactionStatus } from '@/lib/types/transaction.types';
import { CURRENCIES } from '@/lib/constants';
import { ObjectId } from 'mongodb';

/**
 * Service de statistiques
 * Implémente le Service Layer Pattern avec Dependency Injection
 */
export class StatisticsService {
  constructor(
    private bookingRepository: IBookingRepository,
    private transactionRepository: ITransactionRepository,
    private userRepository: IUserRepository,
  ) {}

  /**
   * Récupérer les statistiques personnelles d'un utilisateur
   * Utilise les décorateurs @Log et @Cacheable pour le logging et le cache
   */
  @Log({ level: 'info', logArgs: true, logResult: false })
  @Cacheable(300, { prefix: 'statistics:personal' }) // Cache 5 minutes
  async getPersonalStatistics(userId: string): Promise<PersonalStatistics> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Fix: handle pagination for allBookings and allTransactions
      const fetchAllBookings = async () => {
        const bookings: StatisticsBooking[] = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const result = await this.bookingRepository.findBookingsWithFilters(
            { requesterId: userId },
            { limit, page: 1, offset },
          );
          bookings.push(...result.data.map(b => ({
            ...b,
            createdAt: new Date(b.createdAt),
          })));
          if (result.data.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        }
        return bookings;
      };

      const fetchAllTransactions = async (filters: any) => {
        const transactions: StatisticsTransaction[] = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const result =
            await this.transactionRepository.findTransactionsWithFilters(
              filters,
              { limit, page: 1, offset },
            );
          transactions.push(...result.data.map(t => ({
            ...t,
            type: (t as any).type || 'PAYMENT' as const,
            status: t.status as TransactionStatus,
            createdAt: new Date(t.createdAt),
          } as StatisticsTransaction)));
          if (result.data.length < limit) {
            hasMore = false;
          } else {
            offset += limit;
          }
        }
        return transactions;
      };

      // RECOVER all bookings and transactions without missing results due to pagination
      const [allBookings, monthlyTransactions, annualTransactions] = await Promise.all([
        fetchAllBookings(),
        fetchAllTransactions({
          payerId: userId,
          status: 'COMPLETED',
          dateFrom: startOfMonth,
        }),
        fetchAllTransactions({
          payerId: userId,
          status: 'COMPLETED',
          dateFrom: startOfYear,
        }),
      ]);

      // Filter to ensure only records after the wanted period
      const monthlyTransFiltered = monthlyTransactions.filter(
        (t: StatisticsTransaction) => new Date(t.createdAt) >= startOfMonth,
      );
      const annualTransFiltered = annualTransactions.filter(
        (t: StatisticsTransaction) => new Date(t.createdAt) >= startOfYear,
      );

      // Récupérer les budgets depuis l'utilisateur (Repository Pattern)
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Récupérer les budgets depuis la BDD avec valeurs par défaut
      const userWithBudgets = user as unknown as UserWithBudgets;
      let monthlyBudget = 1000;
      if (typeof userWithBudgets.monthlyBudget === 'number' && userWithBudgets.monthlyBudget > 0)
        monthlyBudget = userWithBudgets.monthlyBudget;
      else if (typeof userWithBudgets.monthlyBudget === 'string') {
        const parsed = parseFloat(userWithBudgets.monthlyBudget);
        monthlyBudget = isNaN(parsed) || parsed <= 0 ? 1000 : parsed;
      }
      let annualBudget = monthlyBudget * 12;
      if (typeof userWithBudgets.annualBudget === 'number' && userWithBudgets.annualBudget > 0)
        annualBudget = userWithBudgets.annualBudget;
      else if (typeof userWithBudgets.annualBudget === 'string') {
        const parsed = parseFloat(userWithBudgets.annualBudget);
        annualBudget = isNaN(parsed) || parsed <= 0 ? monthlyBudget * 12 : parsed;
      }

      const monthlySpent = monthlyTransFiltered.reduce(
        (sum: number, t: StatisticsTransaction) => sum + (t.amount || 0),
        0,
      );
      const annualSpent = annualTransFiltered.reduce(
        (sum: number, t: StatisticsTransaction) => sum + (t.amount || 0),
        0,
      );

      // Services les plus utilisés
      const serviceCounts: Record<string, { count: number; totalAmount: number }> = {};
      allBookings.forEach((booking: StatisticsBooking) => {
        const serviceName = booking.selectedService?.name || 'Service';
        if (!serviceCounts[serviceName]) {
          serviceCounts[serviceName] = { count: 0, totalAmount: 0 };
        }
        serviceCounts[serviceName].count++;
        serviceCounts[serviceName].totalAmount +=
          (booking.selectedService as any)?.['price'] ||
          booking.amount ||
          (typeof (booking as any)['price'] === 'number' ? (booking as any)['price'] : 0) ||
          0;
      });
      const mostUsed = Object.entries(serviceCounts)
        .map(([serviceName, data]) => ({
          serviceName,
          serviceType: 'health' as const,
          count: data.count,
          totalAmount: data.totalAmount,
          averageAmount: data.totalAmount / data.count,
          lastUsed:
            allBookings
              .filter((b: StatisticsBooking) => b.selectedService?.name === serviceName)
              .sort(
                (a: StatisticsBooking, b: StatisticsBooking) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              )[0]?.createdAt || new Date(),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Prestataires préférés
      const providerCounts: Record<string, { count: number; totalAmount: number; lastOrder: Date }> = {};
      allBookings.forEach((booking: StatisticsBooking) => {
        const providerId = booking.providerId;
        if (!providerId) return; // fix: skip if providerId missing
        if (!providerCounts[providerId]) {
          providerCounts[providerId] = {
            count: 0,
            totalAmount: 0,
            lastOrder: new Date(booking.createdAt),
          };
        }
        providerCounts[providerId].count++;
        // fix: more robustly get booking price
        const bookingPrice = (booking.selectedService as any)?.['price'] ||
          booking.amount ||
          (typeof (booking as any)['price'] === 'number' ? (booking as any)['price'] : 0) || 0;
        providerCounts[providerId].totalAmount += bookingPrice;
        if (
          new Date(booking.createdAt) >
          new Date(providerCounts[providerId].lastOrder)
        ) {
          providerCounts[providerId].lastOrder = new Date(booking.createdAt);
        }
        providerCounts[providerId] = providerCounts[providerId] as { count: number; totalAmount: number; lastOrder: Date };
      });

      // Récupérer les informations des providers (Repository Pattern)
      const providerIds = Object.keys(providerCounts).filter((id) => !!id && id !== 'undefined');
      let providers: StatisticsProvider[] = [];

      if (providerIds.length > 0) {
        // Fix: if ObjectId fails, skip
        try {
          const objectIds = providerIds
            .map(id => {
              try {
                return new ObjectId(id);
              } catch {
                return null;
              }
            })
            .filter((id): id is ObjectId => id !== null);

          if (objectIds.length > 0) {
            const allProviders = await this.userRepository.findAll({
              _id: { $in: objectIds },
              roles: 'PROVIDER',
            });
            providers = allProviders
              .map((p: any) => ({
                id: p.id || p._id?.toString() || '',
                email: p.email || '',
                name: p.name || '',
                firstName: p.firstName,
                lastName: p.lastName,
                phone: p.phone,
                company: p.company,
                address: p.address,
                roles: Array.isArray(p.roles) ? p.roles : [p.roles].filter(Boolean),
                status: p.status || 'ACTIVE',
                specialty: p.specialty,
                recommended: p.recommended ?? false,
                providerInfo: p.providerInfo || {},
                avatar: p.avatar,
                rating: p.rating || (p.providerInfo as any)?.['rating'],
                reviewCount: p.reviewCount || (p.providerInfo as any)?.['reviewCount'],
                specialties: p.specialties || (p.providerInfo as any)?.['specialties'],
                services: p.services || (p.providerInfo as any)?.['services'],
                isActive: p.isActive ?? true,
                city: p.city || (p.providerInfo as any)?.['city'],
              } as StatisticsProvider))
              .filter(
                (p: StatisticsProvider): p is StatisticsProvider => Array.isArray(p.roles)
                  ? p.roles.includes('PROVIDER')
                  : p.roles === 'PROVIDER',
              );
          }
        } catch (error) {
          logger.warn(
            {
              error,
              providerIds,
              msg: 'Error fetching providers, falling back to individual queries',
            },
            'Error fetching providers with findAll',
          );
          // Fallback: récupérer chaque provider individuellement
          const providerPromises = providerIds.map(id =>
            this.userRepository.findById(id).catch(() => null),
          );
          const providerResults = await Promise.all(providerPromises);
          providers = providerResults
            .filter((p): p is NonNullable<typeof p> => p !== null)
            .map((p: any) => ({
              id: p.id || p._id?.toString() || '',
              email: p.email || '',
              name: p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim() || '',
              firstName: p.firstName,
              lastName: p.lastName,
              phone: p.phone,
              company: p.company,
              address: p.address,
              roles: Array.isArray(p.roles) ? p.roles : [p.roles].filter(Boolean),
              status: p.status || 'ACTIVE',
              specialty: p.specialty,
              recommended: p['recommended'] ?? false,
              providerInfo: p.providerInfo || {},
              avatar: p.avatar,
              rating: p.rating || (p.providerInfo as any)?.['rating'],
              reviewCount: p.reviewCount || (p.providerInfo as any)?.['reviewCount'],
              specialties: p.specialties || (p.providerInfo as any)?.['specialties'],
              services: p.services || (p.providerInfo as any)?.['services'],
              isActive: p.isActive ?? true,
              city: p.city || (p.providerInfo as any)?.['city'],
            } as StatisticsProvider))
            .filter(
              (p: StatisticsProvider): p is StatisticsProvider =>
                Array.isArray(p.roles)
                  ? p.roles.includes('PROVIDER')
                  : p.roles === 'PROVIDER',
            );
        }
      }

      const providerMap = new Map<string, StatisticsProvider>(
        providers.map((p: StatisticsProvider) => [
          (p.id || (p as any)['_id']?.toString() || '').toString(),
          p,
        ]),
      );

      const favorites = Object.entries(providerCounts)
        .map(([providerId, data]) => {
          const provider = providerMap.get(providerId);
          // Fix: prefer "provider?.fullName" if available?
          const providerRating =
            (provider?.providerInfo as any)?.['rating'] ??
            (provider as any)?.['rating'] ??
            0;
          return {
            providerId,
            providerName:
              provider?.name ||
              `${provider?.firstName || ''} ${
                provider?.lastName || ''
              }`.trim() ||
              'Prestataire',
            avatar: provider?.avatar,
            rating: providerRating > 0 ? providerRating : 0,
            orderCount: data.count,
            totalAmount: data.totalAmount,
            lastOrderDate: data.lastOrder,
          };
        })
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, 10);

      // Calculer les tendances mensuelles sur les 12 derniers mois
      const trends: Array<{
        period: string;
        budget: number;
        spent: number;
      }> = [];

      // Récupérer toutes les transactions des 12 derniers mois pour les tendances
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      twelveMonthsAgo.setDate(1); // Premier jour du mois

      // Fix: get all transactions for trends (pagination)
      const trendTransactionsAll = await fetchAllTransactions({
        payerId: userId,
        status: 'COMPLETED',
        dateFrom: twelveMonthsAgo,
      });
      const trendsTransactions = trendTransactionsAll.filter(
        (t: StatisticsTransaction) => new Date(t.createdAt) >= twelveMonthsAgo,
      );

      // Grouper les transactions par mois
      const transactionsByMonth: Record<string, { spent: number }> = {};

      trendsTransactions.forEach((transaction: StatisticsTransaction) => {
        const transactionDate = new Date(transaction.createdAt);
        const monthKey = `${transactionDate.getFullYear()}-${String(
          transactionDate.getMonth() + 1,
        ).padStart(2, '0')}`;

        if (!transactionsByMonth[monthKey]) {
          transactionsByMonth[monthKey] = { spent: 0 };
        }
        transactionsByMonth[monthKey].spent += transaction.amount || 0;
      });

      // Générer les tendances pour les 12 derniers mois
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now);
        monthDate.setMonth(monthDate.getMonth() - i);
        monthDate.setDate(1); // Premier jour du mois

        const periodKey = `${monthDate.getFullYear()}-${String(
          monthDate.getMonth() + 1,
        ).padStart(2, '0')}`;

        const monthData = transactionsByMonth[periodKey] || { spent: 0 };

        trends.push({
          period: periodKey,
          budget: monthlyBudget,
          spent: Math.round(monthData.spent * 100) / 100,
        });
      }

      // Économies (exemple: 10% de réduction sur les services)
      const totalSpent = annualSpent;
      const estimatedSavings = totalSpent * 0.1; // 10% d'économies estimées

      const statistics: PersonalStatistics = {
        budget: {
          monthly: {
            budget: monthlyBudget,
            spent: monthlySpent,
            remaining: monthlyBudget - monthlySpent,
            percentage: monthlyBudget > 0 ? Math.round((monthlySpent / monthlyBudget) * 100) : 0,
            period: {
              start: startOfMonth,
              end: now,
            },
          },
          annual: {
            budget: annualBudget,
            spent: annualSpent,
            remaining: annualBudget - annualSpent,
            percentage: annualBudget > 0 ? Math.round((annualSpent / annualBudget) * 100) : 0,
            period: {
              start: startOfYear,
              end: now,
            },
          },
          trends,
        },
        services: {
          mostUsed: mostUsed.map(m => ({
            ...m,
            lastUsed: new Date(m.lastUsed),
          })),
          byCategory: [],
          byMonth: [],
        },
        savings: {
          total: estimatedSavings,
          currency: CURRENCIES.EUR.code,
          breakdown: [
            {
              type: 'discount' as const,
              amount: estimatedSavings,
              description: 'Réductions et promotions',
              date: now,
            },
          ],
          byMonth: [],
          projections: {
            monthly: estimatedSavings / 12,
            annual: estimatedSavings,
          },
        },
        providers: {
          favorites: favorites.map(f => ({
            ...f,
            lastOrderDate: new Date(f.lastOrderDate),
          })) as { providerId: string; providerName: string; avatar: string; rating: number; orderCount: number; totalAmount: number; lastOrderDate: Date }[],
          mostUsed: favorites.map(fav => ({
            providerId: fav.providerId,
            providerName: fav.providerName,
            orderCount: fav.orderCount,
            totalAmount: fav.totalAmount,
            averageRating: fav.rating,
          })),
          bySpecialty: [],
        },
        period: {
          start: startOfYear,
          end: now,
        },
      };

      return statistics;
    } catch (error) {
      logger.error(
        { error, userId },
        'Erreur lors de la récupération des statistiques personnelles',
      );
      throw error;
    }
  }
}

// Singleton instance avec Dependency Injection
export const statisticsService = new StatisticsService(
  getBookingRepository(),
  getTransactionRepository(),
  getUserRepository(),
);
