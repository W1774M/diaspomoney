/**
 * Booking Service - DiaspoMoney (Version Refactorée avec Repository Pattern)
 *
 * Service refactoré utilisant le Repository Pattern
 */

import { Cacheable, InvalidateCache } from '@/lib/decorators/cache.decorator';
import { Log } from '@/lib/decorators/log.decorator';
import {
  Validate,
} from '@/lib/decorators/validate.decorator';
import { Audit } from '@/lib/decorators/audit.decorator';
import { Performance } from '@/lib/decorators/performance.decorator';
import { Transaction } from '@/lib/decorators/transaction.decorator';
import { BOOKING_STATUSES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { Booking, getBookingRepository } from '@/repositories';
import type { PaginatedFindResult } from '@/lib/types';
import type { BookingData, BookingServiceFilters } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';
import { createCheckoutSession } from '@/lib/stripe-checkout';
import { sendPaymentLinkEmail } from '@/lib/email/resend';

/**
 * BookingService refactoré utilisant le Repository Pattern
 */
export class BookingService {
  private static instance: BookingService;
  private bookingRepository = getBookingRepository();

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  /**
   * Lier les commandes guest à un utilisateur connecté
   * Trouve toutes les commandes avec requesterId commençant par "guest-"
   * et dont l'email client correspond à l'email de l'utilisateur
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @InvalidateCache('BookingService:*')
  async linkGuestBookingsToUser(userId: string, userEmail: string): Promise<number> {
    try {
      logger.info(
        { userId, userEmail },
        'Liaison des commandes guest à l\'utilisateur',
      );

      // Accéder directement à la collection MongoDB pour les requêtes complexes
      // (requête regex sur requesterId et filtre sur metadata.clientEmail)
      const { mongoClient } = await import('@/lib/mongodb');
      const client = await mongoClient;
      const db = client.db();
      const collection = db.collection('bookings');
      
      // Normaliser l'email pour la comparaison (en minuscules)
      const normalizedEmail = userEmail.toLowerCase();
      
      // Rechercher toutes les commandes guest avec l'email correspondant
      const guestBookings = await collection.find({
        requesterId: { $regex: /^guest-/ },
        'metadata.clientEmail': normalizedEmail,
      }).toArray();

      if (guestBookings.length === 0) {
        logger.info(
          { userId, userEmail },
          'Aucune commande guest trouvée pour cet email',
        );
        return 0;
      }

      logger.info(
        {
          userId,
          userEmail,
          guestBookingsCount: guestBookings.length,
          bookingIds: guestBookings.map((b: any) => b._id.toString()),
        },
        'Commandes guest trouvées, mise à jour en cours',
      );

      // Mettre à jour toutes les commandes trouvées une par une via le repository
      // pour s'assurer que les validations et les hooks sont exécutés
      let updatedCount = 0;
      for (const booking of guestBookings) {
        try {
          const bookingId = booking._id.toString();
          await this.bookingRepository.update(bookingId, {
            requesterId: userId,
          } as any);
          updatedCount++;
          
          logger.debug(
            { bookingId, userId, userEmail },
            'Commande guest liée à l\'utilisateur',
          );
        } catch (updateError) {
          logger.warn(
            {
              error: updateError,
              bookingId: booking._id.toString(),
              userId,
              userEmail,
            },
            'Erreur lors de la mise à jour d\'une commande guest, continuation',
          );
          // Continuer avec les autres commandes même si une échoue
        }
      }

      logger.info(
        {
          userId,
          userEmail,
          totalFound: guestBookings.length,
          successfullyUpdated: updatedCount,
        },
        'Commandes guest liées à l\'utilisateur avec succès',
      );

      return updatedCount;
    } catch (error) {
      logger.error(
        { error, userId, userEmail },
        'Erreur lors de la liaison des commandes guest',
      );
      Sentry.captureException(error as Error, {
        tags: {
          component: 'BookingService',
          action: 'linkGuestBookingsToUser',
        },
        extra: { userId, userEmail },
      });
      throw error;
    }
  }

  /**
   * Récupérer tous les rendez-vous avec filtres
   * Utilisation du repository
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Cacheable(900, { prefix: 'BookingService:getBookings' }) // Cache 15 minutes
  async getBookings(filters: BookingServiceFilters = {}): Promise<{
    data: Booking[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      // Convertir les filtres en format BookingFilters
      const repositoryFilters: Record<string, any> = {
        requesterId: filters.userId,
        providerId: filters.providerId,
        status: filters.status as Booking['status'],
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      };

      // Utiliser le repository avec pagination
      const limit = filters['limit'] || 50;
      const offset = filters['offset'] || 0;
      const page = Math.floor(offset / limit) + 1;
      const result = await this.bookingRepository.findBookingsWithFilters(
        repositoryFilters,
        {
          limit,
          page,
          offset,
        },
      );

      return {
        data: result.data,
        total: result.total,
        limit: result.pagination.limit,
        offset: result.pagination.offset,
      };
    } catch (error) {
      logger.error({ error, filters }, 'Erreur getBookings');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer un rendez-vous par son ID
   * Utilisation du repository
   */
  @Log({ level: 'info', logArgs: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Booking ID is required'),
        paramName: 'id',
      },
    ],
  })
  @Cacheable(600, { prefix: 'BookingService:getBookingById' }) // Cache 10 minutes
  async getBookingById(id: string): Promise<Booking> {
    try {
      const booking = await this.bookingRepository.findById(id);

      if (!booking) {
        throw new Error('Réservation non trouvée');
      }

      return booking;
    } catch (error) {
      logger.error({ error, id }, 'Erreur getBookingById');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Créer un nouveau rendez-vous
   * Utilisation du repository
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.object({
          requesterId: z.string().min(1),
          providerId: z.string().min(1),
          serviceId: z.string().min(1),
        }).passthrough(),
        paramName: 'data',
      },
    ],
  })
  @Audit({ eventType: 'BOOKING_CREATED', includeArgs: true })
  @Performance({ warningThreshold: 2000, errorThreshold: 5000 })
  @Transaction()
  @InvalidateCache('BookingService:*')
  async createBooking(data: BookingData): Promise<Booking> {
    try {
      // Validation
      if (!data.requesterId || !data.providerId || !data.serviceId) {
        throw new Error('Données de réservation incomplètes');
      }

      // Créer la réservation via le repository
      const booking = await this.bookingRepository.create({
        requesterId: data.requesterId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        serviceType: data.serviceType,
        status: BOOKING_STATUSES.PENDING,
        appointmentDate: data.appointmentDate,
        timeslot: data.timeslot,
        consultationMode: data.consultationMode,
        recipient: data.recipient,
        metadata: data.metadata,
      } as Partial<Booking>);

      return booking;
    } catch (error) {
      logger.error({ error, data }, 'Erreur createBooking');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Mettre à jour un rendez-vous
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Booking ID is required'),
        paramName: 'id',
      },
    ],
  })
  @Audit({ eventType: 'BOOKING_UPDATED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 3000 })
  @InvalidateCache('BookingService:*')
  async updateBooking(
    id: string,
    data: Partial<BookingData>,
  ): Promise<Booking> {
    try {
      // Vérifier que la réservation existe avant de tenter la mise à jour
      const existingBooking = await this.bookingRepository.findById(id);
      if (!existingBooking) {
        logger.warn({ bookingId: id }, 'Booking not found before update');
        throw new Error('Réservation non trouvée');
      }

      logger.debug(
        { 
          bookingId: id, 
          existingStatus: existingBooking.status,
          updateFields: Object.keys(data),
        },
        'Updating booking',
      );

      const updatedBooking = await this.bookingRepository.update(
        id,
        data as Partial<Booking>,
      );

      if (!updatedBooking) {
        // Le repository a retourné null, ce qui peut arriver si :
        // 1. Le document a été supprimé entre la vérification et la mise à jour (race condition)
        // 2. Le mapping a échoué
        // Tentons de récupérer le booking à nouveau pour vérifier s'il existe toujours
        logger.warn(
          { 
            bookingId: id,
            updateData: data,
            existingBooking: existingBooking ? { id: existingBooking.id, status: existingBooking.status } : null,
          },
          'Repository returned null after update, attempting to refetch booking',
        );
        
        const refetchedBooking = await this.bookingRepository.findById(id);
        if (!refetchedBooking) {
          logger.error(
            { 
              bookingId: id,
              updateData: data,
            },
            'Booking not found after update - document may have been deleted',
          );
          throw new Error('Réservation non trouvée');
        }
        
        // Le booking existe toujours, retourner la version récupérée
        logger.info(
          { bookingId: id },
          'Booking refetched successfully after update returned null',
        );
        return refetchedBooking;
      }

      logger.info(
        { 
          bookingId: id,
          previousStatus: existingBooking.status,
          newStatus: updatedBooking.status,
        },
        'Booking updated successfully',
      );

      return updatedBooking;
    } catch (error) {
      logger.error({ error, id, updateData: data }, 'Erreur updateBooking');
      Sentry.captureException(error, {
        tags: { component: 'BookingService', method: 'updateBooking' },
        extra: { bookingId: id, updateData: data },
      });
      throw error;
    }
  }

  /**
   * Mettre à jour le statut d'une réservation
   */
  @Log({ level: 'info', logArgs: true })
  @Audit({ eventType: 'BOOKING_STATUS_UPDATED', includeArgs: true })
  @Performance({ warningThreshold: 1000, errorThreshold: 3000 })
  @InvalidateCache('BookingService:*')
  async updateBookingStatus(
    id: string,
    status: Booking['status'],
  ): Promise<boolean> {
    try {
      return await this.bookingRepository.updateStatus(id, status);
    } catch (error) {
      logger.error({ error, id, status }, 'Erreur updateBookingStatus');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Annuler une réservation
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Booking ID is required'),
        paramName: 'id',
      },
    ],
  })
  @InvalidateCache('BookingService:*')
  async cancelBooking(id: string): Promise<Booking> {
    try {
      // Vérifier que la réservation existe
      const booking = await this.bookingRepository.findById(id);
      if (!booking) {
        throw new Error('Réservation non trouvée');
      }

      // Vérifier que la réservation peut être annulée
      if (booking.status === BOOKING_STATUSES.CANCELLED) {
        throw new Error('Cette réservation est déjà annulée');
      }

      if (booking.status === BOOKING_STATUSES.FINISHED) {
        throw new Error("Impossible d'annuler une réservation terminée");
      }

      // Mettre à jour le statut
      const updated = await this.bookingRepository.updateStatus(
        id,
        BOOKING_STATUSES.CANCELLED,
      );
      if (!updated) {
        throw new Error("Erreur lors de l'annulation de la réservation");
      }

      // Récupérer la réservation mise à jour
      const cancelledBooking = await this.bookingRepository.findById(id);
      if (!cancelledBooking) {
        throw new Error('Réservation non trouvée après annulation');
      }

      return cancelledBooking;
    } catch (error) {
      logger.error({ error, id }, 'Erreur cancelBooking');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer un rendez-vous
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Booking ID is required'),
        paramName: 'id',
      },
    ],
  })
  @InvalidateCache('BookingService:*')
  async deleteBooking(id: string): Promise<boolean> {
    try {
      return await this.bookingRepository.delete(id);
    } catch (error) {
      logger.error({ error, id }, 'Erreur deleteBooking');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Supprimer complètement une réservation et tous ses éléments associés
   * - Supprime la réservation de la BDD
   * - Supprime la transaction associée dans la BDD
   * - Annule/rembourse le PaymentIntent chez Stripe
   * - Supprime la facture associée si elle existe
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Booking ID is required'),
        paramName: 'id',
      },
    ],
  })
  @Audit({ eventType: 'BOOKING_DELETED', includeArgs: true })
  @Performance({ warningThreshold: 5000, errorThreshold: 10000 })
  @InvalidateCache('BookingService:*')
  async deleteBookingCompletely(id: string): Promise<{
    success: boolean;
    deleted: {
      booking: boolean;
      transaction: boolean;
      invoice: boolean;
      stripePaymentIntent: boolean;
    };
  }> {
    const result = {
      success: false,
      deleted: {
        booking: false,
        transaction: false,
        invoice: false,
        stripePaymentIntent: false,
      },
    };

    try {
      // 1. Récupérer la réservation
      const booking = await this.bookingRepository.findById(id);
      if (!booking) {
        throw new Error('Réservation non trouvée');
      }

      // 2. Récupérer le paymentIntentId depuis les métadonnées
      const paymentIntentId = booking.metadata?.['paymentIntentId'] as string | undefined;

      // 3. Trouver et supprimer la transaction associée
      let transactionDeleted = false;
      try {
        const { getTransactionRepository } = await import('@/repositories');
        const transactionRepository = getTransactionRepository();
        
        // Chercher la transaction par bookingId dans les métadonnées
        // Utiliser findOne avec un filtre MongoDB pour chercher dans metadata.bookingId
        const transaction = await transactionRepository.findOne({
          'metadata.bookingId': id,
        });

        if (transaction) {
          await transactionRepository.delete(transaction.id);
          transactionDeleted = true;
          logger.info({ bookingId: id, transactionId: transaction.id }, 'Transaction supprimée');
        } else if (paymentIntentId) {
          // Essayer de trouver par paymentIntentId
          const transactionByPaymentIntent = await transactionRepository.findByPaymentIntentId(paymentIntentId);
          if (transactionByPaymentIntent) {
            await transactionRepository.delete(transactionByPaymentIntent.id);
            transactionDeleted = true;
            logger.info({ bookingId: id, transactionId: transactionByPaymentIntent.id }, 'Transaction supprimée via paymentIntentId');
          }
        }
      } catch (transactionError) {
        logger.warn({ error: transactionError, bookingId: id }, 'Erreur lors de la suppression de la transaction');
      }

      // 4. Trouver et supprimer la facture associée
      let invoiceDeleted = false;
      try {
        const { getInvoiceRepository } = await import('@/repositories');
        const invoiceRepository = getInvoiceRepository();
        
        const invoices = await invoiceRepository.findInvoicesWithFilters(
          { bookingId: id },
          { limit: 1, page: 1 }
        );

        if (invoices.data.length > 0) {
          const invoice = invoices.data[0];
          if (invoice) {
            await invoiceRepository.delete(invoice.id);
            invoiceDeleted = true;
            logger.info({ bookingId: id, invoiceId: invoice.id }, 'Facture supprimée');
          }
        }
      } catch (invoiceError) {
        logger.warn({ error: invoiceError, bookingId: id }, 'Erreur lors de la suppression de la facture');
      }

      // 5. Gérer le PaymentIntent chez Stripe
      let stripeHandled = false;
      if (paymentIntentId) {
        try {
          const { getStripeInstance } = await import('@/lib/stripe-config');
          const stripe = getStripeInstance();

          // Récupérer le PaymentIntent pour vérifier son statut
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

          if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
            // Si le paiement est confirmé, créer un remboursement
            try {
              await stripe.refunds.create({
                payment_intent: paymentIntentId,
                metadata: {
                  source: 'diaspomoney',
                  bookingId: id,
                  deleted_at: new Date().toISOString(),
                  reason: 'booking_deleted',
                },
              });
              stripeHandled = true;
              logger.info({ bookingId: id, paymentIntentId }, 'PaymentIntent remboursé chez Stripe');
            } catch (refundError: any) {
              // Si le remboursement échoue, essayer d'annuler
              logger.warn({ error: refundError, paymentIntentId }, 'Erreur lors du remboursement, tentative d\'annulation');
              try {
                await stripe.paymentIntents.cancel(paymentIntentId);
                stripeHandled = true;
                logger.info({ bookingId: id, paymentIntentId }, 'PaymentIntent annulé chez Stripe');
              } catch (cancelError) {
                logger.error({ error: cancelError, paymentIntentId }, 'Erreur lors de l\'annulation du PaymentIntent');
              }
            }
          } else if (paymentIntent.status === 'requires_payment_method' || 
                     paymentIntent.status === 'requires_confirmation' ||
                     paymentIntent.status === 'requires_action' ||
                     paymentIntent.status === 'processing') {
            // Si le paiement n'est pas encore confirmé, annuler
            await stripe.paymentIntents.cancel(paymentIntentId);
            stripeHandled = true;
            logger.info({ bookingId: id, paymentIntentId }, 'PaymentIntent annulé chez Stripe');
          } else if (paymentIntent.status === 'canceled') {
            // Déjà annulé
            stripeHandled = true;
            logger.info({ bookingId: id, paymentIntentId }, 'PaymentIntent déjà annulé');
          }
        } catch (stripeError) {
          logger.error({ error: stripeError, paymentIntentId, bookingId: id }, 'Erreur lors de la gestion du PaymentIntent chez Stripe');
        }
      } else {
        // Pas de PaymentIntent à gérer
        stripeHandled = true;
      }

      // 6. Supprimer la réservation
      const bookingDeleted = await this.bookingRepository.delete(id);
      if (!bookingDeleted) {
        throw new Error('Erreur lors de la suppression de la réservation');
      }

      result.success = true;
      result.deleted = {
        booking: bookingDeleted,
        transaction: transactionDeleted,
        invoice: invoiceDeleted,
        stripePaymentIntent: stripeHandled,
      };

      logger.info(
        { bookingId: id, result },
        'Réservation supprimée complètement avec tous ses éléments associés',
      );

      return result;
    } catch (error) {
      logger.error({ error, id }, 'Erreur deleteBookingCompletely');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les réservations d'un utilisateur
   */
  @Log({ level: 'debug', logArgs: true })
  @Cacheable(900, { prefix: 'BookingService:getUserBookings' }) // Cache 15 minutes
  async getUserBookings(
    userId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<PaginatedFindResult<Booking>> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const page = Math.floor(offset / limit) + 1;
      return await this.bookingRepository.findByRequester(userId, {
        limit,
        page,
        offset,
      });
    } catch (error) {
      logger.error({ error, userId }, 'Erreur getUserBookings');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les réservations d'un provider
   */
  @Log({ level: 'debug', logArgs: true })
  @Cacheable(900, { prefix: 'BookingService:getProviderBookings' }) // Cache 15 minutes
  async getProviderBookings(
    providerId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<PaginatedFindResult<Booking>> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const page = Math.floor(offset / limit) + 1;
      return await this.bookingRepository.findByProvider(providerId, {
        limit,
        page,
        offset,
      });
    } catch (error) {
      logger.error({ error, providerId }, 'Erreur getProviderBookings');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Récupérer les réservations à venir
   */
  @Log({ level: 'debug', logArgs: true })
  @Cacheable(300, { prefix: 'BookingService:getUpcomingBookings' })
  async getUpcomingBookings(options?: {
    limit?: number;
    offset?: number;
  }): Promise<PaginatedFindResult<Booking>> {
    try {
      const limit = options?.limit || 50;
      const offset = options?.offset || 0;
      const page = Math.floor(offset / limit) + 1;
      return await this.bookingRepository.findUpcoming({
        limit,
        page,
        offset,
      });
    } catch (error) {
      logger.error({ error }, 'Erreur getUpcomingBookings');
      Sentry.captureException(error);
      throw error;
    }
  }

  /**
   * Valider une étape de progression pour une réservation
   * Permet à l'admin de valider manuellement une étape qui n'a pas été terminée par l'utilisateur
   */
  @Log({ level: 'info', logArgs: true, logExecutionTime: true })
  @Validate({
    rules: [
      {
        paramIndex: 0,
        schema: z.string().min(1, 'Booking ID is required'),
        paramName: 'id',
      },
      {
        paramIndex: 1,
        schema: z.number().min(1).max(4, 'Step must be between 1 and 4'),
        paramName: 'step',
      },
    ],
  })
  @Audit({ eventType: 'BOOKING_STEP_VALIDATED', includeArgs: true })
  @InvalidateCache('BookingService:*')
  async validateStep(id: string, step: number, validatedBy?: string): Promise<Booking> {
    try {
      // Récupérer la réservation
      const booking = await this.bookingRepository.findById(id);
      if (!booking) {
        throw new Error('Réservation non trouvée');
      }

      const metadata = booking.metadata || {};
      const currentStep = (metadata['currentStep'] as number) || 0;
      const progressHistory = (metadata['progressHistory'] as any[]) || [];

      // Vérifier si l'étape est déjà complétée dans l'historique
      const stepHistory = progressHistory.find((h: any) => h.step === step && h.completed === true);
      if (stepHistory) {
        // Si l'étape est déjà complétée, vérifier si c'est l'étape actuelle
        // Si c'est l'étape actuelle et qu'elle est complétée, on peut quand même avancer
        if (step === currentStep) {
          // L'étape actuelle est complétée, on peut passer à l'étape suivante
          // Mais on ne peut pas re-valider la même étape
          throw new Error(`L'étape ${step} est déjà complétée. Vous pouvez valider l'étape suivante (${step + 1}).`);
        } else {
          throw new Error(`L'étape ${step} est déjà complétée.`);
        }
      }

      // On peut valider l'étape actuelle (où l'utilisateur s'est arrêté) ou l'étape suivante
      // Si currentStep est 1, cela signifie que l'utilisateur est bloqué à l'étape 1, donc on peut valider l'étape 1
      if (step < currentStep) {
        throw new Error(`L'étape ${step} est déjà passée. L'étape actuelle est ${currentStep}.`);
      }

      // Vérifier que l'étape n'est pas trop loin dans le futur (max 1 étape d'avance)
      if (step > currentStep + 1) {
        throw new Error(`Vous ne pouvez valider que l'étape actuelle (${currentStep}) ou l'étape suivante (${currentStep + 1}). L'étape ${step} ne peut pas être validée directement.`);
      }

      // Définir les noms d'étapes
      const stepNames: Record<number, string> = {
        1: 'Étape 1 : Informations client',
        2: 'Étape 2 : Sélection du service',
        3: 'Étape 3 : Paiement',
        4: 'Étape 4 : Confirmation',
      };

      const stepName = stepNames[step] || `Étape ${step}`;

      // Pour l'étape 3 (paiement), créer un lien de paiement et l'envoyer par email si pas déjà généré
      let paymentUrl: string | undefined;
      let checkoutSessionId: string | undefined;
      
      if (step === 3) {
        // Vérifier si un lien de paiement existe déjà
        const existingPaymentUrl = metadata['paymentUrl'] as string | undefined;
        const existingCheckoutSessionId = metadata['checkoutSessionId'] as string | undefined;
        
        if (existingPaymentUrl && existingCheckoutSessionId) {
          // Utiliser le lien existant
          paymentUrl = existingPaymentUrl;
          checkoutSessionId = existingCheckoutSessionId;
          logger.info({ bookingId: id, checkoutSessionId }, 'Using existing payment link for step 3 validation');
        } else {
          // Générer un nouveau lien de paiement
          try {
            // Récupérer les informations nécessaires pour le paiement
            const clientEmail = metadata['clientEmail'] as string | undefined;
            const clientFirstName = metadata['clientFirstName'] as string | undefined;
            const clientLastName = metadata['clientLastName'] as string | undefined;
            const serviceName = metadata['serviceLabel'] as string || 'Service';
            const totalAmount = metadata['totalAmount'] as number | string | undefined;
            const currency = (metadata['currency'] as string) || 'EUR';
            
            if (!clientEmail) {
              logger.warn({ bookingId: id }, 'Client email not found, skipping payment link generation');
              // Ne pas bloquer la validation, l'admin peut valider sans générer de lien
            } else {
              // Convertir le montant en nombre si c'est une string
              let amountInEuros: number = 0;
              if (typeof totalAmount === 'string') {
                amountInEuros = parseFloat(totalAmount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
              } else if (typeof totalAmount === 'number') {
                amountInEuros = totalAmount;
              } else {
                logger.warn({ bookingId: id }, 'Total amount not defined, skipping payment link generation');
                // Ne pas bloquer la validation
              }

              if (!isNaN(amountInEuros) && amountInEuros > 0) {
                // Créer le Checkout Session Stripe
                const checkoutResult = await createCheckoutSession({
                  amount: amountInEuros,
                  currency,
                  customerEmail: clientEmail,
                  bookingId: id,
                  reservationNumber: booking.reservationNumber || id,
                  serviceName,
                  metadata: {
                    bookingId: id,
                    reservationNumber: booking.reservationNumber || id,
                    validatedBy: validatedBy || 'admin',
                  },
                });

                paymentUrl = checkoutResult.url;
                checkoutSessionId = checkoutResult.sessionId;

                logger.info(
                  { bookingId: id, checkoutSessionId, paymentUrl: paymentUrl.substring(0, 50) + '...' },
                  'Checkout session created for step 3 validation',
                );

                // Envoyer l'email avec le lien de paiement
                const clientName = clientFirstName && clientLastName
                  ? `${clientFirstName} ${clientLastName}`
                  : clientFirstName || clientLastName || 'Client';
                
                const emailSent = await sendPaymentLinkEmail(
                  clientEmail,
                  clientName,
                  booking.reservationNumber || id,
                  serviceName,
                  amountInEuros,
                  currency,
                  paymentUrl,
                );

                if (!emailSent) {
                  logger.warn({ bookingId: id, clientEmail }, 'Failed to send payment link email, but checkout session was created');
                } else {
                  logger.info({ bookingId: id, clientEmail }, 'Payment link email sent successfully');
                }
              }
            }
          } catch (error) {
            logger.error({ error, bookingId: id, step }, 'Error creating payment link for step 3');
            Sentry.captureException(error, {
              tags: { component: 'BookingService', method: 'validateStep', step: 3 },
              extra: { bookingId: id, step },
            });
            // Ne pas bloquer la validation si l'envoi du lien échoue
            // L'admin peut valider l'étape même sans générer de lien
          }
        }
      }

      // Ajouter l'étape validée dans l'historique
      // Pour l'étape 3, l'admin peut décider de la marquer comme complétée ou en attente
      const paymentStatus = metadata['paymentStatus'] as string | undefined;
      const isPaymentConfirmed = paymentStatus === 'confirmed';
      // L'admin peut valider l'étape 3 même si le paiement n'est pas confirmé
      // On marque comme complétée si l'admin valide, sauf si le paiement est explicitement en attente
      const step3Completed = step === 3 ? (isPaymentConfirmed || true) : true; // L'admin peut toujours valider l'étape 3
      
      const newProgressEntry = {
        step,
        stepName,
        timestamp: new Date().toISOString(),
        completed: step3Completed,
        validatedByAdmin: true,
        validatedBy: validatedBy || 'admin',
        data: {
          adminValidation: true,
          previousStep: currentStep,
          ...(step === 3 && paymentUrl && {
            paymentUrl,
            checkoutSessionId,
            paymentPending: !isPaymentConfirmed,
            paymentLinkSentAt: new Date().toISOString(),
          }),
        },
      };

      const updatedProgressHistory = [
        ...(Array.isArray(progressHistory) ? progressHistory : []),
        newProgressEntry,
      ];

      // Calculer et mettre à jour le montant total si nécessaire
      // Le montant doit être calculé à partir de basePrice + optionsPrice - discountAmount
      let calculatedTotalAmount: number | undefined;
      const basePrice = typeof metadata['basePrice'] === 'number'
        ? metadata['basePrice']
        : typeof metadata['basePrice'] === 'string'
        ? parseFloat(metadata['basePrice'].replace(/[^\d.,]/g, '').replace(',', '.'))
        : typeof metadata['servicePrice'] === 'number'
        ? metadata['servicePrice']
        : typeof metadata['servicePrice'] === 'string'
        ? parseFloat(metadata['servicePrice'].replace(/[^\d.,]/g, '').replace(',', '.'))
        : 0;

      const optionsPrice = (() => {
        if (metadata['additionalOptions']) {
          try {
            const options = typeof metadata['additionalOptions'] === 'string'
              ? JSON.parse(metadata['additionalOptions'])
              : metadata['additionalOptions'];
            if (Array.isArray(options)) {
              return options.reduce((sum: number, opt: any) => {
                const optPrice = typeof opt.price === 'number' ? opt.price : parseFloat(opt.price) || 0;
                return sum + optPrice;
              }, 0);
            }
          } catch {
            // Ignorer les erreurs de parsing
          }
        }
        return typeof metadata['optionsPrice'] === 'number'
          ? metadata['optionsPrice']
          : typeof metadata['optionsPrice'] === 'string'
          ? parseFloat(metadata['optionsPrice'].replace(/[^\d.,]/g, '').replace(',', '.'))
          : 0;
      })();

      const discountAmount = typeof metadata['discountAmount'] === 'number'
        ? metadata['discountAmount']
        : typeof metadata['discountAmount'] === 'string'
        ? parseFloat(metadata['discountAmount'].replace(/[^\d.,]/g, '').replace(',', '.'))
        : 0;

      const subtotal = basePrice + optionsPrice;
      calculatedTotalAmount = subtotal - discountAmount;

      // Mettre à jour les métadonnées
      const updatedMetadata: Record<string, any> = {
        ...metadata,
        currentStep: step,
        stepName,
        progressHistory: updatedProgressHistory,
        lastUpdatedAt: new Date().toISOString(),
        lastValidatedBy: validatedBy || 'admin',
        lastValidatedAt: new Date().toISOString(),
      };

      // Toujours mettre à jour le montant total si on peut le calculer (même si 0)
      // Cela garantit que totalAmount est toujours présent dans les métadonnées
      if (!isNaN(calculatedTotalAmount)) {
        updatedMetadata['totalAmount'] = Math.max(0, calculatedTotalAmount);
        // Mettre à jour basePrice et optionsPrice si on a pu les calculer
        if (basePrice >= 0) {
          updatedMetadata['basePrice'] = basePrice;
        }
        if (optionsPrice >= 0) {
          updatedMetadata['optionsPrice'] = optionsPrice;
        }
      }

      // Ajouter les informations de paiement pour l'étape 3
      if (step === 3) {
        if (paymentUrl) {
          updatedMetadata['paymentUrl'] = paymentUrl;
          updatedMetadata['checkoutSessionId'] = checkoutSessionId;
          updatedMetadata['paymentLinkSentAt'] = new Date().toISOString();
        }
        // Si l'admin valide l'étape 3, on peut marquer le paiement comme complété si nécessaire
        // L'admin a la liberté de décider
        if (isPaymentConfirmed) {
          updatedMetadata['paymentStatus'] = 'confirmed';
          updatedMetadata['paymentPending'] = false;
        } else {
          // Si le paiement n'est pas confirmé mais que l'admin valide, on laisse en attente
          updatedMetadata['paymentPending'] = !isPaymentConfirmed;
        }
      }

      // Si l'étape 4 est validée, marquer la réservation comme non-draft
      if (step === 4) {
        updatedMetadata['isDraft'] = false;
        // Optionnellement, mettre à jour le statut de la réservation
        if (booking.status === BOOKING_STATUSES.DRAFT) {
          await this.bookingRepository.updateStatus(id, BOOKING_STATUSES.PENDING);
        }
      }

      // Mettre à jour la réservation
      const updatedBooking = await this.bookingRepository.update(id, {
        metadata: updatedMetadata,
      });

      if (!updatedBooking) {
        throw new Error('Erreur lors de la mise à jour de la réservation');
      }

      logger.info(
        { 
          bookingId: id, 
          step, 
          validatedBy,
          totalAmount: updatedMetadata['totalAmount'],
          basePrice: updatedMetadata['basePrice'],
          optionsPrice: updatedMetadata['optionsPrice'],
        },
        'Booking step validated by admin',
      );

      return updatedBooking;
    } catch (error) {
      logger.error({ error, id, step }, 'Erreur validateStep');
      Sentry.captureException(error);
      throw error;
    }
  }
}

// Export singleton
export const bookingService = BookingService.getInstance();

