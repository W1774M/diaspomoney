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

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import { Validate, ValidationRule } from '@/lib/decorators/validate.decorator';
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
import type { HealthProviderFilters } from '@/types/health';
import {
  Appointment,
  HealthProvider,
  Medication,
  Prescription,
  Teleconsultation,
} from '@/types/health';
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
    filters: HealthProviderFilters = {}
  ): Promise<HealthProvider[]> {
    const log = childLogger({ route: 'HealthService:searchProviders' });
    try {
      // Rechercher les providers via le repository
      const result =
        await this.healthProviderRepository.findProvidersWithFilters(
          filters,
          { limit: 100 } // Limite par défaut pour la recherche
        );

      log.info(
        { count: result.data.length, total: result.total, filters },
        'Health providers found'
      );

      return result.data;
    } catch (error) {
      log.error({ error, filters }, 'Error searching providers');
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
      ValidationRule(
        0,
        z.string().min(1, 'Patient ID is required'),
        'patientId'
      ),
      ValidationRule(
        1,
        z.string().min(1, 'Provider ID is required'),
        'providerId'
      ),
      ValidationRule(
        2,
        z.string().min(1, 'Service ID is required'),
        'serviceId'
      ),
      ValidationRule(3, z.date(), 'date'),
      ValidationRule(
        4,
        z
          .string()
          .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
        'time'
      ),
      ValidationRule(
        5,
        z.number().positive('Duration must be positive'),
        'duration'
      ),
      ValidationRule(6, z.enum(['IN_PERSON', 'TELEMEDICINE']), 'type'),
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
    type: 'IN_PERSON' | 'TELEMEDICINE'
  ): Promise<Appointment> {
    const log = childLogger({ route: 'HealthService:bookAppointment' });
    try {
      // Créer un booking via le repository
      const booking = await this.bookingRepository.create({
        requesterId: patientId,
        providerId,
        serviceId,
        serviceType: 'HEALTH',
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
      const appointment: Appointment = {
        id: booking.id,
        patientId: booking.requesterId,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        date: booking.appointmentDate || date,
        time: booking.timeslot || time,
        duration,
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
        locale: 'fr',
        priority: 'MEDIUM',
        data: {
          appointment: appointment,
        },
      });

      log.info(
        { appointmentId: appointment.id, patientId, providerId },
        'Appointment booked successfully'
      );

      return appointment;
    } catch (error) {
      log.error(
        { error, patientId, providerId, serviceId },
        'Error booking appointment'
      );
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mapper le statut Booking vers Appointment
   */
  private mapBookingStatusToAppointmentStatus(
    bookingStatus: string
  ): Appointment['status'] {
    const statusMap: Record<string, Appointment['status']> = {
      PENDING: 'SCHEDULED',
      CONFIRMED: 'CONFIRMED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      NO_SHOW: 'NO_SHOW',
    };
    return statusMap[bookingStatus] || 'SCHEDULED';
  }

  /**
   * Démarre une nouvelle téléconsultation
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      ValidationRule(
        0,
        z.string().min(1, 'Appointment ID is required'),
        'appointmentId'
      ),
    ],
  })
  @InvalidateCache('HealthService:*')
  async startTeleconsultation(
    appointmentId: string
  ): Promise<Teleconsultation> {
    const log = childLogger({ route: 'HealthService:startTeleconsultation' });
    try {
      // Vérifier que le rendez-vous existe
      const booking = await this.bookingRepository.findById(appointmentId);
      if (!booking) {
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
        'Teleconsultation started'
      );

      return teleconsultation;
    } catch (error) {
      log.error({ error, appointmentId }, 'Error starting teleconsultation');
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
      ValidationRule(
        0,
        z.string().min(1, 'Teleconsultation ID is required'),
        'teleconsultationId'
      ),
    ],
  })
  @InvalidateCache('HealthService:*')
  async endTeleconsultation(teleconsultationId: string): Promise<void> {
    const log = childLogger({ route: 'HealthService:endTeleconsultation' });
    try {
      // Terminer la téléconsultation via le repository
      // Le repository calcule automatiquement la durée à partir de startedAt
      const endedTeleconsultation =
        await this.teleconsultationRepository.endTeleconsultation(
          teleconsultationId
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
    } catch (error) {
      log.error({ error, teleconsultationId }, 'Error ending teleconsultation');
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
      ValidationRule(
        0,
        z.string().min(1, 'Appointment ID is required'),
        'appointmentId'
      ),
      ValidationRule(
        1,
        z.array(
          z.object({
            name: z.string().min(1),
            dosage: z.string().min(1),
            frequency: z.string().min(1),
            duration: z.string().min(1),
          })
        ),
        'medications'
      ),
      ValidationRule(
        2,
        z.string().min(1, 'Instructions are required'),
        'instructions'
      ),
      ValidationRule(3, z.date(), 'validUntil'),
      ValidationRule(4, z.string().min(1, 'Issued by is required'), 'issuedBy'),
    ],
  })
  @InvalidateCache('HealthService:*')
  async createPrescription(
    appointmentId: string,
    medications: Medication[],
    instructions: string,
    validUntil: Date,
    issuedBy: string
  ): Promise<Prescription> {
    const log = childLogger({ route: 'HealthService:createPrescription' });
    try {
      // Vérifier que le rendez-vous existe
      const booking = await this.bookingRepository.findById(appointmentId);
      if (!booking) {
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
        locale: 'fr',
        priority: 'MEDIUM',
        data: {
          prescription: prescription,
        },
      });

      log.info(
        { prescriptionId: prescription.id, appointmentId },
        'Prescription created successfully'
      );

      return prescription;
    } catch (error) {
      log.error({ error, appointmentId }, 'Error creating prescription');
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
    dateTo?: Date
  ): Promise<Appointment[]> {
    const log = childLogger({ route: 'HealthService:getPatientAppointments' });
    try {
      // Construire les filtres pour le repository
      const filters: Record<string, any> = {
        requesterId: patientId,
        serviceType: 'HEALTH',
      };

      if (status) {
        filters['status'] = this.mapAppointmentStatusToBookingStatus(
          status as Appointment['status']
        );
      }

      if (dateFrom) {
        filters['dateFrom'] = dateFrom;
      }

      if (dateTo) {
        filters['dateTo'] = dateTo;
      }

      // Récupérer les bookings via le repository
      const result = await this.bookingRepository.findBookingsWithFilters(
        filters,
        { limit: 1000 } // Limite élevée pour récupérer tous les rendez-vous
      );

      // Mapper les bookings vers des appointments
      const appointments: Appointment[] = result.data.map(booking => ({
        id: booking.id,
        patientId: booking.requesterId,
        providerId: booking.providerId,
        serviceId: booking.serviceId,
        date: booking.appointmentDate || new Date(),
        time: booking.timeslot || '',
        duration: booking.metadata?.['duration'] || 30,
        status: this.mapBookingStatusToAppointmentStatus(booking.status),
        type:
          booking.consultationMode === 'video' ? 'TELEMEDICINE' : 'IN_PERSON',
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        paymentStatus: 'PENDING',
      }));

      log.info(
        { patientId, count: appointments.length },
        'Patient appointments retrieved successfully'
      );

      return appointments;
    } catch (error) {
      log.error({ error, patientId }, 'Error getting patient appointments');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mapper le statut Appointment vers Booking
   */
  private mapAppointmentStatusToBookingStatus(
    appointmentStatus: Appointment['status']
  ): string {
    const statusMap: Record<Appointment['status'], string> = {
      SCHEDULED: 'PENDING',
      CONFIRMED: 'CONFIRMED',
      IN_PROGRESS: 'CONFIRMED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      NO_SHOW: 'NO_SHOW',
    };
    return statusMap[appointmentStatus] || 'PENDING';
  }

  /**
   * Obtenir la disponibilité par défaut
   */
  // private _getDefaultAvailability(): ProviderAvailability {
  //   const defaultSlots: TimeSlot[] = [
  //     {
  //       start: '09:00',
  //       end: '12:00',
  //       isAvailable: true,
  //       maxBookings: 6,
  //       currentBookings: 0,
  //     },
  //     {
  //       start: '14:00',
  //       end: '18:00',
  //       isAvailable: true,
  //       maxBookings: 8,
  //       currentBookings: 0,
  //     },
  //   ];

  //   return {
  //     monday: defaultSlots,
  //     tuesday: defaultSlots,
  //     wednesday: defaultSlots,
  //     thursday: defaultSlots,
  //     friday: defaultSlots,
  //     saturday: [
  //       {
  //         start: '09:00',
  //         end: '12:00',
  //         isAvailable: true,
  //         maxBookings: 3,
  //         currentBookings: 0,
  //       },
  //     ],
  //     sunday: [],
  //     timezone: 'Africa/Dakar',
  //   };
  // }
}

// Export de l'instance singleton
export const healthService = HealthService.getInstance();
