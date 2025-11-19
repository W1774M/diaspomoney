/**
 * Types et interfaces pour le service de santé
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

export interface Prescription extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id: string;
  appointmentId: string;
  medications: Medication[];
  instructions: string;
  validUntil: Date;
  issuedAt: Date;
  issuedBy: string;
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
  [key: string]: any;
}

import { BaseEntity } from './index';

export interface HealthProvider extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
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

export interface Appointment extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id: string;
  userId: string; // Alias pour patientId
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

export interface Teleconsultation extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id: string;
  appointmentId: string;
  roomUrl: string;
  accessToken: string;
  status: 'WAITING' | 'ACTIVE' | 'ENDED';
  startedAt?: Date;
  endedAt?: Date;
  duration?: number; // minutes
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
  [key: string]: any;
}

export interface HealthProviderFilters {
  type?: 'DOCTOR' | 'HOSPITAL' | 'PHARMACY' | 'CLINIC';
  specialties?: string[];
  city?: string;
  country?: string;
  languages?: string[];
  isActive?: boolean;
  minRating?: number;
}

export interface AppointmentFilters {
  patientId?: string;
  providerId?: string;
  serviceId?: string;
  status?: Appointment['status'];
  type?: 'IN_PERSON' | 'TELEMEDICINE';
  dateFrom?: Date;
  dateTo?: Date;
}

export interface HealthService {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  category: 'CONSULTATION' | 'TREATMENT' | 'EMERGENCY';
  isActive: boolean;
  searchProviders: () => Promise<any[]>;
  getProvider: (id: string) => Promise<any>;
  checkAvailability: (providerId: string, date: Date) => Promise<boolean>;
  bookAppointment: (data: any) => Promise<any>;
  cancelAppointment: (id: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: Date) => Promise<void>;
  getAppointmentHistory: (patientId: string) => Promise<any[]>;
  getProviderSchedule: (providerId: string) => Promise<any[]>;
  sendReminder: (appointmentId: string) => Promise<void>;
}