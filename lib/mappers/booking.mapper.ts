/**
 * Mappers pour les réservations/bookings
 * Transforme les documents booking en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
import type { Booking } from '@/repositories/interfaces/IBookingRepository';
import { BOOKING_STATUSES } from '@/lib/constants';

/**
 * Type pour un document Booking MongoDB
 */
export interface BookingDocument {
  _id?: any;
  id?: string;
  reservationNumber?: string;
  requesterId?: string;
  userId?: string;
  providerId?: string;
  serviceId?: string;
  serviceType?: 'HEALTH' | 'BTP' | 'EDUCATION';
  status?: string;
  appointmentDate?: Date | string;
  timeslot?: string;
  consultationMode?: 'video' | 'cabinet';
  recipient?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  beneficiary?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de booking
 */
export interface BookingResponse {
  id: string;
  _id: string;
  reservationNumber: string;
  requesterId: string;
  providerId: string;
  serviceId: string;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  status: Booking['status'];
  appointmentDate?: string;
  timeslot?: string;
  consultationMode?: 'video' | 'cabinet';
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
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
 * Mappe le statut depuis le format MongoDB vers le format Booking
 */
function mapStatus(status: string | undefined): Booking['status'] {
  if (!status) return BOOKING_STATUSES.PENDING;
  
  const statusMap: Record<string, Booking['status']> = {
    pending: BOOKING_STATUSES.PENDING,
    confirmed: BOOKING_STATUSES.CONFIRMED,
    in_progress: BOOKING_STATUSES.IN_PROGRESS,
    cancelled: BOOKING_STATUSES.CANCELLED,
    completed: BOOKING_STATUSES.COMPLETED,
    no_show: BOOKING_STATUSES.NO_SHOW,
  };
  
  const normalizedStatus = status.toLowerCase();
  return statusMap[normalizedStatus] || BOOKING_STATUSES.PENDING;
}

/**
 * Classe BookingMapper implémentant IMapper
 */
export class BookingMapper implements IMapper<BookingDocument, BookingResponse> {
  /**
   * Transforme un document booking vers une réponse API
   */
  map(input: BookingDocument, options?: MappingOptions): BookingResponse {
    return mapBookingToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents booking
   */
  mapMany(inputs: BookingDocument[], options?: MappingOptions): BookingResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const bookingMapper = new BookingMapper();

/**
 * Mappe un document booking vers une réponse API
 * 
 * @param bookingDoc - Document booking depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapBookingToResponse(
  bookingDoc: BookingDocument,
  _options?: MappingOptions,
): BookingResponse {
  // Extraire l'ID
  const id = bookingDoc.id || bookingDoc._id?.toString() || '';
  const _id = bookingDoc._id?.toString() || id;

  // Mapper le statut
  const status = mapStatus(bookingDoc.status);

  // Mapper le recipient
  const recipient = bookingDoc.recipient || bookingDoc.beneficiary;
  const mappedRecipient = recipient
    ? {
        firstName: recipient.firstName || '',
        lastName: recipient.lastName || '',
        phone: recipient.phone || '',
        ...(recipient.email && { email: recipient.email }),
      }
    : undefined;

  const response: BookingResponse = {
    id,
    _id,
    reservationNumber: bookingDoc.reservationNumber || '',
    requesterId: bookingDoc.requesterId || bookingDoc.userId || '',
    providerId: bookingDoc.providerId || '',
    serviceId: bookingDoc.serviceId || '',
    serviceType: bookingDoc.serviceType || 'HEALTH',
    status,
    ...(bookingDoc.metadata && { metadata: bookingDoc.metadata }),
    createdAt: toISOString(bookingDoc.createdAt) || '',
    updatedAt: toISOString(bookingDoc.updatedAt) || '',
  };
  
  // Ajouter les propriétés optionnelles seulement si elles existent
  if (bookingDoc.appointmentDate) {
    const dateStr = toISOString(bookingDoc.appointmentDate);
    if (dateStr) response.appointmentDate = dateStr;
  }
  if (bookingDoc.timeslot) {
    response.timeslot = bookingDoc.timeslot;
  }
  if (bookingDoc.consultationMode) {
    response.consultationMode = bookingDoc.consultationMode;
  }
  if (mappedRecipient) {
    response.recipient = mappedRecipient;
  }
  
  return response;
}

