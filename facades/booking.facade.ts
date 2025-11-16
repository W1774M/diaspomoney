/**
 * Booking Facade - DiaspoMoney
 * 
 * Facade Pattern pour simplifier le processus de réservation complet
 * Orchestre BookingService, PaymentFacade, TransactionService et NotificationService
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate, ValidationRule } from '@/lib/decorators/validate.decorator';
import { logger } from '@/lib/logger';
import { Booking } from '@/repositories';
import { BookingData, bookingService } from '@/services/booking/booking.service';
import { notificationService } from '@/services/notification/notification.service';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { paymentFacade, PaymentFacadeData, PaymentFacadeResult } from './payment.facade';

export interface BookingFacadeData {
  requesterId: string;
  providerId: string;
  serviceId: string;
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';
  appointmentDate: Date;
  timeslot?: string;
  consultationMode?: 'IN_PERSON' | 'TELEMEDICINE' | 'HYBRID';
  recipient?: string;
  
  // Données de paiement
  payment?: {
    amount: number;
    currency: string;
    paymentMethodId: string;
    createInvoice?: boolean;
  };
  
  metadata?: Record<string, string>;
}

export interface BookingFacadeResult {
  success: boolean;
  booking?: Booking;
  paymentResult?: {
    success: boolean;
    paymentIntentId?: string;
    transactionId?: string;
    invoiceId?: string;
    requiresAction?: boolean;
    nextAction?: {
      type: string;
      url: string;
    };
  };
  error?: string;
}

/**
 * BookingFacade - Facade pour le processus de réservation complet
 */
export class BookingFacade {
  private static instance: BookingFacade;

  private constructor() {}

  static getInstance(): BookingFacade {
    if (!BookingFacade.instance) {
      BookingFacade.instance = new BookingFacade();
    }
    return BookingFacade.instance;
  }

