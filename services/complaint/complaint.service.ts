/**
 * Complaint Service - DiaspoMoney
 * Service de gestion des réclamations utilisant le Service Layer Pattern
 * Utilise le Repository Pattern pour l'accès aux données
 *
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern (via IComplaintRepository)
 * - Dependency Injection (via constructor injection)
 * - Singleton Pattern
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache, @Validate)
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import {
  createValidationRule,
  Validate,
} from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import {
  Complaint,
  ComplaintFilters,
  getComplaintRepository,
  IComplaintRepository,
} from '@/repositories';
import {
  ComplaintServiceFilters,
  CreateComplaintData,
  UpdateComplaintData,
} from '@/types/complaints';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

/**
 * ComplaintService utilisant le Service Layer Pattern
 * Utilise le Repository Pattern pour l'accès aux données (Dependency Injection)
 */
export class ComplaintService {
  private static instance: ComplaintService;
  private complaintRepository: IComplaintRepository;

  private constructor() {
    // Dependency Injection : injecter le repository
    this.complaintRepository = getComplaintRepository();
  }

  static getInstance(): ComplaintService {
    if (!ComplaintService.instance) {
      ComplaintService.instance = new ComplaintService();
    }
    return ComplaintService.instance;
  }

  /**
   * Récupérer une réclamation par ID
   */
  @Log({ level: 'info', logArgs: true })
  @Cacheable(300, { prefix: 'ComplaintService:getComplaintById' }) // Cache 5 minutes
  @Validate({
    rules: [
      createValidationRule(
        0,
        z.string().min(1, 'Complaint ID is required'),
        'id',
      ),
    ],
  })
  async getComplaintById(id: string): Promise<Complaint | null> {
    try {
      return await this.complaintRepository.findById(id);
    } catch (error) {
      logger.error(
        { error, id },
        'Erreur lors de la récupération de la réclamation',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les réclamations avec filtres
   */
  @Log({ level: 'info', logArgs: true })
  @Cacheable(600, { prefix: 'ComplaintService:getComplaints' }) // Cache 10 minutes
  async getComplaints(filters: ComplaintServiceFilters = {}): Promise<{
    data: Complaint[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const repositoryFilters: ComplaintFilters = {
        userId: filters.userId || undefined,
        provider: filters.provider || undefined,
        appointmentId: filters.appointmentId,
        type: filters.type || undefined,
        priority: filters.priority || undefined,
        status: filters.status || undefined,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo || undefined,
      } as ComplaintFilters;

      const result = await this.complaintRepository.findComplaintsWithFilters(
        repositoryFilters,
        {
          limit: filters.limit || 50,
          offset: filters.offset || 0,
        },
      );

      return {
        data: result.data,
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      };
    } catch (error) {
      logger.error({ error, filters }, 'Erreur getComplaints');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Créer une nouvelle réclamation
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      createValidationRule(
        0,
        z
          .object({
            title: z.string().min(1, 'Title is required'),
            type: z.enum(['QUALITY', 'DELAY', 'BILLING', 'COMMUNICATION']),
            priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
            description: z.string().min(1, 'Description is required'),
            provider: z.string().min(1, 'Provider is required'),
            appointmentId: z.string().min(1, 'Appointment ID is required'),
          })
          .passthrough(),
        'data',
      ),
    ],
  })
  @InvalidateCache('ComplaintService:*')
  async createComplaint(data: CreateComplaintData): Promise<Complaint> {
    try {
      // Générer un numéro de réclamation unique
      const number = await this.complaintRepository.generateComplaintNumber();

      // Créer la réclamation via le repository
      const complaint = await this.complaintRepository.create({
        number,
        title: data.title,
        type: data.type,
        priority: data.priority,
        status: 'OPEN',
        description: data.description,
        provider: data.provider,
        appointmentId: data.appointmentId,
        userId: data.userId,
      } as Partial<Complaint>);

      return complaint;
    } catch (error) {
      logger.error({ error, data }, 'Erreur createComplaint');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour une réclamation
   */
  @Log({ level: 'info', logArgs: true })
  @InvalidateCache('ComplaintService:*')
  async updateComplaint(
    id: string,
    data: UpdateComplaintData,
  ): Promise<Complaint> {
    try {
      const updatedComplaint = await this.complaintRepository.update(
        id,
        data as Partial<Complaint>,
      );

      if (!updatedComplaint) {
        throw new Error('Réclamation non trouvée');
      }

      return updatedComplaint;
    } catch (error) {
      logger.error({ error, id }, 'Erreur updateComplaint');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer une réclamation
   */
  @Log({ level: 'info', logArgs: true })
  @InvalidateCache('ComplaintService:*')
  async deleteComplaint(id: string): Promise<boolean> {
    try {
      return await this.complaintRepository.delete(id);
    } catch (error) {
      logger.error({ error, id }, 'Erreur deleteComplaint');
      Sentry.captureException(error);
      throw error;
    }
  }
}

// Export singleton
export const complaintService = ComplaintService.getInstance();
