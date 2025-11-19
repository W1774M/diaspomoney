/**
 * Health Service - DiaspoMoney
 * Service de santé Type Doctolib Company-Grade
 * Basé sur la charte de développement
 *
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern (via IBookingRepository)
 * - Dependency Injection (via constructor injection)
 * - Singleton Pattern
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache, @Validate)
 * - Logger Pattern (structured logging avec childLogger)
 */

import { LOCALE, SPECIALITY_TYPES } from '@/lib/constants';
import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { childLogger } from '@/lib/logger';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import type {
  IBookingRepository,
  IHealthProviderRepository,
  IPrescriptionRepository,
  ITeleconsultationRepository,
} from '@/repositories';
import {
  getBookingRepository,
  getHealthProviderRepository,
  getPrescriptionRepository,
  getTeleconsultationRepository,
} from '@/repositories';
import { notificationService } from '@/services/notification/notification.service';
import type {
  HealthAppointment as Appointment,
  HealthProvider,
  Medication,
  Prescription,
  Teleconsultation,
  HealthProviderFilters,
} from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

class HealthService {
  private static instance: HealthService;
  private bookingRepository: IBookingRepository;
  private teleconsultationRepository: ITeleconsultationRepository;
  private prescriptionRepository: IPrescriptionRepository;
  private healthProviderRepository: IHealthProviderRepository;

  private constructor() {
    // Dependency Injection : injecter les repositories
    this.bookingRepository = getBookingRepository();
    this.teleconsultationRepository = getTeleconsultationRepository();
    this.prescriptionRepository = getPrescriptionRepository();
    this.healthProviderRepository = getHealthProviderRepository();
  }

