/**
 * Schémas de validation Zod pour les statistiques
 * Utilisés dans les routes API pour valider les entrées
 */

import { CURRENCIES } from '@/lib/constants';
import { z } from 'zod';

/**
 * Schéma pour les filtres de statistiques
 */
export const StatisticsFiltersSchema = z.object({
  userId: z.string().min(1).optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  currency: z
    .enum([
      CURRENCIES.EUR.code,
      CURRENCIES.USD.code,
      CURRENCIES.XOF.code,
      CURRENCIES.XAF.code,
      CURRENCIES.GBP.code,
      CURRENCIES.JPY.code,
    ] as [string, ...string[]])
    .optional()
    .default(CURRENCIES.EUR.code),
  serviceType: z.enum(['HEALTH', 'BTP', 'EDUCATION']).optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year', 'service', 'provider']).optional(),
});

/**
 * Schéma pour les requêtes de statistiques de budget
 */
export const BudgetStatisticsSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  currency: z
    .enum([
      CURRENCIES.EUR.code,
      CURRENCIES.USD.code,
      CURRENCIES.XOF.code,
      CURRENCIES.XAF.code,
      CURRENCIES.GBP.code,
      CURRENCIES.JPY.code,
    ] as [string, ...string[]])
    .optional()
    .default(CURRENCIES.EUR.code),
});

/**
 * Schéma pour les requêtes de statistiques de services
 */
export const ServiceStatisticsSchema = z.object({
  userId: z.string().min(1, 'User ID is required').optional(),
  serviceType: z.enum(['HEALTH', 'BTP', 'EDUCATION']).optional(),
  startDate: z.string().datetime().optional().or(z.date().optional()),
  endDate: z.string().datetime().optional().or(z.date().optional()),
  limit: z.number().int().positive().max(100).optional().default(10),
});

/**
 * Types TypeScript dérivés des schémas
 */
export type StatisticsFiltersInput = z.infer<typeof StatisticsFiltersSchema>;
export type BudgetStatisticsInput = z.infer<typeof BudgetStatisticsSchema>;
export type ServiceStatisticsInput = z.infer<typeof ServiceStatisticsSchema>;

