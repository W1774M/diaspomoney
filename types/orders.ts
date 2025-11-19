/**
 * Types et interfaces pour la gestion des commandes
 * Implémente les types pour les commandes actives, historique, progression, etc.
 */

import { BaseEntity } from './index';

/**
 * Statut d'une commande/service
 */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'delayed';

/**
 * Type de service (santé, BTP, éducation)
 */
export type ServiceType = 'health' | 'construction' | 'education';

/**
 * Progression d'une commande (pour services de santé)
 */
export interface OrderProgress {
  currentStep: number;
  totalSteps: number;
  steps: OrderStep[];
  percentage: number;
  estimatedCompletionDate?: Date;
}

/**
 * Étape de progression d'une commande
 */
export interface OrderStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  completedAt?: Date;
  estimatedDuration?: number; // en minutes
}

/**
 * Commande active (service en cours)
 */
export interface ActiveOrder extends BaseEntity {
  orderNumber: string;
  bookingId: string;
  serviceType: ServiceType;
  serviceName: string;
  serviceDescription?: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  csmId?: string; // Customer Success Manager assigné
  csmName?: string;
  status: OrderStatus;
  progress: OrderProgress;
  assignedProviders: AssignedProvider[];
  estimatedDeliveryDate: Date;
  actualDeliveryDate?: Date;
  beneficiary?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  amount: number;
  currency: string;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'refunded';
  chatEnabled: boolean;
  conversationId?: string; // Pour le chat direct
}

/**
 * Prestataire assigné à une commande
 */
export interface AssignedProvider {
  id: string;
  name: string;
  avatar?: string;
  role: 'main' | 'assistant' | 'specialist';
  specialty?: string;
  assignedAt: Date;
}

/**
 * Commande historique (service terminé)
 */
export interface HistoricalOrder extends BaseEntity {
  orderNumber: string;
  bookingId: string;
  serviceType: ServiceType;
  serviceName: string;
  providerId: string;
  providerName: string;
  providerAvatar?: string;
  status: 'completed' | 'cancelled';
  completedDate: Date;
  cancelledDate?: Date;
  amount: number;
  currency: string;
  paymentStatus: 'paid' | 'refunded';
  invoiceId?: string;
  invoiceNumber?: string;
  rating?: number; // 1-5
  review?: string;
  reviewedAt?: Date;
  canReorder: boolean; // Possibilité de réserver à nouveau
}

/**
 * Filtres pour les commandes
 */
export interface OrderFilters {
  searchTerm?: string;
  status?: OrderStatus | 'all';
  serviceType?: ServiceType | 'all';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

/**
 * Statistiques personnelles
 */
export interface PersonalStatistics {
  budget: {
    monthly: number;
    annual: number;
    spent: number;
    remaining: number;
    period: {
      start: Date;
      end: Date;
    };
  };
  services: {
    mostUsed: Array<{
      serviceName: string;
      serviceType: ServiceType;
      count: number;
      totalAmount: number;
    }>;
    byCategory: Array<{
      category: string;
      count: number;
      totalAmount: number;
    }>;
  };
  savings: {
    total: number;
    currency: string;
    breakdown: Array<{
      type: 'discount' | 'promotion' | 'loyalty';
      amount: number;
      description: string;
    }>;
  };
  providers: {
    favorites: Array<{
      providerId: string;
      providerName: string;
      avatar?: string;
      rating: number;
      orderCount: number;
      lastOrderDate: Date;
    }>;
    mostUsed: Array<{
      providerId: string;
      providerName: string;
      orderCount: number;
      totalAmount: number;
    }>;
  };
}

/**
 * Props pour les composants de commandes
 */
export interface ActiveOrderCardProps {
  order: ActiveOrder;
  onView: (order: ActiveOrder) => void;
  onChat: (order: ActiveOrder) => void;
}

export interface HistoricalOrderCardProps {
  order: HistoricalOrder;
  onView: (order: HistoricalOrder) => void;
  onDownloadInvoice: (order: HistoricalOrder) => void;
  onRate: (order: HistoricalOrder) => void;
  onReorder: (order: HistoricalOrder) => void;
}

export interface OrderProgressBarProps {
  progress: OrderProgress;
  showSteps?: boolean;
}

export interface OrderChatProps {
  orderId: string;
  conversationId?: string;
  providerId: string;
  providerName: string;
  csmId?: string;
  csmName?: string;
}