  /**
   * Accès Singleton à l'instance du service
   */
  static getInstance() {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  /**
   * Rechercher des prestataires de santé
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Cacheable(600, { prefix: 'HealthService:searchProviders' }) // Cache 10 minutes
  async searchProviders(
    filters: HealthProviderFilters = {},
  ): Promise<HealthProvider[]> {
    const log = childLogger({ route: 'HealthService:searchProviders' });
    try {
      const result =
        await this.healthProviderRepository.findProvidersWithFilters(
          filters,
          { limit: 100, page: 1 },
        );

      log.info(
        { count: result.data.length, total: result.total, filters },
        'Health providers found',
      );

      return result.data;
    } catch (error: any) {
      log.error({ error: error?.message || error, filters }, 'Error searching providers');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Prendre un rendez-vous avec un prestataire de santé
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Patient ID is required'),
        paramName: 'patientId',
      },
      {
        paramIndex: 1,
        schema: z.string().min(1, 'Provider ID is required'),
        paramName: 'providerId',
      },
      {
        paramIndex: 2,
        schema: z.string().min(1, 'Service ID is required'),
        paramName: 'serviceId',
      },
      {
        paramIndex: 3,
        schema: z.date(),
        paramName: 'date',
      },
      {
        paramIndex: 4,
        schema: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
        paramName: 'time',
      },
      {
        paramIndex: 5,
        schema: z.number().positive('Duration must be positive'),
        paramName: 'duration',
      },
      {
        paramIndex: 6,
        schema: z.enum(['IN_PERSON', 'TELEMEDICINE']),
        paramName: 'type',
      },
    ],
  })
  @InvalidateCache('HealthService:*')
  async bookAppointment(
    patientId: string,
    providerId: string,
    serviceId: string,
    date: Date,
    time: string,
    duration: number,
    type: 'IN_PERSON' | 'TELEMEDICINE',
  ): Promise<Appointment> {
    const log = childLogger({ route: 'HealthService:bookAppointment' });
    try {
      // Créer un booking via le repository
      const booking = await this.bookingRepository.create({
        requesterId: patientId,
        providerId,
        serviceId,
        serviceType: SPECIALITY_TYPES.HEALTH,
        status: 'PENDING',
        appointmentDate: date,
        timeslot: time,
        consultationMode: type === 'TELEMEDICINE' ? 'video' : 'cabinet',
        metadata: {
          duration,
          type,
        },
      });

      // Mapper le booking vers un Appointment
      const appointmentId = booking.id || booking._id || '';
      const appointment: Appointment = {
        _id: appointmentId,
        id: appointmentId,
        userId: booking.requesterId,
        patientId: booking.requesterId,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        date: booking.appointmentDate || date,
        time: booking.timeslot || time,
        duration: (booking.metadata as any)?.['duration'] ?? duration,
        status: this.mapBookingStatusToAppointmentStatus(booking.status),
        type,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        paymentStatus: 'PENDING',
      };

      // Envoyer une notification de confirmation
      await notificationService.sendNotification({
        recipient: patientId,
        type: 'appointment_confirmation',
        template: 'appointment_confirmation',
        channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
        locale: LOCALE.DEFAULT,
        priority: 'MEDIUM',
        data: {
          appointment: appointment,
        },
      });

      log.info(
        { appointmentId: appointment._id, patientId, providerId },
        'Appointment booked successfully',
      );

      return appointment;
    } catch (error: any) {
      log.error(
        { error: error?.message || error, patientId, providerId, serviceId },
        'Error booking appointment',
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mapper le statut Booking vers Appointment
   */
  private mapBookingStatusToAppointmentStatus(
    bookingStatus: string,
  ): Appointment['status'] {
    const statusMap: Record<string, Appointment['status']> = {
      PENDING: 'SCHEDULED' as Appointment['status'],
      CONFIRMED: 'CONFIRMED' as Appointment['status'],
      COMPLETED: 'COMPLETED' as Appointment['status'],
      CANCELLED: 'CANCELLED' as Appointment['status'],
      NO_SHOW: 'NO_SHOW' as Appointment['status'],
    };
    // Handle 'IN_PROGRESS' explicitly if ever returned by repo
    return statusMap[bookingStatus] ?? ('SCHEDULED' as Appointment['status']);
  }

  /**
   * Démarre une nouvelle téléconsultation
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Appointment ID is required'),
        paramName: 'appointmentId',
      },
    ],
  })
  @InvalidateCache('HealthService:*')
  async startTeleconsultation(
    appointmentId: string,
  ): Promise<Teleconsultation> {
    const log = childLogger({ route: 'HealthService:startTeleconsultation' });
    try {
      // Vérifier que le rendez-vous existe
      const booking = await this.bookingRepository.findById(appointmentId);
      if (!booking) {
        log.warn({ appointmentId }, 'Appointment not found');
        throw new Error('Appointment not found');
      }

      // Créer la téléconsultation via le repository
      const teleconsultation = await this.teleconsultationRepository.create({
        appointmentId,
        roomUrl: `https://video.diaspomoney.fr/room/${appointmentId}`,
        accessToken: `token_${Date.now()}`,
        status: 'WAITING',
        startedAt: new Date(),
      });

      // Mettre à jour le statut du booking
      await this.bookingRepository.updateStatus(appointmentId, 'CONFIRMED');

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'health_teleconsultations_started',
        value: 1,
        timestamp: new Date(),
        type: 'counter',
      });

      log.info(
        { teleconsultationId: teleconsultation.id, appointmentId },
        'Teleconsultation started',
      );

      return teleconsultation;
    } catch (error: any) {
      log.error({ error: error?.message || error, appointmentId }, 'Error starting teleconsultation');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Terminer une téléconsultation
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Teleconsultation ID is required'),
        paramName: 'teleconsultationId',
      },
      {
        paramIndex: 1,
        schema: z.string().min(1, 'Appointment ID is required'),
        paramName: 'appointmentId',
      },
    ],
  })
  @InvalidateCache('HealthService:*')
  async endTeleconsultation(teleconsultationId: string): Promise<void> {
    const log = childLogger({ route: 'HealthService:endTeleconsultation' });
    try {
      const endedTeleconsultation =
        await this.teleconsultationRepository.endTeleconsultation(
          teleconsultationId,
        );

      if (!endedTeleconsultation) {
        log.warn({ teleconsultationId }, 'Teleconsultation not found');
        throw new Error('Teleconsultation not found');
      }

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'health_teleconsultations_ended',
        value: 1,
        timestamp: new Date(),
        type: 'counter',
      });

      log.info({ teleconsultationId }, 'Teleconsultation ended');
    } catch (error: any) {
      log.error({ error: error?.message || error, teleconsultationId }, 'Error ending teleconsultation');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Créer une ordonnance
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Appointment ID is required'),
        paramName: 'appointmentId',
      },
      {
        paramIndex: 1,
        schema: z.array(
          z.object({
            name: z.string().min(1),
            dosage: z.string().min(1),
            frequency: z.string().min(1),
            duration: z.string().min(1),
          }),
        ),
        paramName: 'medications',
      },
      {
        paramIndex: 2,
        schema: z.string().min(1, 'Instructions are required'),
        paramName: 'instructions',
      },
      {
        paramIndex: 3,
        schema: z.date(),
        paramName: 'validUntil',
      },
      {
        paramIndex: 4,
        schema: z.string().min(1, 'Issued by is required'),
        paramName: 'issuedBy',
      },
    ],
  })
  @InvalidateCache('HealthService:*')
  async createPrescription(
    appointmentId: string,
    medications: Medication[],
    instructions: string,
    validUntil: Date,
    issuedBy: string,
  ): Promise<Prescription> {
    const log = childLogger({ route: 'HealthService:createPrescription' });
    try {
      // Vérifier que le rendez-vous existe
      const booking = await this.bookingRepository.findById(appointmentId);
      if (!booking) {
        log.warn({ appointmentId }, 'Appointment not found');
        throw new Error('Appointment not found');
      }

      // Créer l'ordonnance via le repository
      const prescription = await this.prescriptionRepository.create({
        appointmentId,
        medications,
        instructions,
        validUntil,
        issuedAt: new Date(),
        issuedBy,
      });

      // Envoyer une notification avec l'ordonnance
      await notificationService.sendNotification({
        recipient: booking.requesterId,
        type: 'prescription_created',
        template: 'prescription_created',
        channels: [{ type: 'EMAIL', enabled: true, priority: 'MEDIUM' }],
        locale: LOCALE.DEFAULT,
        priority: 'MEDIUM',
        data: {
          prescription: prescription,
        },
      });

      log.info(
        { prescriptionId: prescription.id, appointmentId },
        'Prescription created successfully',
      );

      return prescription;
    } catch (error: any) {
      log.error({ error: error?.message || error, appointmentId }, 'Error creating prescription');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les rendez-vous d'un patient
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Cacheable(300, { prefix: 'HealthService:getPatientAppointments' }) // Cache 5 minutes
  async getPatientAppointments(
    patientId: string,
    status?: string,
    dateFrom?: Date,
    dateTo?: Date,
  ): Promise<Appointment[]> {
    const log = childLogger({ route: 'HealthService:getPatientAppointments' });
    try {
      const filters: Record<string, any> = {
        requesterId: patientId,
        serviceType: SPECIALITY_TYPES.HEALTH,
      };

      if (status) {
        filters['status'] = this.mapAppointmentStatusToBookingStatus(
          status as Appointment['status'],
        );
      }

      if (dateFrom) {
        filters['dateFrom'] = dateFrom;
      }

      if (dateTo) {
        filters['dateTo'] = dateTo;
      }

      const result = await this.bookingRepository.findBookingsWithFilters(
        filters,
          { limit: 1000, page: 1 }, // Limite élevée pour récupérer tous les rendez-vous
      );

      // Mapper les bookings vers des appointments
      const appointments: Appointment[] = result.data.map(booking => ({
        _id: booking._id || booking.id,
        id: booking.id,
        userId: booking.requesterId,
        patientId: booking.requesterId,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        date: booking.appointmentDate || new Date(),
        time: booking.timeslot || '',
        duration: (booking.metadata as any)?.['duration'] ?? 30,
        status: this.mapBookingStatusToAppointmentStatus(booking.status),
        type:
          booking.consultationMode === 'video' ? 'TELEMEDICINE' : 'IN_PERSON',
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        paymentStatus: 'PENDING',
      }));

      log.info(
        { patientId, count: appointments.length },
        'Patient appointments retrieved successfully',
      );

      return appointments;
    } catch (error: any) {
      log.error({ error: error?.message || error, patientId }, 'Error getting patient appointments');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mapper le statut Appointment vers Booking
   */
  private mapAppointmentStatusToBookingStatus(
    appointmentStatus: Appointment['status'],
  ): string {
    // Handle IN_PROGRESS explicitly
    if (appointmentStatus === 'IN_PROGRESS') {
      return 'CONFIRMED';
    }
    const statusMap: Partial<Record<Exclude<Appointment['status'], 'IN_PROGRESS'>, string>> = {
      SCHEDULED: 'PENDING',
      CONFIRMED: 'CONFIRMED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      NO_SHOW: 'NO_SHOW',
    };
    // Default to 'PENDING', not to undefined
    return statusMap[appointmentStatus as Exclude<Appointment['status'], 'IN_PROGRESS'>] ?? 'PENDING';
  }

  // Les méthodes/commentaires inutilisés ont été volontairement laissés en commentaire pour référence.
}

// Export de l'instance singleton
export const healthService = HealthService.getInstance();
