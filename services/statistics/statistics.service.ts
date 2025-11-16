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
import { PersonalStatistics } from '@/types/statistics';
import { ObjectId } from 'mongodb';

/**
 * Service de statistiques
 * Implémente le Service Layer Pattern avec Dependency Injection
 */
export class StatisticsService {
  constructor(
    private bookingRepository: IBookingRepository,
    private transactionRepository: ITransactionRepository,
    private userRepository: IUserRepository
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

      // Récupérer tous les bookings pour calculer les statistiques
      const allBookingsResult =
        await this.bookingRepository.findBookingsWithFilters(
          {
            requesterId: userId,
          },
          {
            limit: 1000,
            offset: 0,
          }
        );
      const allBookings = allBookingsResult.data;

      // Récupérer les transactions pour le budget (payerId = userId)
      const monthlyTransactionsResult =
        await this.transactionRepository.findTransactionsWithFilters(
          {
            payerId: userId,
            status: 'COMPLETED',
            dateFrom: startOfMonth,
          },
          {
            limit: 1000,
            offset: 0,
          }
        );
      const monthlyTransactions = monthlyTransactionsResult.data.filter(
        (t: any) => new Date(t.createdAt) >= startOfMonth
      );

      const annualTransactionsResult =
        await this.transactionRepository.findTransactionsWithFilters(
          {
            payerId: userId,
            status: 'COMPLETED',
            dateFrom: startOfYear,
          },
          {
            limit: 1000,
            offset: 0,
          }
        );
      const annualTransactions = annualTransactionsResult.data.filter(
        (t: any) => new Date(t.createdAt) >= startOfYear
      );

      // Récupérer les budgets depuis l'utilisateur (Repository Pattern)
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Récupérer les budgets depuis la BDD avec valeurs par défaut
      // Le modèle User a maintenant monthlyBudget et annualBudget en Number avec defaults
      const monthlyBudget =
        typeof (user as any)['monthlyBudget'] === 'number' &&
        (user as any)['monthlyBudget'] > 0
          ? (user as any)['monthlyBudget']
          : typeof (user as any)['monthlyBudget'] === 'string'
          ? parseFloat((user as any)['monthlyBudget']) || 1000
          : 1000;

      const annualBudget =
        typeof (user as any)['annualBudget'] === 'number' &&
        (user as any)['annualBudget'] > 0
          ? (user as any)['annualBudget']
          : typeof (user as any)['annualBudget'] === 'string'
          ? parseFloat((user as any)['annualBudget']) || monthlyBudget * 12
          : monthlyBudget * 12;

      const monthlySpent = monthlyTransactions.reduce(
        (sum: number, t: any) => sum + (t.amount || 0),
        0
      );
      const annualSpent = annualTransactions.reduce(
        (sum: number, t: any) => sum + (t.amount || 0),
        0
      );

      // Services les plus utilisés
      const serviceCounts: Record<
        string,
        { count: number; totalAmount: number }
      > = {};
      allBookings.forEach((booking: any) => {
        const serviceName = booking.selectedService?.name || 'Service';
        if (!serviceCounts[serviceName]) {
          serviceCounts[serviceName] = { count: 0, totalAmount: 0 };
        }
        serviceCounts[serviceName].count++;
        serviceCounts[serviceName].totalAmount +=
          booking.selectedService?.price || booking.price || 0;
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
              .filter((b: any) => b.selectedService?.name === serviceName)
              .sort(
                (a: any, b: any) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )[0]?.createdAt || new Date(),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Prestataires préférés
      const providerCounts: Record<
        string,
        { count: number; totalAmount: number; lastOrder: Date }
      > = {};
      allBookings.forEach((booking: any) => {
        const providerId = booking.providerId;
        if (!providerCounts[providerId]) {
          providerCounts[providerId] = {
            count: 0,
            totalAmount: 0,
            lastOrder: booking.createdAt,
          };
        }
        providerCounts[providerId].count++;
        const bookingDoc = allBookings.find(
          (doc: any) =>
            (doc._id?.toString() || doc.id) === (booking.id || booking._id)
        );
        providerCounts[providerId].totalAmount +=
          (bookingDoc as any)?.selectedService?.price || 0;
        if (
          new Date(booking.createdAt) >
          new Date(providerCounts[providerId].lastOrder)
        ) {
          providerCounts[providerId].lastOrder = booking.createdAt;
        }
      });

      // Récupérer les informations des providers (Repository Pattern)
      const providerIds = Object.keys(providerCounts);
      let providers: any[] = [];

      if (providerIds.length > 0) {
        // Optimisation: utiliser findAll avec filtre _id: { $in: [...] } (Repository Pattern)
        // Plus efficace qu'un appel findById pour chaque provider
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
            providers = allProviders.filter(
              (p: any): p is any => p.roles?.includes('PROVIDER') ?? false
            );
          }
        } catch (error) {
          logger.warn(
            {
              error,
              providerIds,
              msg: 'Error fetching providers, falling back to individual queries',
            },
            'Error fetching providers with findAll'
          );
          // Fallback: récupérer chaque provider individuellement
          const providerPromises = providerIds.map(id =>
            this.userRepository.findById(id).catch(() => null)
          );
          const providerResults = await Promise.all(providerPromises);
          providers = providerResults.filter(
            (p: any): p is any =>
              p !== null && (p.roles?.includes('PROVIDER') ?? false)
          );
        }
      }

      const providerMap = new Map(
        providers.map((p: any) => [
          (p.id || p._id?.toString() || '').toString(),
          p,
        ])
      );

      const favorites = Object.entries(providerCounts)
        .map(([providerId, data]) => {
          const provider = providerMap.get(providerId);
          // Récupérer le rating depuis providerInfo.rating ou rating direct
          const providerRating =
            (provider as any)?.providerInfo?.rating ??
            (provider as any)?.rating ??
            0;
          return {
            providerId,
            providerName:
              (provider as any)?.name ||
              `${(provider as any)?.firstName || ''} ${
                (provider as any)?.lastName || ''
              }`.trim() ||
              'Prestataire',
            avatar: (provider as any)?.avatar,
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

      const trendsTransactionsResult =
        await this.transactionRepository.findTransactionsWithFilters(
          {
            payerId: userId,
            status: 'COMPLETED',
            dateFrom: twelveMonthsAgo,
          },
          {
            limit: 10000, // Limite élevée pour récupérer toutes les transactions
            offset: 0,
          }
        );
      const trendsTransactions = trendsTransactionsResult.data.filter(
        (t: any) => new Date(t.createdAt) >= twelveMonthsAgo
      );

      // Grouper les transactions par mois
      const transactionsByMonth: Record<string, { spent: number }> = {};

      trendsTransactions.forEach((transaction: any) => {
        const transactionDate = new Date(transaction.createdAt);
        const monthKey = `${transactionDate.getFullYear()}-${String(
          transactionDate.getMonth() + 1
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
          monthDate.getMonth() + 1
        ).padStart(2, '0')}`;

        const monthData = transactionsByMonth[periodKey] || { spent: 0 };

        trends.push({
          period: periodKey,
          budget: monthlyBudget, // Utiliser le budget mensuel actuel pour tous les mois
          spent: Math.round(monthData.spent * 100) / 100, // Arrondir à 2 décimales
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
            percentage: Math.round((monthlySpent / monthlyBudget) * 100),
            period: {
              start: startOfMonth,
              end: now,
            },
          },
          annual: {
            budget: annualBudget,
            spent: annualSpent,
            remaining: annualBudget - annualSpent,
            percentage: Math.round((annualSpent / annualBudget) * 100),
            period: {
              start: startOfYear,
              end: now,
            },
          },
          trends,
        },
        services: {
          mostUsed,
          byCategory: [],
          byMonth: [],
        },
        savings: {
          total: estimatedSavings,
          currency: 'EUR',
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
          favorites,
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
        'Erreur lors de la récupération des statistiques personnelles'
      );
      throw error;
    }
  }
}

// Singleton instance avec Dependency Injection
export const statisticsService = new StatisticsService(
  getBookingRepository(),
  getTransactionRepository(),
  getUserRepository()
);
