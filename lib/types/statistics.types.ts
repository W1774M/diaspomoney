/**
 * Types et interfaces pour les statistiques personnelles
 */

import { ServiceType } from './orders.types';
import type { Transaction } from './transaction.types';

/**
 * Statistiques de budget
 */
export interface BudgetStatistics {
  monthly: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    period: {
      start: Date;
      end: Date;
    };
  };
  annual: {
    budget: number;
    spent: number;
    remaining: number;
    percentage: number;
    period: {
      start: Date;
      end: Date;
    };
  };
  trends: Array<{
    period: string; // "2024-01", "2024-02", etc.
    budget: number;
    spent: number;
  }>;
}

/**
 * Statistiques de services
 */
export interface ServiceStatistics {
  mostUsed: Array<{
    serviceName: string;
    serviceType: ServiceType;
    count: number;
    totalAmount: number;
    averageAmount: number;
    lastUsed: Date;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
    totalAmount: number;
    percentage: number;
  }>;
  byMonth: Array<{
    month: string; // "2024-01"
    count: number;
    totalAmount: number;
  }>;
}

/**
 * Statistiques d'économies
 */
export interface SavingsStatistics {
  total: number;
  currency: string;
  breakdown: Array<{
    type: 'discount' | 'promotion' | 'loyalty' | 'package';
    amount: number;
    description: string;
    date: Date;
  }>;
  byMonth: Array<{
    month: string;
    amount: number;
  }>;
  projections: {
    monthly: number;
    annual: number;
  };
}

/**
 * Statistiques de prestataires
 */
export interface ProviderStatistics {
  favorites: Array<{
    providerId: string;
    providerName: string;
    avatar?: string;
    rating: number;
    orderCount: number;
    totalAmount: number;
    lastOrderDate: Date;
    specialties?: string[];
  }>;
  mostUsed: Array<{
    providerId: string;
    providerName: string;
    orderCount: number;
    totalAmount: number;
    averageRating: number;
  }>;
  bySpecialty: Array<{
    specialty: string;
    providerCount: number;
    orderCount: number;
    totalAmount: number;
  }>;
}

/**
 * Statistiques personnelles complètes
 */
export interface PersonalStatistics {
  budget: BudgetStatistics;
  services: ServiceStatistics;
  savings: SavingsStatistics;
  providers: ProviderStatistics;
  period: {
    start: Date;
    end: Date;
  };
}

/**
 * Types pour les statistiques de service
 */
export type StatisticsTransaction = Omit<Transaction, 'createdAt'> & {
  type?: Transaction['type'];
  createdAt: Date;
};

export interface StatisticsBooking {
  id: string;
  requesterId: string;
  providerId?: string;
  selectedService?: {
    name: string;
    type: ServiceType;
  };
  status: string;
  amount?: number;
  createdAt: Date;
  [key: string]: unknown;
}

export interface StatisticsProvider {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  company?: string;
  address?: string;
  roles: string[];
  status: string;
  specialty?: string;
  recommended: boolean;
  providerInfo?: Record<string, unknown>;
  avatar?: {
    image?: string;
    name?: string;
  };
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  services?: string[];
  isActive?: boolean;
  city?: string;
  [key: string]: unknown;
}

export interface UserWithBudgets {
  id: string;
  email: string;
  name: string;
  roles: string[];
  status: string;
  recommended: boolean;
  monthlyBudget?: number | string;
  annualBudget?: number | string;
  [key: string]: unknown;
}
