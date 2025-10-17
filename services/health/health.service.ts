/**
 * Health Service - DiaspoMoney
 * Service de santé Type Doctolib Company-Grade
 * Basé sur la charte de développement
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { notificationService } from '@/services/notification/notification.service';
import * as Sentry from '@sentry/nextjs';

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
  services: HealthService[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProviderAvailability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
  timezone: string;
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string;   // HH:MM format
  isAvailable: boolean;
  maxBookings?: number;
  currentBookings?: number;
}

export interface HealthService {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  price: number;
  currency: string;
  category: 'CONSULTATION' | 'EXAMINATION' | 'TREATMENT' | 'EMERGENCY';
  isActive: boolean;
}

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string; // HH:MM format
  duration: number; // minutes
  status: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  type: 'IN_PERSON' | 'TELEMEDICINE';
  notes?: string;
  symptoms?: string[];
  diagnosis?: string;
  prescription?: Prescription;
  paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
  paymentAmount?: number;
  paymentCurrency?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  medications: Medication[];
  instructions: string;
  validUntil: Date;
  issuedAt: Date;
  issuedBy: string; // Provider ID
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
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

export interface HealthSearchFilters {
  query?: string;
  type?: string;
  specialty?: string;
  city?: string;
  country?: string;
  language?: string;
  rating?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  availability?: {
    date: Date;
    time?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
    radius: number; // km
  };
}

export class HealthService {
  private static instance: HealthService;
  
  static getInstance(): HealthService {
    if (!HealthService.instance) {
      HealthService.instance = new HealthService();
    }
    return HealthService.instance;
  }

  /**
   * Rechercher des prestataires de santé
   */
  async searchProviders(filters: HealthSearchFilters): Promise<HealthProvider[]> {
    try {
      // TODO: Implémenter la recherche avec Elasticsearch
      // const searchQuery = this.buildSearchQuery(filters);
      // const results = await elasticsearch.search(searchQuery);

      // Simulation pour l'instant
      const mockProviders: HealthProvider[] = [
        {
          id: 'provider_1',
          name: 'Dr. Marie Diallo',
          type: 'DOCTOR',
          specialties: ['Cardiologie', 'Médecine générale'],
          address: {
            street: '123 Avenue de la République',
            city: 'Dakar',
            country: 'SN',
            postalCode: '10000',
            coordinates: { latitude: 14.6928, longitude: -17.4467 }
          },
          contact: {
            phone: '+221 33 123 45 67',
            email: 'marie.diallo@health.sn',
            website: 'https://marie-diallo.sn'
          },
          languages: ['fr', 'en'],
          rating: 4.8,
          reviewCount: 156,
          isActive: true,
          availability: this.getDefaultAvailability(),
          services: [
            {
              id: 'service_1',
              name: 'Consultation générale',
              description: 'Consultation médicale générale',
              duration: 30,
              price: 15000,
              currency: 'XOF',
              category: 'CONSULTATION',
              isActive: true
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'health_providers_searched',
        value: 1,
        timestamp: new Date(),
        labels: {
          search_type: filters.type || 'all',
          has_location: filters.coordinates ? 'true' : 'false',
          has_availability: filters.availability ? 'true' : 'false'
        },
        type: 'counter'
      });

      return mockProviders;

    } catch (error) {
      console.error('Erreur searchProviders:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer un prestataire par ID
   */
  async getProvider(_providerId: string): Promise<HealthProvider | null> {
    try {
      // TODO: Récupérer depuis la base de données
      // const provider = await HealthProvider.findById(providerId);

      return null;

    } catch (error) {
      console.error('Erreur getProvider:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Vérifier la disponibilité d'un prestataire
   */
  async checkAvailability(
    _providerId: string,
    _date: Date,
    _time?: string
  ): Promise<TimeSlot[]> {
    try {
      // TODO: Vérifier la disponibilité réelle
      // const provider = await this.getProvider(providerId);
      // const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
      // const availability = provider?.availability[dayOfWeek as keyof ProviderAvailability];

      // Simulation pour l'instant
      return [
        { start: '09:00', end: '09:30', isAvailable: true, maxBookings: 1, currentBookings: 0 },
        { start: '09:30', end: '10:00', isAvailable: true, maxBookings: 1, currentBookings: 0 },
        { start: '10:00', end: '10:30', isAvailable: false, maxBookings: 1, currentBookings: 1 },
        { start: '10:30', end: '11:00', isAvailable: true, maxBookings: 1, currentBookings: 0 }
      ];

    } catch (error) {
      console.error('Erreur checkAvailability:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Prendre un rendez-vous
   */
  async bookAppointment(
    patientId: string,
    providerId: string,
    serviceId: string,
    date: Date,
    time: string,
    type: 'IN_PERSON' | 'TELEMEDICINE' = 'IN_PERSON',
    notes?: string,
    symptoms?: string[]
  ): Promise<Appointment> {
    try {
      // Vérifier la disponibilité
      const availableSlots = await this.checkAvailability(providerId, date, time);
      const requestedSlot = availableSlots.find(slot => slot.start === time);
      
      if (!requestedSlot || !requestedSlot.isAvailable) {
        throw new Error('Créneau non disponible');
      }

      // Créer le rendez-vous
      const appointment: Appointment = {
        id: `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        providerId,
        serviceId,
        date,
        time,
        duration: 30, // TODO: Récupérer depuis le service
        status: 'SCHEDULED',
        type,
        notes,
        symptoms,
        paymentStatus: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // TODO: Sauvegarder en base de données
      // await Appointment.create(appointment);

      // Envoyer une notification de confirmation
      await notificationService.sendAppointmentConfirmation(
        patientId,
        appointment,
        'fr'
      );

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'health_appointments_booked',
        value: 1,
        timestamp: new Date(),
        labels: {
          appointment_type: type,
          service_id: serviceId
        },
        type: 'counter'
      });

      return appointment;

    } catch (error) {
      console.error('Erreur bookAppointment:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Annuler un rendez-vous
   */
  async cancelAppointment(_appointmentId: string, _reason?: string): Promise<void> {
    try {
      // TODO: Récupérer et mettre à jour le rendez-vous
      // const appointment = await Appointment.findById(appointmentId);
      // if (!appointment) {
      //   throw new Error('Rendez-vous non trouvé');
      // }

      // if (appointment.status === 'COMPLETED') {
      //   throw new Error('Impossible d\'annuler un rendez-vous terminé');
      // }

      // await Appointment.updateOne(
      //   { _id: appointmentId },
      //   { 
      //     status: 'CANCELLED',
      //     cancellationReason: reason,
      //     cancelledAt: new Date(),
      //     updatedAt: new Date()
      //   }
      // );

      // Envoyer une notification d'annulation
      // await notificationService.sendAppointmentCancellation(appointment);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'health_appointments_cancelled',
        value: 1,
        timestamp: new Date(),
        type: 'counter'
      });

    } catch (error) {
      console.error('Erreur cancelAppointment:', error);
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Démarrer une téléconsultation
   */
  async startTeleconsultation(appointmentId: string): Promise<Teleconsultation> {
    try {
      // TODO: Intégrer avec Twilio Video ou similaire
      // const room = await twilio.video.rooms.create({
      //   uniqueName: `consultation_${appointmentId}`,
      //   type: 'peer-to-peer'
      // });

      const teleconsultation: Teleconsultation = {
        id: `tele_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        appointmentId,
        roomUrl: `https://video.diaspomoney.fr/room/${appointmentId}`,
        accessToken: `token_${Date.now()}`,
        status: 'WAITING',
        startedAt: new Date()
      };

      // TODO: Sauvegarder en base de données
      // await Teleconsultation.create(teleconsultation);

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'health_teleconsultations_started',
        value: 1,
        timestamp: new Date(),
        type: 'counter'
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
      // TODO: Mettre à jour la téléconsultation
      // await Teleconsultation.updateOne(
      //   { _id: teleconsultationId },
      //   {
      //     status: 'ENDED',
      //     endedAt: new Date(),
      //     duration: Math.floor((new Date().getTime() - teleconsultation.startedAt.getTime()) / 60000)
      //   }
      // );

      // Enregistrer les métriques
      monitoringManager.recordMetric({
        name: 'health_teleconsultations_ended',
        value: 1,
        timestamp: new Date(),
        type: 'counter'
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
        issuedBy
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
  private getDefaultAvailability(): ProviderAvailability {
    const defaultSlots: TimeSlot[] = [
      { start: '09:00', end: '12:00', isAvailable: true, maxBookings: 6, currentBookings: 0 },
      { start: '14:00', end: '18:00', isAvailable: true, maxBookings: 8, currentBookings: 0 }
    ];

    return {
      monday: defaultSlots,
      tuesday: defaultSlots,
      wednesday: defaultSlots,
      thursday: defaultSlots,
      friday: defaultSlots,
      saturday: [{ start: '09:00', end: '12:00', isAvailable: true, maxBookings: 3, currentBookings: 0 }],
      sunday: [],
      timezone: 'Africa/Dakar'
    };
  }
}

// Export de l'instance singleton
export const healthService = HealthService.getInstance();
