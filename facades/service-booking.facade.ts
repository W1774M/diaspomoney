/**
 * Service Booking Facade - DiaspoMoney
 *
 * Facade Pattern pour simplifier le processus de réservation de service complet
 * Orchestre BookingService, PaymentFacade, et NotificationService
 *
 * Étapes du processus :
 * 1. Sélection du type de service (santé/éducation/BTP)
 * 2. Remplissage des informations (client + bénéficiaire)
 * 3. Sélection du service spécifique
 * 4. Ajout d'options supplémentaires
 * 5. Paiement via Stripe
 * 6. Sélection des disponibilités
 * 7. Confirmation et suivi
 */

import { Log } from '@/lib/decorators/log.decorator';
import { Validate } from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { Transaction } from '@/lib/decorators/transaction.decorator';
import { logger } from '@/lib/logger';
import { CURRENCIES, LANGUAGES, BOOKING_STATUSES } from '@/lib/constants';
import { notificationService } from '@/services/notification/notification.service';
import { transactionService } from '@/services/transaction/transaction.service';
import { invoiceService } from '@/services/invoice/invoice.service';
import { PaymentService } from '@/services/payment/payment.service.strategy';
import { bookingService } from '@/services/booking/booking.service';
import { bookingMapper } from '@/lib/mappers';
import { paymentFacade } from './payment.facade';
import type {
  IFacade,
  FacadeOptions,
  BookingFacadeData,
  BookingFacadeResult,
  BookingData,
  PaymentFacadeData,
  PaymentFacadeResult,
} from '@/lib/types';
import type {
  ServiceBookingFacadeData,
  ServiceBookingFacadeResult,
  ServiceType,
} from '@/lib/types/service-booking.types';
import { ServiceBookingFacadeDataSchema } from '@/lib/validations/service-booking.schema';
import * as Sentry from '@sentry/nextjs';

/**
 * ServiceBookingFacade - Facade pour le processus de réservation de service complet
 */
