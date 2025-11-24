/**
 * Mappers pour les statistiques
 * Transforme les données brutes en statistiques formatées pour l'API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import type { BudgetStatistics, ServiceStatistics, SavingsStatistics, ProviderStatistics } from '@/lib/types/statistics.types';

/**
 * Type pour les données brutes de statistiques
 */
export interface StatisticsRawData {
  transactions?: any[];
  bookings?: any[];
  providers?: any[];
  users?: any[];
  period?: {
    start?: Date | string;
    end?: Date | string;
  };
  [key: string]: any;
}

/**
 * Type pour une réponse API de statistiques
 */
export interface StatisticsResponse {
  budget: BudgetStatistics;
  services: ServiceStatistics;
  savings: SavingsStatistics;
  providers: ProviderStatistics;
  period: {
    start: string;
    end: string;
  };
}

/**
 * Convertit une date en ISO string de manière sécurisée
 */
function toISOString(date: Date | string | undefined | null): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  try {
    return new Date(date as string | number).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Convertit une date en Date object
 */
function toDate(date: Date | string | undefined | null): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  try {
    return new Date(date as string | number);
  } catch {
    return new Date();
  }
}

/**
 * Classe StatisticsMapper implémentant IMapper
 */
export class StatisticsMapper implements IMapper<StatisticsRawData, StatisticsResponse> {
  /**
   * Transforme des données brutes vers une réponse API de statistiques
   */
  map(input: StatisticsRawData, options?: MappingOptions): StatisticsResponse {
    return mapStatisticsToResponse(input, options);
  }

  /**
   * Transforme un tableau de données brutes (non utilisé pour les statistiques)
   */
  mapMany(inputs: StatisticsRawData[], options?: MappingOptions): StatisticsResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const statisticsMapper = new StatisticsMapper();

/**
 * Mappe des données brutes vers une réponse API de statistiques
 * 
 * @param rawData - Données brutes depuis les services
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapStatisticsToResponse(
  rawData: StatisticsRawData,
  _options?: MappingOptions,
): StatisticsResponse {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  const period = rawData.period ? {
    start: toISOString(rawData.period.start),
    end: toISOString(rawData.period.end),
  } : {
    start: toISOString(startOfYear),
    end: toISOString(now),
  };

  // Budget Statistics
  const budget: BudgetStatistics = (rawData['budget'] as BudgetStatistics | undefined) || {
    monthly: {
      budget: 0,
      spent: 0,
      remaining: 0,
      percentage: 0,
      period: {
        start: toDate(startOfMonth),
        end: toDate(now),
      },
    },
    annual: {
      budget: 0,
      spent: 0,
      remaining: 0,
      percentage: 0,
      period: {
        start: toDate(startOfYear),
        end: toDate(now),
      },
    },
    trends: [],
  };

  // Service Statistics
  const services: ServiceStatistics = (rawData['services'] as ServiceStatistics | undefined) || {
    mostUsed: [],
    byCategory: [],
    byMonth: [],
  };

  // Savings Statistics
  const savings: SavingsStatistics = (rawData['savings'] as SavingsStatistics | undefined) || {
    total: 0,
    currency: 'EUR',
    breakdown: [],
    byMonth: [],
    projections: {
      monthly: 0,
      annual: 0,
    },
  };

  // Provider Statistics
  const providersData = rawData['providers'];
  const providers: ProviderStatistics = (providersData && typeof providersData === 'object' && !Array.isArray(providersData) 
    ? providersData as ProviderStatistics 
    : undefined) || {
    favorites: [],
    mostUsed: [],
    bySpecialty: [],
  };

  return {
    budget,
    services,
    savings,
    providers,
    period,
  };
}

