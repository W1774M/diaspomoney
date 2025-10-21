/**
 * Health Service - DiaspoMoney
 * Service de santé Type Doctolib Company-Grade
 * Basé sur la charte de développement
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { notificationService } from '@/services/notification/notification.service';
import * as Sentry from '@sentry/nextjs';

/**
 * Types et Interfaces complémentaires
 */
export interface ProviderAvailability {
  [weekday: string]: TimeSlot[] | string; // pour timezone
}

export interface TimeSlot {
  start: string; // "09:00"
  end: string; // "12:00"
  isAvailable: boolean;
  maxBookings: number;
  currentBookings: number;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  medications: Medication[];
  instructions: string;
  validUntil: Date;
  issuedAt: Date;
  issuedBy: string;
}

export interface HealthProvider {
  id: string;
  name: string;
  type: 'DOCTOR' | 'HOSPITAL' | 'PHARMACY' | 'CLINIC';
  specialties: string[];
  address: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  languages: string[];
  rating: number;
  reviewCount: number;
  isActive: boolean;
  availability: ProviderAvailability;
  services: any[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string; // HH:MM format
  duration: number; // minutes
  status:
    | 'SCHEDULED'
    | 'CONFIRMED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'NO_SHOW';
  type: 'IN_PERSON' | 'TELEMEDICINE';
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: any;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentAmount?: number;
  paymentCurrency?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Teleconsultation {
  id: string;
  appointmentId: string;
  roomUrl: string;
  accessToken: string;
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // minutes
}

// interface NotificationData {
//   recipient: string;
//   type: string;
//   data?: any;
//   template?: string;
//   channels?: string[];
//   locale?: string;
//   priority?: string;
// }

class HealthService {
  private static instance: HealthService;

  private constructor() {}

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
  async searchProviders(_filters: any): Promise<HealthProvider[]> {
    try {
      // TODO: intégrer filtre & base de données
      // Par défaut retourne []
      return [];
    } catch (error) {
      console.error('Erreur searchProviders:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Prendre un rendez-vous avec un prestataire de santé
   */
  async bookAppointment(
    patientId: string,
    providerId: string,
    serviceId: string,
    date: Date,
    time: string,
    duration: number,
    type: 'IN_PERSON' | 'TELEMEDICINE'
  ): Promise<Appointment> {
    try {
      // TODO: Ajouter vérification & logique de database
      const appointment: Appointment = {
        id: `appt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        providerId,
        serviceId,
        date,
        time,
        duration,
        status: 'SCHEDULED',
        type,
        createdAt: new Date(),
        updatedAt: new Date(),
        paymentStatus: 'PENDING',
      };

      // Envoyer une notification de confirmation
      // const _notificationPayload: NotificationData = {
      //   recipient: patientId,
      //   type: 'appointment_confirmation',
      //   template: 'appointment_confirmation',
      //   channels: ['email'],
      //   locale: 'fr',
      //   priority: 'normal',
      //   data: {
      //     appointment: appointment,
      //   },
      // };

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

      return appointment;
    } catch (error) {
      console.error('Erreur bookAppointment:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Démarre une nouvelle téléconsultation
   */
  async startTeleconsultation(
    appointmentId: string
  ): Promise<Teleconsultation> {
    try {
      const teleconsultation: Teleconsultation = {
        id: `tele_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        appointmentId,
        roomUrl: `https://video.diaspomoney.fr/room/${appointmentId}`,
        accessToken: `token_${Date.now()}`,
        status: 'WAITING',
        startedAt: new Date(),
      };

      // TODO: Sauvegarder en base de données
      // await Teleconsultation.create(teleconsultation);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'health_teleconsultations_started',
        value: 1,
        timestamp: new Date(),
        type: 'counter',
      });

      return teleconsultation;
    } catch (error) {
      console.error('Erreur startTeleconsultation:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Terminer une téléconsultation
   */
  async endTeleconsultation(_teleconsultationId: string): Promise<void> {
    try {
      // TODO: Mettre à jour la téléconsultation (status, endedAt, duration)
      // await Teleconsultation.updateOne(
      //   { _id: teleconsultationId },
      //   {
      //     status: 'ENDED',
      //     endedAt: new Date(),
      //     duration: ... // calcul à partir de startedAt
      //   }
      // );

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'health_teleconsultations_ended',
        value: 1,
        timestamp: new Date(),
        type: 'counter',
      });
    } catch (error) {
      console.error('Erreur endTeleconsultation:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Créer une ordonnance
   */
  async createPrescription(
    appointmentId: string,
    medications: Medication[],
    instructions: string,
    validUntil: Date,
    issuedBy: string
  ): Promise<Prescription> {
    try {
      const prescription: Prescription = {
        id: `presc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        appointmentId,
        medications,
        instructions,
        validUntil,
        issuedAt: new Date(),
        issuedBy,
      };

      // TODO: Sauvegarder en base de données
      // await Prescription.create(prescription);

      // Envoyer une notification avec l'ordonnance
      // await notificationService.sendPrescriptionNotification(prescription);

      return prescription;
    } catch (error) {
      console.error('Erreur createPrescription:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les rendez-vous d'un patient
   */
  async getPatientAppointments(
    _patientId: string,
    _status?: string,
    _dateFrom?: Date,
    _dateTo?: Date
  ): Promise<Appointment[]> {
    try {
      // TODO: Récupérer depuis la base de données avec filtres
      // const query: any = { patientId };
      // if (status) query.status = status;
      // if (dateFrom) query.date = { $gte: dateFrom };
      // if (dateTo) query.date = { $lte: dateTo };

      // const appointments = await Appointment.find(query)
      //   .populate('providerId')
      //   .populate('serviceId')
      //   .sort({ date: 1 });

      // Simulation pour l'instant
      return [];
    } catch (error) {
      console.error('Erreur getPatientAppointments:', error);
      Sentry.captureException(error);
      throw error;
    }
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