export class ServiceBookingFacade
  implements IFacade<ServiceBookingFacadeData, ServiceBookingFacadeResult>
{
  private static instance: ServiceBookingFacade;
  private paymentService: PaymentService;

  private constructor() {
    this.paymentService = PaymentService.getInstance();
  }

  static getInstance(): ServiceBookingFacade {
    if (!ServiceBookingFacade.instance) {
      ServiceBookingFacade.instance = new ServiceBookingFacade();
    }
    return ServiceBookingFacade.instance;
  }

  /**
   * Exécuter la facade (implémentation de IFacade)
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: ServiceBookingFacadeDataSchema,
        paramName: 'data',
      },
    ],
  })
  async execute(
    data: ServiceBookingFacadeData,
    _options?: FacadeOptions,
  ): Promise<ServiceBookingFacadeResult> {
    return this.createServiceBooking(data);
  }

  /**
   * Créer une réservation de service complète
   *
   * Étapes :
   * 1. Calculer le montant total
   * 2. Vérifier le paiement (via paymentIntentId)
   * 3. Créer la réservation
   * 4. Envoyer les notifications
   */
  @Audit({ eventType: 'SERVICE_BOOKING_CREATED', includeArgs: true })
  @Performance({ warningThreshold: 3000, errorThreshold: 8000 })
  @Transaction()
  async createServiceBooking(
    data: ServiceBookingFacadeData,
  ): Promise<ServiceBookingFacadeResult> {
    try {
      logger.info(
        {
          serviceType: data.serviceType,
          serviceId: data.selectedService.serviceId,
          paymentIntentId: data.paymentIntentId,
        },
        'Creating service booking via ServiceBookingFacade',
      );

      // Calculer le montant total
      const basePrice = data.selectedService.price;
      const optionsPrice = data.additionalOptions.reduce(
        (sum, option) => sum + option.price,
        0,
      );
      const totalAmount = basePrice + optionsPrice;

      // Vérifier que le paiement a été effectué
      // Note: En production, vous devriez vérifier le statut du payment intent
      // via l'API Stripe pour confirmer que le paiement a bien été effectué

      // Mapper ServiceBookingFacadeData vers BookingFacadeData
      // Générer un ID unique pour les utilisateurs non connectés
      // Format: guest-{timestamp}-{random} pour permettre de lier à un compte plus tard
      const generateGuestId = (email: string): string => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        // Utiliser un hash de l'email pour permettre de retrouver le même guest ID
        const emailHash = email.split('@')[0]?.substring(0, 6) || '';
        return `guest-${emailHash}-${timestamp}-${random}`;
      };
      
      // Si l'utilisateur n'est pas connecté, générer un ID unique basé sur l'email
      // Cela permettra de lier la réservation à un compte créé ultérieurement
      const requesterId = data.metadata?.['userId'] as string || generateGuestId(data.clientInfo.email);
      
      const bookingData: BookingFacadeData = {
        requesterId, // ID unique pour les utilisateurs non connectés
        providerId: data.selectedService.serviceId, // À adapter selon votre modèle de providers
        serviceId: data.selectedService.serviceId,
        serviceType: this.mapServiceTypeToBookingType(data.serviceType),
        appointmentDate: data.appointmentDate
          ? new Date(data.appointmentDate)
          : new Date(), // Date par défaut si non fournie - BookingFacadeData requiert une Date
        ...(data.appointmentTime && { timeslot: data.appointmentTime }),
        recipient: {
          firstName: data.beneficiaryInfo.firstName,
          lastName: data.beneficiaryInfo.lastName,
          phone: data.beneficiaryInfo.phone || '',
        },
        metadata: {
          ...(data.metadata || {}),
          serviceCategory: data.selectedService.category,
          serviceLabel: data.selectedService.label,
          // Convertir les nombres en strings pour respecter z.record(z.string())
          basePrice: String(basePrice),
          optionsPrice: String(optionsPrice),
          totalAmount: String(totalAmount),
          // Convertir le tableau en JSON string
          additionalOptions: JSON.stringify(data.additionalOptions || []),
          paymentIntentId: data.paymentIntentId,
        },
        payment: {
          amount: totalAmount,
          currency: CURRENCIES.EUR.code, // Utiliser le code de la devise
          paymentMethodId: data.paymentIntentId, // Utiliser paymentMethodId au lieu de method
          createInvoice: true,
        },
      };

      // Créer la réservation directement (logique fusionnée de BookingFacade)
      const bookingResult = await this.createBookingWithPayment(bookingData);

      if (!bookingResult.success || !bookingResult.booking) {
        return {
          success: false,
          error: bookingResult.error || 'Échec de la création de la réservation',
        };
      }

      // Fonction helper pour calculer l'heure de fin
      const calculateEndTime = (startTime: string, durationMinutes: number): string => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const start = new Date();
        start.setHours(hours || 0, minutes || 0, 0, 0);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        return `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
      };
      
      // Envoyer un email de récapitulatif de commande avec tous les détails
      try {
        // Construire le récapitulatif détaillé
        const optionsList = data.additionalOptions.length > 0
          ? data.additionalOptions.map(opt => `- ${opt.label}: +${opt.price}€`).join('\n')
          : 'Aucune option supplémentaire';
        
        const appointmentInfo = data.appointmentDate && data.appointmentTime
          ? `Date: ${new Date(data.appointmentDate).toLocaleDateString('fr-FR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric', 
            })}\nHeure: ${data.appointmentTime}`
          : 'À définir';
        
        const summaryMessage = `
Récapitulatif de votre réservation :

Service: ${data.selectedService.label}
Description: ${data.selectedService.description}
Prix de base: ${basePrice}€

Options supplémentaires:
${optionsList}

Total: ${totalAmount}€

Informations du bénéficiaire:
- Nom: ${data.beneficiaryInfo.firstName} ${data.beneficiaryInfo.lastName}
- Téléphone: ${data.beneficiaryInfo.phone}
${data.beneficiaryInfo.email ? `- Email: ${data.beneficiaryInfo.email}` : ''}

${appointmentInfo}

Numéro de réservation: ${bookingResult.booking.reservationNumber || bookingResult.booking.id}

Votre réservation a été confirmée. Vous serez recontacté rapidement pour le suivi de votre rendez-vous.
        `.trim();

        await notificationService.sendNotification({
          recipient: data.clientInfo.email,
          type: 'SERVICE_BOOKING_CONFIRMED',
          template: 'service-booking-confirmed',
          data: {
            title: 'Réservation confirmée - Récapitulatif de commande',
            message: summaryMessage,
            bookingId: bookingResult.booking.id,
            reservationNumber: bookingResult.booking.reservationNumber || bookingResult.booking.id,
            serviceType: data.serviceType,
            serviceLabel: data.selectedService.label,
            totalAmount: totalAmount,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            beneficiaryName: `${data.beneficiaryInfo.firstName} ${data.beneficiaryInfo.lastName}`,
          },
          channels: [{ type: 'EMAIL' as const, enabled: true, priority: 'HIGH' as const }],
          locale: 'fr',
          priority: 'HIGH',
        });
        
        // Envoyer également au bénéficiaire si un email est fourni
        if (data.beneficiaryInfo.email && data.beneficiaryInfo.email !== data.clientInfo.email) {
          try {
            await notificationService.sendNotification({
              recipient: data.beneficiaryInfo.email,
              type: 'SERVICE_BOOKING_CONFIRMED',
              template: 'service-booking-confirmed',
              data: {
                title: 'Réservation confirmée pour vous',
                message: `Une réservation a été effectuée en votre nom pour le service: ${data.selectedService.label}.\n\n${appointmentInfo}\n\nVous serez recontacté rapidement pour le suivi.`,
                bookingId: bookingResult.booking.id,
                reservationNumber: bookingResult.booking.reservationNumber || bookingResult.booking.id,
                serviceType: data.serviceType,
                serviceLabel: data.selectedService.label,
              },
              channels: [{ type: 'EMAIL' as const, enabled: true, priority: 'HIGH' as const }],
              locale: 'fr',
              priority: 'HIGH',
            });
          } catch (beneficiaryNotificationError) {
            logger.warn(
              { error: beneficiaryNotificationError, bookingId: bookingResult.booking.id },
              'Failed to send notification to beneficiary, but booking was created',
            );
          }
        }
      } catch (notificationError) {
        logger.warn(
          { error: notificationError, bookingId: bookingResult.booking.id },
          'Failed to send notification, but booking was created',
        );
      }
      
      // Préparer les données pour le calendrier (structure prête pour intégration future)
      // Les données sont stockées dans les métadonnées de la réservation
      const calendarData = {
        bookingId: bookingResult.booking.id,
        reservationNumber: bookingResult.booking.reservationNumber || bookingResult.booking.id,
        title: `${data.selectedService.label} - ${data.beneficiaryInfo.firstName} ${data.beneficiaryInfo.lastName}`,
        startDate: data.appointmentDate ? new Date(data.appointmentDate) : new Date(),
        startTime: data.appointmentTime || '',
        endTime: data.appointmentTime ? calculateEndTime(data.appointmentTime, 30) : '', // 30 min par défaut
        clientEmail: data.clientInfo.email,
        beneficiaryEmail: data.beneficiaryInfo.email,
        beneficiaryPhone: data.beneficiaryInfo.phone,
        serviceType: data.serviceType,
        serviceLabel: data.selectedService.label,
        // Ces données peuvent être utilisées pour créer un événement calendrier (Google Calendar, Outlook, etc.)
      };
      
      // Stocker les données calendrier dans les métadonnées pour utilisation future
      // Note: Ces données peuvent être utilisées pour créer un événement calendrier (Google Calendar, Outlook, etc.)
      // via une API ou un webhook futur
      logger.info(
        { bookingId: bookingResult.booking.id, calendarData },
        'Calendar data prepared for future integration',
      );

      logger.info(
        {
          bookingId: bookingResult.booking.id,
          serviceType: data.serviceType,
        },
        'Service booking created successfully',
      );

      // Extraire l'ID de manière robuste (peut être id ou _id selon le format)
      const bookingId = bookingResult.booking.id || 
                       bookingResult.booking._id?.toString() || 
                       (bookingResult.booking as any)?._id?.toString() || 
                       '';
      
      const reservationNumber = bookingResult.booking.reservationNumber || 
                               bookingId || 
                               '';

      return {
        success: true,
        bookingId,
        reservationNumber,
        booking: {
          id: bookingId,
          _id: bookingId,
          reservationNumber,
          ...bookingResult.booking,
        },
        paymentIntentId: data.paymentIntentId,
        message:
          'Votre réservation a été confirmée. Vous serez recontacté rapidement pour le suivi de votre rendez-vous.',
      };
    } catch (error: any) {
      logger.error(
        {
          error: error.message,
          stack: error.stack,
          serviceType: data.serviceType,
        },
        'Error creating service booking',
      );

      Sentry.captureException(error, {
        tags: {
          component: 'ServiceBookingFacade',
          action: 'createServiceBooking',
          serviceType: data.serviceType,
        },
        extra: {
          serviceType: data.serviceType,
          serviceId: data.selectedService.serviceId,
        },
      });

      return {
        success: false,
        error:
          error.message ||
          'Une erreur est survenue lors de la création de la réservation',
      };
    }
  }

  /**
   * Mapper le type de service vers le type de réservation
   * ServiceType est déjà au bon format (HEALTH, BTP, EDUCATION)
   */
  private mapServiceTypeToBookingType(
    serviceType: ServiceType,
  ): 'HEALTH' | 'EDUCATION' | 'BTP' {
    // ServiceType est déjà au format attendu, on filtre juste les types supportés
    if (serviceType === 'HEALTH' || serviceType === 'EDUCATION' || serviceType === 'BTP') {
      return serviceType;
    }
    // Par défaut, mapper vers HEALTH pour les autres types
    return 'HEALTH';
  }

  /**
   * Calculer le montant total d'un service avec options
   */
  calculateTotalAmount(
    basePrice: number,
    additionalOptions: Array<{ price: number }>,
  ): number {
    const optionsPrice = additionalOptions.reduce(
      (sum, option) => sum + option.price,
      0,
    );
    return basePrice + optionsPrice;
  }

  /**
   * Créer une réservation complète avec paiement optionnel
   * Logique fusionnée depuis BookingFacade
   * 
   * Étapes :
   * 1. Créer la réservation
   * 2. Traiter le paiement (si fourni)
   * 3. Envoyer les notifications de confirmation
   * 
   * Cette méthode est publique pour permettre l'utilisation depuis les commandes et autres endpoints
   */
  async createBookingWithPayment(
    data: BookingFacadeData,
  ): Promise<BookingFacadeResult> {
    try {
      logger.info(
        {
          requesterId: data.requesterId,
          providerId: data.providerId,
          serviceId: data.serviceId,
          serviceType: data.serviceType,
          hasPayment: !!data.payment,
        },
        'Creating booking via ServiceBookingFacade (merged BookingFacade logic)',
      );

      // Étape 1: Créer la réservation
      // Mapper BookingFacadeData vers BookingData
      const consultationModeMap: Record<'IN_PERSON' | 'TELEMEDICINE' | 'HYBRID', 'video' | 'cabinet'> = {
        'IN_PERSON': 'cabinet',
        'TELEMEDICINE': 'video',
        'HYBRID': 'video', // HYBRID mappe vers video par défaut
      };

      const bookingData: BookingData = {
        requesterId: data.requesterId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        serviceType: data.serviceType,
        appointmentDate: data.appointmentDate,
        ...(data.timeslot && { timeslot: data.timeslot }),
        ...(data.consultationMode && {
          consultationMode: consultationModeMap[data.consultationMode],
        }),
        ...(data.recipient && typeof data.recipient !== 'string' && {
          recipient: data.recipient,
        }),
        ...(data.metadata && { metadata: data.metadata }),
      };

      const booking = await bookingService.createBooking(bookingData);
      
      // Mapper le résultat avec BookingMapper
      const mappedBooking = bookingMapper.map(booking as any);

      let paymentResult;

      // Étape 2: Traiter le paiement si fourni
      if (data.payment) {
        try {
          // Vérifier si paymentMethodId est en fait un Payment Intent ID (commence par "pi_")
          // Si c'est le cas, le paiement a déjà été confirmé côté client, on vérifie juste son statut
          const isPaymentIntentId = data.payment.paymentMethodId?.startsWith('pi_');
          
          if (isPaymentIntentId) {
            // Le paiement a déjà été confirmé côté client, on vérifie juste son statut
            logger.info(
              { paymentIntentId: data.payment.paymentMethodId, bookingId: booking.id },
              'Payment already confirmed, checking status',
            );
            
            const paymentStatus = await this.paymentService.getTransactionStatus(
              data.payment.paymentMethodId,
            );
            
            if (!paymentStatus.success) {
              await bookingService.updateBookingStatus(
                booking.id || booking._id?.toString() || '',
                BOOKING_STATUSES.CANCELLED,
              );
              
              return {
                success: false,
                booking,
                paymentResult: paymentStatus,
                error: paymentStatus.error || 'Payment verification failed',
              };
            }
            
            // Le paiement est confirmé, créer la transaction et la facture
            // Simuler un PaymentFacadeResult pour la compatibilité
            paymentResult = {
              success: true,
              transactionId: paymentStatus.transactionId || data.payment.paymentMethodId,
              paymentIntentId: paymentStatus.paymentIntentId || data.payment.paymentMethodId,
            };
            
            // Créer la transaction
            // Pour les réservations de service, le bénéficiaire est le même que le payeur
            // car c'est un paiement pour un service, pas un transfert d'argent
            try {
              await transactionService.createTransaction({
                payerId: data.requesterId,
                beneficiaryId: data.requesterId, // Le bénéficiaire est le payeur pour les services
                amount: data.payment.amount,
                currency: data.payment.currency,
                serviceType: data.serviceType,
                serviceId: data.serviceId,
                description: `Payment for booking ${booking.id || booking._id?.toString() || ''}`,
                metadata: {
                  ...data.metadata,
                  bookingId: booking.id || booking._id?.toString() || '',
                  paymentIntentId: data.payment.paymentMethodId,
                  serviceLabel: data.metadata?.['serviceLabel'] || '',
                },
              });
            } catch (transactionError) {
              logger.warn(
                { error: transactionError, bookingId: booking.id },
                'Failed to create transaction, but payment is confirmed',
              );
            }
            
            // Créer la facture si demandé
            if (data.payment.createInvoice !== false) {
              try {
                await invoiceService.createInvoice({
                  userId: data.requesterId,
                  bookingId: booking.id || booking._id?.toString() || '',
                  amount: data.payment.amount,
                  currency: data.payment.currency,
                  items: [{
                    description: `Service booking ${data.serviceId}`,
                    quantity: 1,
                    unitPrice: data.payment.amount,
                    total: data.payment.amount,
                  }],
                  metadata: {
                    ...data.metadata,
                    paymentIntentId: data.payment.paymentMethodId,
                    transactionId: paymentResult.transactionId,
                  },
                });
              } catch (invoiceError) {
                logger.warn(
                  { error: invoiceError, bookingId: booking.id },
                  'Failed to create invoice, but payment is confirmed',
                );
              }
            }
          } else {
            // C'est un vrai payment method ID, traiter le paiement normalement
            const paymentData: PaymentFacadeData = {
              amount: data.payment.amount,
              currency: data.payment.currency,
              customerId: data.requesterId,
              paymentMethodId: data.payment.paymentMethodId,
              payerId: data.requesterId,
              beneficiaryId: data.requesterId, // Le bénéficiaire est le payeur pour les services
              serviceType: data.serviceType,
              serviceId: data.serviceId,
              description: `Payment for booking ${
                booking.id || booking._id?.toString()
              }`,
              metadata: {
                ...data.metadata,
                bookingId: booking.id || booking._id?.toString() || '',
              },
              createInvoice: data.payment.createInvoice !== false,
              sendNotification: false, // On enverra une notification combinée après
            };

            paymentResult = await paymentFacade.execute(paymentData);
          }

          // Si le paiement nécessite une action (3D Secure, etc.)
          if (paymentResult.requiresAction) {
            // Mettre à jour le statut de la réservation
            await bookingService.updateBookingStatus(
              booking.id || booking._id?.toString() || '',
              BOOKING_STATUSES.PENDING,
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
              BOOKING_STATUSES.CANCELLED,
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
            BOOKING_STATUSES.CONFIRMED,
          );
        } catch (paymentError: any) {
          logger.error(
            { error: paymentError },
            'Payment processing failed in ServiceBookingFacade',
          );

          // Mettre à jour le statut de la réservation
          const bookingId =
            booking.id || (booking as any)._id?.toString() || '';
          await bookingService.updateBookingStatus(bookingId, BOOKING_STATUSES.CANCELLED);

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
          locale: LANGUAGES.FR.code,
          priority: 'HIGH',
          data: {
            booking: {
              id: booking.id || (booking as any)._id?.toString(),
              providerId: data.providerId,
              serviceId: data.serviceId,
              appointmentDate: data.appointmentDate,
              timeslot: data.timeslot,
            },
            payment: paymentResult?.success
              ? {
                  transactionId: paymentResult.transactionId,
                  amount: data.payment?.amount,
                  currency: data.payment?.currency,
                }
              : undefined,
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
          locale: LANGUAGES.FR.code,
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
        logger.error(
          { error: notificationError },
          'Failed to send booking notifications',
        );
      }

      logger.info(
        {
          bookingId: booking.id || (booking as any)._id?.toString(),
          paymentSuccess: paymentResult?.success,
        },
        'Booking created successfully via ServiceBookingFacade',
      );

      return {
        success: true,
        booking: mappedBooking as any, // Convertir vers le type attendu
        paymentResult: paymentResult as PaymentFacadeResult,
      } as BookingFacadeResult;
    } catch (error: any) {
      logger.error(
        {
          error,
          data: {
            requesterId: data.requesterId,
            providerId: data.providerId,
            serviceId: data.serviceId,
          },
        },
        'Error creating booking via ServiceBookingFacade',
      );

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
}

// Export singleton instance
export const serviceBookingFacade = ServiceBookingFacade.getInstance();