  /**
   * Créer une réservation complète avec paiement optionnel
   * 
   * Étapes :
   * 1. Créer la réservation
   * 2. Traiter le paiement (si fourni)
   * 3. Envoyer les notifications de confirmation
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      ValidationRule(0, z.object({
        requesterId: z.string().min(1, 'Requester ID is required'),
        providerId: z.string().min(1, 'Provider ID is required'),
        serviceId: z.string().min(1, 'Service ID is required'),
        serviceType: z.enum(['HEALTH', 'BTP', 'EDUCATION']),
        appointmentDate: z.date(),
      }).passthrough(), 'data'),
    ],
  })
  async createBookingWithPayment(data: BookingFacadeData): Promise<BookingFacadeResult> {
    try {
      logger.info({
        requesterId: data.requesterId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        serviceType: data.serviceType,
        hasPayment: !!data.payment,
      }, 'Creating booking via BookingFacade');

      // Étape 1: Créer la réservation
      const booking = await bookingService.createBooking({
        requesterId: data.requesterId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        serviceType: data.serviceType,
        appointmentDate: data.appointmentDate,
        timeslot: data.timeslot as string | undefined,
        consultationMode: data.consultationMode as 'video' | 'cabinet' | undefined,
        recipient: data.recipient as Booking['recipient'] | undefined,
        metadata: data.metadata as Record<string, string> | undefined,
      } as BookingData);

      let paymentResult;

      // Étape 2: Traiter le paiement si fourni
      if (data.payment) {
        try {
          const paymentData: PaymentFacadeData = {
            amount: data.payment.amount,
            currency: data.payment.currency,
            customerId: data.requesterId,
            paymentMethodId: data.payment.paymentMethodId,
            payerId: data.requesterId,
            beneficiaryId: data.providerId,
            serviceType: data.serviceType,
            serviceId: data.serviceId,
            description: `Payment for booking ${booking.id || booking._id?.toString()}`,
            metadata: {
              ...data.metadata,
              bookingId: booking.id || booking._id?.toString() || '',
            },
            createInvoice: data.payment.createInvoice !== false,
            sendNotification: false, // On enverra une notification combinée après
          };

          paymentResult = await paymentFacade.processPayment(paymentData);

          // Si le paiement nécessite une action (3D Secure, etc.)
          if (paymentResult.requiresAction) {
            // Mettre à jour le statut de la réservation
            await bookingService.updateBookingStatus(
              booking.id || booking._id?.toString() || '',
              'PENDING'
            );

            return {
              success: true,
              booking,
              paymentResult,
            };
          }

          // Si le paiement a échoué, mettre à jour le statut
          if (!paymentResult.success) {
            await bookingService.updateBookingStatus(
              booking.id || booking._id?.toString() || '',
              'FAILED'
            );

            return {
              success: false,
              booking,
              paymentResult,
              error: paymentResult.error || 'Payment failed',
            };
          }

          // Paiement réussi, mettre à jour le statut
          await bookingService.updateBookingStatus(
            booking.id || booking._id?.toString() || '',
            'CONFIRMED'
          );
        } catch (paymentError: any) {
          logger.error({ error: paymentError }, 'Payment processing failed in BookingFacade');
          
          // Mettre à jour le statut de la réservation
          const bookingId = booking.id || (booking as any)._id?.toString() || '';
          await bookingService.updateBookingStatus(
            bookingId,
            'FAILED'
          );

          paymentResult = {
            success: false,
            error: paymentError.message || 'Payment processing failed',
          };
        }
      }

      // Étape 3: Envoyer les notifications de confirmation
      try {
        await notificationService.sendNotification({
          recipient: data.requesterId,
          type: 'BOOKING_CONFIRMED',
          template: 'booking_confirmation',
          channels: [
            { type: 'EMAIL', enabled: true, priority: 'HIGH' },
            { type: 'IN_APP', enabled: true, priority: 'MEDIUM' },
          ],
          locale: 'fr',
          priority: 'HIGH',
          data: {
            booking: {
              id: booking.id || (booking as any)._id?.toString(),
              providerId: data.providerId,
              serviceId: data.serviceId,
              appointmentDate: data.appointmentDate,
              timeslot: data.timeslot,
            },
            payment: paymentResult?.success ? {
              transactionId: paymentResult.transactionId,
              amount: data.payment?.amount,
              currency: data.payment?.currency,
            } : undefined,
          },
        });

        // Notifier aussi le prestataire
        await notificationService.sendNotification({
          recipient: data.providerId,
          type: 'BOOKING_RECEIVED',
          template: 'booking_received',
          channels: [
            { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
            { type: 'IN_APP', enabled: true, priority: 'HIGH' },
          ],
          locale: 'fr',
          priority: 'MEDIUM',
          data: {
            booking: {
              id: booking.id || (booking as any)._id?.toString(),
              requesterId: data.requesterId,
              appointmentDate: data.appointmentDate,
              timeslot: data.timeslot,
            },
          },
        });
      } catch (notificationError) {
        // Ne pas faire échouer la réservation si la notification échoue
        logger.error({ error: notificationError }, 'Failed to send booking notifications');
      }

      logger.info({
        bookingId: booking.id || (booking as any)._id?.toString(),
        paymentSuccess: paymentResult?.success,
      }, 'Booking created successfully via BookingFacade');

      return {
        success: true,
        booking,
        paymentResult: paymentResult as PaymentFacadeResult,
      } as BookingFacadeResult;
    } catch (error: any) {
      logger.error({
        error,
        data: {
          requesterId: data.requesterId,
          providerId: data.providerId,
          serviceId: data.serviceId,
        },
      }, 'Error creating booking via BookingFacade');

      Sentry.captureException(error, {
        extra: {
          bookingData: {
            requesterId: data.requesterId,
            providerId: data.providerId,
            serviceId: data.serviceId,
            serviceType: data.serviceType,
          },
        },
      });

      return {
        success: false,
        error: error.message || 'Erreur lors de la création de la réservation',
      };
    }
  }

  /**
   * Créer une réservation sans paiement (gratuite ou paiement différé)
   */
  async createBookingWithoutPayment(data: Omit<BookingFacadeData, 'payment'>): Promise<BookingFacadeResult> {
    return this.createBookingWithPayment({
      ...data,
      payment: undefined as any,
    });
  }
}

// Export de l'instance singleton
export const bookingFacade = BookingFacade.getInstance();

