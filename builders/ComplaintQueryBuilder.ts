/**
 * ComplaintQueryBuilder - Builder spécialisé pour les requêtes complaint
 * Étend QueryBuilder avec des méthodes spécifiques aux réclamations
 */

import { ComplaintStatus } from '@/repositories/interfaces/IComplaintRepository';
import { QueryBuilder } from './QueryBuilder';

export class ComplaintQueryBuilder extends QueryBuilder {
  /**
   * Filtrer par utilisateur
   */
  byUser(userId: string): this {
    return this.where('userId', userId);
  }

  /**
   * Filtrer par provider
   */
  byProvider(providerId: string): this {
    return this.where('provider', providerId);
  }

  /**
   * Filtrer par appointment
   */
  byAppointment(appointmentId: string): this {
    return this.where('appointmentId', appointmentId);
  }

  /**
   * Filtrer par type
   */
  byType(type: 'SERVICE_QUALITY' | 'BILLING' | 'CANCELLATION' | 'OTHER'): this {
    return this.where('type', type);
  }

  /**
   * Filtrer par priorité
   */
  byPriority(priority: 'low' | 'medium' | 'high'): this {
    return this.where('priority', priority);
  }

  /**
   * Filtrer par statut
   */
  byStatus(status: ComplaintStatus): this {
    return this.where('status', status);
  }

  /**
   * Filtrer les réclamations ouvertes
   */
  open(): this {
    return this.where('status', 'OPEN');
  }

  /**
   * Filtrer les réclamations en cours
   */
  inProgress(): this {
    return this.where('status', 'IN_PROGRESS');
  }

  /**
   * Filtrer les réclamations résolues
   */
  resolved(): this {
    return this.where('status', 'RESOLVED');
  }

  /**
   * Filtrer les réclamations fermées
   */
  closed(): this {
    return this.where('status', 'CLOSED');
  }

  /**
   * Filtrer par priorité haute
   */
  highPriority(): this {
    return this.where('priority', 'high');
  }

  /**
   * Filtrer par priorité moyenne
   */
  mediumPriority(): this {
    return this.where('priority', 'medium');
  }

  /**
   * Filtrer par priorité basse
   */
  lowPriority(): this {
    return this.where('priority', 'low');
  }

  /**
   * Filtrer les réclamations créées après une date
   */
  createdAfter(date: Date): this {
    return this.whereGreaterThan('createdAt', date);
  }

  /**
   * Filtrer les réclamations créées avant une date
   */
  createdBefore(date: Date): this {
    return this.whereLessThan('createdAt', date);
  }

  /**
   * Filtrer les réclamations créées entre deux dates
   */
  createdBetween(startDate: Date, endDate: Date): this {
    return this.whereGreaterThanOrEqual('createdAt', startDate)
      .whereLessThanOrEqual('createdAt', endDate);
  }

  /**
   * Trier par date de création (plus récentes en premier)
   */
  orderByCreatedAt(direction: 'asc' | 'desc' = 'desc'): this {
    return this.orderBy('createdAt', direction);
  }

  /**
   * Trier par priorité (haute en premier)
   */
  orderByPriority(direction: 'asc' | 'desc' = 'desc', priority: 'HIGH' | 'MEDIUM' | 'LOW'): this {
    // Note: Pour un tri par priorité, on peut utiliser un champ calculé ou trier côté application
    // Priority order: high: 3, medium: 2, low: 1
    const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
    // Ici, on utilise simplement le tri alphabétique qui fonctionne pour 'high', 'medium', 'low'
    return this.orderBy(`priority_${priorityOrder[priority as keyof typeof priorityOrder]}`, direction);
  }

  /**
   * Trier par statut
   */
  orderByStatus(direction: 'asc' | 'desc' = 'asc'): this {
    return this.orderBy('status', direction);
  }
}

