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
import { BOOKING_STATUSES, DATABASE, ROLES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { getBookingRepository, type Booking, type BookingFilters } from '@/repositories';
import type { PaginatedFindResult } from '@/lib/types';
import type { BookingData, BookingServiceFilters } from '@/lib/types';
import * as Sentry from '@sentry/nextjs';
import { ExpectedDomainError } from '@/lib/errors/expected-domain-error';
import { z } from 'zod';
import { EmailDispatch } from '@/domain/comms';
import { createCheckoutSession } from '@/lib/stripe-checkout';
import { sendPaymentLinkEmail } from '@/lib/email/resend';
import { notificationService } from '@/services/notification/notification.service';
import { cleanUrl } from '@/lib/utils';

interface BookingProgressHistoryEntry {
  step?: number;
  completed?: boolean;
  [key: string]: unknown;
}

interface PricedOption {
  price?: number | string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Un providerId de réservation n'est pas toujours un utilisateur : il peut valoir
 * un identifiant de service (« consultation-medical ») ou un marqueur (« admin-draft »).
 * Seul un ObjectId désigne un prestataire à notifier.
 */
function isProviderUserId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function isProgressHistoryEntry(value: unknown): value is BookingProgressHistoryEntry {
  return isRecord(value);
}

function isPricedOption(value: unknown): value is PricedOption {
  if (!isRecord(value)) {
    return false;
  }

  const price = value['price'];
  return price === undefined || typeof price === 'number' || typeof price === 'string';
}

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

      const updatedCount = await this.bookingRepository.linkGuestBookingsToUser(
        userId,
        userEmail,
      );

      logger.info(
        {
          userId,
          userEmail,
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
      const repositoryFilters: BookingFilters = {};
      if (filters.userId !== undefined) {
        repositoryFilters.requesterId = filters.userId;
      }
      if (filters.providerId !== undefined) {
        repositoryFilters.providerId = filters.providerId;
      }
      if (filters.status !== undefined) {
        repositoryFilters.status = filters.status as Booking['status'];
      }
      if (filters.dateFrom !== undefined) {
        repositoryFilters.dateFrom = filters.dateFrom;
      }
      if (filters.dateTo !== undefined) {
        repositoryFilters.dateTo = filters.dateTo;
      }

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
          // Chaîne vide = pas encore de prestataire assigné
          providerId: z.string(),
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
      if (!data.requesterId || typeof data.providerId !== 'string' || !data.serviceId) {
        throw new Error('Données de réservation incomplètes');
      }

      // track-progress crée un brouillon avant le choix du service (serviceId = « draft »).
      const isProgressDraft = data.serviceId === 'draft';

      if (!isProgressDraft) {
        // Invariants Catalog (domaine) — offre bookable (forced)
        const { getServiceRepository } = await import('@/repositories');
        const { CatalogService } = await import('@/domain/catalog');
        const catalogItem = await getServiceRepository().findByCustomId(
          data.serviceId,
        );
        if (!catalogItem) {
          throw new Error(`Catalog service not found: ${data.serviceId}`);
        }
        CatalogService.create({
          id: String(catalogItem.id || data.serviceId),
          name: String(
            (catalogItem as { label?: string; name?: string }).label ||
              (catalogItem as { name?: string }).name ||
              data.serviceId,
          ),
          category: String(
            (catalogItem as { category?: string }).category ||
              data.serviceType ||
              'HEALTH',
          ),
          price: Number((catalogItem as { price?: number }).price ?? 0),
          isActive: (catalogItem as { isActive?: boolean }).isActive !== false,
        }).assertBookable();
      }

      // Créer la réservation via le repository
      const booking = await this.bookingRepository.create({
        requesterId: data.requesterId,
        providerId: data.providerId,
        serviceId: data.serviceId,
        serviceType: data.serviceType,
        status: isProgressDraft ? BOOKING_STATUSES.DRAFT : BOOKING_STATUSES.PENDING,
        appointmentDate: data.appointmentDate,
        timeslot: data.timeslot,
        consultationMode: data.consultationMode,
        recipient: data.recipient,
        metadata: data.metadata,
      } as Partial<Booking>);

      // Réservation sans prestataire (ex. assistant de services) : rien à notifier,
      // l'assignation se fera plus tard via assign-provider.
      if (!isProviderUserId(booking.providerId)) {
        return booking;
      }

      // Notification provider (in-app): mission assignée
      try {
        const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
        const bookingsUrl = `${baseUrl}/dashboard/bookings`;
        const providerName =
          (data.metadata?.['providerName'] as string | undefined) || 'Prestataire';
        const reservationNumber =
          (booking as any).reservationNumber || booking.id?.slice(-8)?.toUpperCase() || booking._id?.toString?.() || '';
        const serviceName =
          (data.metadata?.['serviceLabel'] as string | undefined) ||
          (booking as any).serviceId ||
          'Service';

        const apptDate = booking.appointmentDate
          ? new Date(booking.appointmentDate).toLocaleDateString('fr-FR')
          : 'à confirmer';
        const apptTime =
          (booking as any).timeslot ||
          (booking.appointmentDate
            ? new Date(booking.appointmentDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '');

        await notificationService.sendNotification({
          recipient: booking.providerId,
          type: 'PROVIDER_BOOKING_ASSIGNED',
          template: 'provider_booking_assigned',
          data: {
            providerName,
            reservationNumber,
            serviceName,
            appointmentDate: apptDate,
            appointmentTime: apptTime,
            bookingsUrl,
          },
          channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
          locale: 'fr',
          priority: 'HIGH',
          userId: booking.providerId,
        } as any);

        // Notification CSM(s) (in-app): nouvelle réservation sur le portefeuille
        try {
          const { mongoClient } = await import('@/lib/mongodb');
          const mClient = await mongoClient;
          const db = mClient.db();
          const users = db.collection(DATABASE.COLLECTIONS.USERS);

          const csms = await users
            .find(
              {
                roles: { $in: [ROLES.CSM] },
                csmPortfolioProviderIds: booking.providerId,
              },
              { projection: { _id: 1 } },
            )
            .toArray();

          if (csms.length > 0) {
            const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
            const bookingsUrl = `${baseUrl}/dashboard/bookings`;

            await Promise.all(
              csms.map((csm: any) =>
                notificationService.sendNotification({
                  recipient: csm._id.toString(),
                  type: 'CSM_BOOKING_CREATED',
                  template: 'csm_booking_created',
                  data: {
                    reservationNumber,
                    providerName,
                    serviceName,
                    appointmentDate: apptDate,
                    appointmentTime: apptTime,
                    bookingsUrl,
                  },
                  channels: [{ type: 'IN_APP', enabled: true, priority: 'MEDIUM' }],
                  locale: 'fr',
                  priority: 'MEDIUM',
                  userId: csm._id.toString(),
                } as any),
              ),
            );
          }
        } catch (csmError) {
          logger.warn(
            { error: csmError, bookingId: booking.id },
            'Failed to notify CSM portfolio for booking creation',
          );
        }

        // Programmer un rappel in-app 24h avant si appointmentDate existe
        if (booking.appointmentDate) {
          const scheduledAt = new Date(
            new Date(booking.appointmentDate).getTime() - 24 * 60 * 60 * 1000,
          );
          await notificationService.sendNotification({
            recipient: booking.providerId,
            type: 'PROVIDER_BOOKING_REMINDER',
            template: 'provider_booking_reminder',
            data: {
              providerName,
              reservationNumber,
              serviceName,
              appointmentDate: apptDate,
              appointmentTime: apptTime,
              bookingsUrl,
            },
            channels: [{ type: 'IN_APP', enabled: true, priority: 'MEDIUM' }],
            locale: 'fr',
            priority: 'MEDIUM',
            scheduledAt,
            expiresAt: new Date(
              new Date(booking.appointmentDate).getTime() + 6 * 60 * 60 * 1000,
            ),
            userId: booking.providerId,
          } as any);
        }
      } catch (notifError) {
        logger.warn({ error: notifError, bookingId: booking.id }, 'Failed to notify provider for booking creation');
      }

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
          statusInData: 'status' in data ? (data as any).status : undefined,
          fullUpdateData: data,
        },
        'Updating booking',
      );

      // Si le statut change vers CONFIRMED ou FINISHED, mettre à jour le paymentStatus
      const statusInData = 'status' in data ? (data as any).status : undefined;
      const statusIsChanging = statusInData && statusInData !== existingBooking.status;
      const statusToConfirmedOrFinished = statusIsChanging && 
        (statusInData === BOOKING_STATUSES.CONFIRMED || statusInData === BOOKING_STATUSES.FINISHED);
      
      if (statusToConfirmedOrFinished) {
        const existingMetadata = existingBooking.metadata || {};
        const currentPaymentStatus = existingMetadata['paymentStatus'] as string | undefined;
        
        // Si le paiement n'est pas déjà confirmé, le marquer comme confirmé
        if (currentPaymentStatus !== 'confirmed' && currentPaymentStatus !== 'completed' && currentPaymentStatus !== 'succeeded') {
          logger.info(
            { 
              bookingId: id, 
              previousStatus: existingBooking.status,
              newStatus: statusInData,
              previousPaymentStatus: currentPaymentStatus,
            },
            'Updating paymentStatus to confirmed because booking status changed to CONFIRMED or FINISHED',
          );
          
          // Mettre à jour les métadonnées avec le nouveau paymentStatus
          if (!data.metadata) {
            data.metadata = {};
          }
          data.metadata = {
            ...existingMetadata,
            ...data.metadata,
            paymentStatus: 'confirmed',
            paymentPending: false,
          };
        }
      }

      const updatedBooking = await this.bookingRepository.update(
        id,
        data as Partial<Booking>,
      );
      
      logger.debug(
        {
          bookingId: id,
          requestedStatus: 'status' in data ? (data as any).status : undefined,
          updatedStatus: updatedBooking?.status,
          existingStatus: existingBooking.status,
        },
        'Booking update result',
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

      // Envoyer des notifications si le statut a changé
      const statusChanged = existingBooking.status !== updatedBooking.status;
      if (statusChanged) {
        try {
          const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
          const bookingsUrl = `${baseUrl}/dashboard/bookings`;
          const reservationNumber =
            (updatedBooking as any).reservationNumber ||
            (existingBooking as any).reservationNumber ||
            id.slice(-8).toUpperCase();
          const serviceName =
            (updatedBooking.metadata?.['serviceLabel'] as string | undefined) ||
            (existingBooking.metadata?.['serviceLabel'] as string | undefined) ||
            (updatedBooking as any).serviceId ||
            'Service';

          const appointmentDateValue =
            (updatedBooking as any).appointmentDate || (existingBooking as any).appointmentDate;
          const apptDate = appointmentDateValue
            ? new Date(appointmentDateValue).toLocaleDateString('fr-FR')
            : 'à confirmer';
          const apptTime =
            (updatedBooking as any).timeslot ||
            (existingBooking as any).timeslot ||
            (appointmentDateValue
              ? new Date(appointmentDateValue).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '');

          // Notification au client (requester)
          const requesterId = (updatedBooking as any).requesterId || (existingBooking as any).requesterId;
          const clientEmail =
            (updatedBooking.metadata?.['clientEmail'] as string | undefined) ||
            (existingBooking.metadata?.['clientEmail'] as string | undefined);
          
          if (requesterId) {
            const clientName =
              (updatedBooking.metadata?.['clientFirstName'] && updatedBooking.metadata?.['clientLastName']
                ? `${updatedBooking.metadata['clientFirstName']} ${updatedBooking.metadata['clientLastName']}`
                : undefined) ||
              (existingBooking.metadata?.['clientFirstName'] && existingBooking.metadata?.['clientLastName']
                ? `${existingBooking.metadata['clientFirstName']} ${existingBooking.metadata['clientLastName']}`
                : undefined);

            await notificationService.sendNotification({
              recipient: requesterId,
              type: updatedBooking.status === BOOKING_STATUSES.FINISHED 
                ? 'BOOKING_FINISHED' 
                : 'BOOKING_STATUS_UPDATED',
              template: updatedBooking.status === BOOKING_STATUSES.FINISHED 
                ? 'booking_finished' 
                : 'booking_status_updated',
              data: {
                reservationNumber,
                serviceName,
                appointmentDate: apptDate,
                appointmentTime: apptTime,
                status: updatedBooking.status,
                bookingsUrl,
                clientName,
              },
              channels: [
                { type: 'IN_APP', enabled: true, priority: 'HIGH' },
                { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
              ],
              locale: 'fr',
              priority: 'HIGH',
              userId: requesterId,
              ...(clientEmail ? { recipientEmail: clientEmail } : {}),
            } as any);
          }

          // Notification au prestataire si assigné
          const providerId = (updatedBooking as any).providerId || (existingBooking as any).providerId;
          if (isProviderUserId(providerId)) {
            const providerName =
              (updatedBooking.metadata?.['providerName'] as string | undefined) ||
              (existingBooking.metadata?.['providerName'] as string | undefined) ||
              'Prestataire';

            await notificationService.sendNotification({
              recipient: providerId,
              type: updatedBooking.status === BOOKING_STATUSES.FINISHED 
                ? 'PROVIDER_BOOKING_FINISHED' 
                : 'PROVIDER_BOOKING_STATUS_UPDATED',
              template: updatedBooking.status === BOOKING_STATUSES.FINISHED 
                ? 'provider_booking_finished' 
                : 'provider_booking_status_updated',
              data: {
                providerName,
                reservationNumber,
                serviceName,
                appointmentDate: apptDate,
                appointmentTime: apptTime,
                status: updatedBooking.status,
                bookingsUrl,
              },
              channels: [
                { type: 'IN_APP', enabled: true, priority: 'HIGH' },
                { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
              ],
              locale: 'fr',
              priority: 'HIGH',
              userId: providerId,
            } as any);
          }

          // Notification au bénéficiaire si email enregistré
          const beneficiaryEmail = (updatedBooking.metadata?.['beneficiaryEmail'] as string | undefined) ||
            (existingBooking.metadata?.['beneficiaryEmail'] as string | undefined);
          if (beneficiaryEmail && beneficiaryEmail !== clientEmail) {
            const beneficiaryName =
              (updatedBooking.metadata?.['beneficiaryFirstName'] && updatedBooking.metadata?.['beneficiaryLastName']
                ? `${updatedBooking.metadata['beneficiaryFirstName']} ${updatedBooking.metadata['beneficiaryLastName']}`
                : undefined) ||
              (existingBooking.metadata?.['beneficiaryFirstName'] && existingBooking.metadata?.['beneficiaryLastName']
                ? `${existingBooking.metadata['beneficiaryFirstName']} ${existingBooking.metadata['beneficiaryLastName']}`
                : undefined) ||
              'Bénéficiaire';

            await notificationService.sendNotification({
              recipient: beneficiaryEmail,
              type: 'BOOKING_STATUS_UPDATED',
              template: 'booking_status_updated',
              data: {
                reservationNumber,
                serviceName,
                appointmentDate: apptDate,
                appointmentTime: apptTime,
                status: updatedBooking.status,
                bookingsUrl,
                clientName: beneficiaryName,
              },
              channels: [
                { type: 'IN_APP', enabled: true, priority: 'HIGH' },
                { type: 'EMAIL', enabled: true, priority: 'MEDIUM' },
              ],
              locale: 'fr',
              priority: 'MEDIUM',
              recipientEmail: beneficiaryEmail,
            } as any);
          }

          // Notification aux admins
          try {
            const { mongoClient } = await import('@/lib/mongodb');
            const mClient = await mongoClient;
            const db = mClient.db();
            const users = db.collection(DATABASE.COLLECTIONS.USERS);

            const admins = await users
              .find(
                {
                  roles: { $in: [ROLES.ADMIN, ROLES.SUPERADMIN] },
                },
                { projection: { _id: 1, email: 1 } },
              )
              .toArray();

            if (admins.length > 0) {
              await Promise.all(
                admins.map((admin: any) =>
                  notificationService.sendNotification({
                    recipient: admin._id.toString(),
                    type: 'BOOKING_STATUS_UPDATED',
                    template: 'booking_status_updated',
                    data: {
                      reservationNumber,
                      serviceName,
                      appointmentDate: apptDate,
                      appointmentTime: apptTime,
                      status: updatedBooking.status,
                      bookingsUrl,
                    },
                    channels: [
                      { type: 'IN_APP', enabled: true, priority: 'MEDIUM' },
                      { type: 'EMAIL', enabled: admin.email ? true : false, priority: 'LOW' },
                    ],
                    locale: 'fr',
                    priority: 'MEDIUM',
                    userId: admin._id.toString(),
                    ...(admin.email ? { recipientEmail: admin.email } : {}),
                  } as any),
                ),
              );
            }
          } catch (adminNotifError) {
            logger.warn({ error: adminNotifError, bookingId: id }, 'Failed to notify admins');
          }

          // Notification aux CSM concernés (si provider assigné)
          if (providerId) {
            try {
              const { mongoClient } = await import('@/lib/mongodb');
              const mClient = await mongoClient;
              const db = mClient.db();
              const users = db.collection(DATABASE.COLLECTIONS.USERS);

              const csms = await users
                .find(
                  {
                    roles: { $in: [ROLES.CSM] },
                    csmPortfolioProviderIds: providerId,
                  },
                  { projection: { _id: 1, email: 1 } },
                )
                .toArray();

              if (csms.length > 0) {
                await Promise.all(
                  csms.map((csm: any) =>
                    notificationService.sendNotification({
                      recipient: csm._id.toString(),
                      type: 'CSM_BOOKING_STATUS_UPDATED',
                      template: 'csm_booking_status_updated',
                      data: {
                        reservationNumber,
                        serviceName,
                        appointmentDate: apptDate,
                        appointmentTime: apptTime,
                        status: updatedBooking.status,
                        bookingsUrl,
                      },
                      channels: [
                        { type: 'IN_APP', enabled: true, priority: 'MEDIUM' },
                        { type: 'EMAIL', enabled: csm.email ? true : false, priority: 'LOW' },
                      ],
                      locale: 'fr',
                      priority: 'MEDIUM',
                      userId: csm._id.toString(),
                      ...(csm.email ? { recipientEmail: csm.email } : {}),
                    } as any),
                  ),
                );
              }
            } catch (csmNotifError) {
              logger.warn({ error: csmNotifError, bookingId: id }, 'Failed to notify CSMs');
            }
          }
        } catch (statusNotifError) {
          logger.warn({ error: statusNotifError, bookingId: id }, 'Failed to send status change notifications');
        }
      }

      // Notification provider (in-app): mission mise à jour / (ré)assignée
      try {
        const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
        const bookingsUrl = `${baseUrl}/dashboard/bookings`;
        const providerId = (updatedBooking as any).providerId || (existingBooking as any).providerId;
        if (isProviderUserId(providerId)) {
          const providerName =
            (updatedBooking.metadata?.['providerName'] as string | undefined) ||
            (data.metadata?.['providerName'] as string | undefined) ||
            'Prestataire';
          const reservationNumber =
            (updatedBooking as any).reservationNumber ||
            (existingBooking as any).reservationNumber ||
            id.slice(-8).toUpperCase();
          const serviceName =
            (updatedBooking.metadata?.['serviceLabel'] as string | undefined) ||
            (existingBooking.metadata?.['serviceLabel'] as string | undefined) ||
            (updatedBooking as any).serviceId ||
            'Service';

          const appointmentDateValue =
            (updatedBooking as any).appointmentDate || (existingBooking as any).appointmentDate;
          const apptDate = appointmentDateValue
            ? new Date(appointmentDateValue).toLocaleDateString('fr-FR')
            : 'à confirmer';
          const apptTime =
            (updatedBooking as any).timeslot ||
            (existingBooking as any).timeslot ||
            (appointmentDateValue
              ? new Date(appointmentDateValue).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '');

          const wasReassigned =
            typeof (data as any).providerId === 'string' &&
            (data as any).providerId &&
            (data as any).providerId !== (existingBooking as any).providerId;

          await notificationService.sendNotification({
            recipient: wasReassigned ? (data as any).providerId : providerId,
            type: wasReassigned ? 'PROVIDER_BOOKING_ASSIGNED' : 'PROVIDER_BOOKING_UPDATED',
            template: wasReassigned ? 'provider_booking_assigned' : 'provider_booking_updated',
            data: {
              providerName,
              reservationNumber,
              serviceName,
              appointmentDate: apptDate,
              appointmentTime: apptTime,
              bookingsUrl,
            },
            channels: [{ type: 'IN_APP', enabled: true, priority: wasReassigned ? 'HIGH' : 'MEDIUM' }],
            locale: 'fr',
            priority: wasReassigned ? 'HIGH' : 'MEDIUM',
            userId: wasReassigned ? (data as any).providerId : providerId,
          } as any);

          // Reprogrammer un rappel 24h avant si appointmentDate a changé
          const appointmentChanged =
            (data as any).appointmentDate &&
            String((data as any).appointmentDate) !== String((existingBooking as any).appointmentDate);
          if (appointmentChanged && (data as any).appointmentDate) {
            const newAppt = new Date((data as any).appointmentDate);
            const scheduledAt = new Date(newAppt.getTime() - 24 * 60 * 60 * 1000);
            await notificationService.sendNotification({
              recipient: wasReassigned ? (data as any).providerId : providerId,
              type: 'PROVIDER_BOOKING_REMINDER',
              template: 'provider_booking_reminder',
              data: {
                providerName,
                reservationNumber,
                serviceName,
                appointmentDate: newAppt.toLocaleDateString('fr-FR'),
                appointmentTime: newAppt.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                bookingsUrl,
              },
              channels: [{ type: 'IN_APP', enabled: true, priority: 'MEDIUM' }],
              locale: 'fr',
              priority: 'MEDIUM',
              scheduledAt,
              expiresAt: new Date(newAppt.getTime() + 6 * 60 * 60 * 1000),
              userId: wasReassigned ? (data as any).providerId : providerId,
            } as any);
          }
        }
      } catch (notifError) {
        logger.warn({ error: notifError, bookingId: id }, 'Failed to notify provider for booking update');
      }

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
      const existing = await this.bookingRepository.findById(id);
      if (!existing) {
        throw new Error('Réservation non trouvée');
      }

      // Transitions validées via domaine (anti-corruption status)
      const {
        canTransitionBookingStatus,
        toDomainBookingStatus,
      } = await import('@/domain/booking');
      const from = toDomainBookingStatus(String(existing.status));
      const to = toDomainBookingStatus(String(status));
      if (!canTransitionBookingStatus(from, to)) {
        throw new Error(
          `Transition de statut booking invalide: ${from} → ${to}`,
        );
      }

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

      // Notification provider (in-app): mission annulée
      try {
        const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
        const bookingsUrl = `${baseUrl}/dashboard/bookings`;
        const providerName =
          (cancelledBooking.metadata?.['providerName'] as string | undefined) || 'Prestataire';
        const reservationNumber =
          (cancelledBooking as any).reservationNumber || id.slice(-8).toUpperCase();
        const serviceName =
          (cancelledBooking.metadata?.['serviceLabel'] as string | undefined) ||
          (cancelledBooking as any).serviceId ||
          'Service';

        const apptDate = cancelledBooking.appointmentDate
          ? new Date(cancelledBooking.appointmentDate).toLocaleDateString('fr-FR')
          : 'à confirmer';
        const apptTime =
          (cancelledBooking as any).timeslot ||
          (cancelledBooking.appointmentDate
            ? new Date(cancelledBooking.appointmentDate).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })
            : '');

        await notificationService.sendNotification({
          recipient: cancelledBooking.providerId,
          type: 'PROVIDER_BOOKING_CANCELLED',
          template: 'provider_booking_cancelled',
          data: {
            providerName,
            reservationNumber,
            serviceName,
            appointmentDate: apptDate,
            appointmentTime: apptTime,
            bookingsUrl,
          },
          channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
          locale: 'fr',
          priority: 'HIGH',
          userId: cancelledBooking.providerId,
        } as any);

        // Notification CSM(s) (in-app): annulation sur le portefeuille
        try {
          const { mongoClient } = await import('@/lib/mongodb');
          const mClient = await mongoClient;
          const db = mClient.db();
          const users = db.collection(DATABASE.COLLECTIONS.USERS);

          const csms = await users
            .find(
              {
                roles: { $in: [ROLES.CSM] },
                csmPortfolioProviderIds: cancelledBooking.providerId,
              },
              { projection: { _id: 1 } },
            )
            .toArray();

          if (csms.length > 0) {
            const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
            const bookingsUrl = `${baseUrl}/dashboard/bookings`;

            await Promise.all(
              csms.map((csm: any) =>
                notificationService.sendNotification({
                  recipient: csm._id.toString(),
                  type: 'CSM_BOOKING_CANCELLED',
                  template: 'csm_booking_cancelled',
                  data: {
                    reservationNumber,
                    providerName,
                    serviceName,
                    appointmentDate: apptDate,
                    appointmentTime: apptTime,
                    bookingsUrl,
                  },
                  channels: [{ type: 'IN_APP', enabled: true, priority: 'HIGH' }],
                  locale: 'fr',
                  priority: 'HIGH',
                  userId: csm._id.toString(),
                } as any),
              ),
            );
          }
        } catch (csmError) {
          logger.warn(
            { error: csmError, bookingId: id },
            'Failed to notify CSM portfolio for booking cancellation',
          );
        }
      } catch (notifError) {
        logger.warn({ error: notifError, bookingId: id }, 'Failed to notify provider for booking cancellation');
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
          { limit: 1, page: 1 },
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
      // Définir les noms d'étapes une seule fois
      const stepNames: Record<number, string> = {
        1: 'Informations client',
        2: 'Sélection du service',
        3: 'Paiement',
        4: 'Confirmation',
      };

      // Récupérer la réservation
      const booking = await this.bookingRepository.findById(id);
      if (!booking) {
        throw new ExpectedDomainError('Réservation non trouvée');
      }

      const metadata: Record<string, unknown> = booking.metadata || {};
      const currentStep = (metadata['currentStep'] as number) || 0;
      const progressHistoryValue = metadata['progressHistory'];
      const progressHistory = Array.isArray(progressHistoryValue)
        ? progressHistoryValue.filter(isProgressHistoryEntry)
        : [];

      // Récupérer toutes les étapes complétées
      const completedSteps = progressHistory
        .filter((historyEntry) => historyEntry.completed === true)
        .map((historyEntry) => historyEntry.step)
        .filter((historyStep): historyStep is number => typeof historyStep === 'number');
      
      const maxCompletedStep = completedSteps.length > 0 ? Math.max(...completedSteps) : 0;
      
      // Si une étape ultérieure est complétée, l'étape demandée est automatiquement considérée comme complétée
      if (maxCompletedStep > step) {
        const requestedStepName = stepNames[step] || `Étape ${step}`;
        const maxStepName = stepNames[maxCompletedStep] || `Étape ${maxCompletedStep}`;
        throw new ExpectedDomainError(
          `L'étape ${step} (${requestedStepName}) est déjà complétée. ` +
          `L'étape ${maxCompletedStep} (${maxStepName}) ayant été validée, toutes les étapes précédentes sont considérées comme complétées.`,
        );
      }

      // Vérifier si l'étape est déjà complétée dans l'historique
      const stepHistory = progressHistory.find((historyEntry) => (
        historyEntry.step === step && historyEntry.completed === true
      ));
      if (stepHistory) {
        // Si l'étape est déjà complétée, vérifier si c'est l'étape actuelle
        // Si c'est l'étape actuelle et qu'elle est complétée, on peut quand même avancer
        if (step === currentStep) {
          // L'étape actuelle est complétée, on peut passer à l'étape suivante
          // Mais on ne peut pas re-valider la même étape
          throw new ExpectedDomainError(`L'étape ${step} est déjà complétée. Vous pouvez valider l'étape suivante (${step + 1}).`);
        } else {
          throw new ExpectedDomainError(`L'étape ${step} est déjà complétée.`);
        }
      }

      // Vérifier que toutes les étapes précédentes sont complétées avant de valider une étape
      if (step > 1) {
        const missingSteps: number[] = [];
        for (let i = 1; i < step; i++) {
          // Vérifier si l'étape i est complétée (soit directement, soit via une étape ultérieure)
          const isStepCompleted = completedSteps.includes(i) || maxCompletedStep > i;
          if (!isStepCompleted) {
            missingSteps.push(i);
          }
        }

        if (missingSteps.length > 0) {
          const requestedStepName = stepNames[step] || `Étape ${step}`;
          const missingStepsNames = missingSteps
            .map((s) => `${s} (${stepNames[s] || `Étape ${s}`})`)
            .join(', ');
          throw new ExpectedDomainError(
            `Impossible de valider l'étape ${step} (${requestedStepName}) : ` +
            `les étapes précédentes doivent être complétées en premier. ` +
            `Étapes manquantes : ${missingStepsNames}. ` +
            `Veuillez valider les étapes dans l'ordre (1, 2, 3, 4).`,
          );
        }
      }

      // On peut valider l'étape actuelle (où l'utilisateur s'est arrêté) ou l'étape suivante
      // Si currentStep est 1, cela signifie que l'utilisateur est bloqué à l'étape 1, donc on peut valider l'étape 1
      if (step < currentStep) {
        const currentStepName = stepNames[currentStep] || `Étape ${currentStep}`;
        const requestedStepName = stepNames[step] || `Étape ${step}`;
        throw new ExpectedDomainError(
          `Impossible de valider l'étape ${step} (${requestedStepName}) : elle est déjà passée. ` +
          `La réservation est actuellement à l'étape ${currentStep} (${currentStepName}). ` +
          `Vous pouvez uniquement valider l'étape actuelle (${currentStep}) ou l'étape suivante (${currentStep + 1}).`,
        );
      }

      // Vérifier que l'étape n'est pas trop loin dans le futur (max 1 étape d'avance)
      if (step > currentStep + 1) {
        throw new ExpectedDomainError(`Vous ne pouvez valider que l'étape actuelle (${currentStep}) ou l'étape suivante (${currentStep + 1}). L'étape ${step} ne peut pas être validée directement.`);
      }

      // Construire le nom complet de l'étape
      const stepName = `Étape ${step} : ${stepNames[step] || `Étape ${step}`}`;

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
                  { bookingId: id, checkoutSessionId, paymentUrl: `${paymentUrl.substring(0, 50)  }...` },
                  'Checkout session created for step 3 validation',
                );

                // Envoyer l'email avec le lien de paiement
                const clientName = clientFirstName && clientLastName
                  ? `${clientFirstName} ${clientLastName}`
                  : clientFirstName || clientLastName || 'Client';

                const reservationLabel = booking.reservationNumber || id;
                EmailDispatch.of({
                  to: clientEmail,
                  subject: `Paiement de votre commande ${reservationLabel} - DiaspoMoney`,
                  templateId: 'payment_link',
                });

                const emailSent = await sendPaymentLinkEmail(
                  clientEmail,
                  clientName,
                  reservationLabel,
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
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            logger.error({ 
              error: errorMessage, 
              errorDetails: error,
              bookingId: id, 
              step, 
            }, 'Error creating payment link for step 3');
            Sentry.captureException(error, {
              tags: { component: 'BookingService', method: 'validateStep', step: 3 },
              extra: { bookingId: id, step, errorMessage },
            });
            // Ne pas bloquer la validation si l'envoi du lien échoue
            // L'admin peut valider l'étape même sans générer de lien
            // Mais on log l'erreur pour le débogage
            if (errorMessage.includes('Stripe') || errorMessage.includes('STRIPE_SECRET_KEY')) {
              logger.warn({ bookingId: id }, 'Stripe configuration issue detected. Step validation will continue without payment link.');
            }
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
            const options: unknown = typeof metadata['additionalOptions'] === 'string'
              ? JSON.parse(metadata['additionalOptions'])
              : metadata['additionalOptions'];
            if (Array.isArray(options)) {
              return options.reduce((sum: number, opt: unknown) => {
                if (!isPricedOption(opt)) {
                  return sum;
                }
                const optPrice = typeof opt.price === 'number'
                  ? opt.price
                  : parseFloat(opt.price ?? '') || 0;
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
      const calculatedTotalAmount = subtotal - discountAmount;

      // Mettre à jour les métadonnées
      const updatedMetadata: Record<string, unknown> = {
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
      const updateData: Partial<Booking> = {
        metadata: updatedMetadata,
      };
      
      if (step === 4) {
        updatedMetadata['isDraft'] = false;
        // Optionnellement, mettre à jour le statut de la réservation
        if (booking.status === BOOKING_STATUSES.DRAFT) {
          updateData.status = BOOKING_STATUSES.PENDING;
        }
      }

      // Mettre à jour la réservation en une seule opération
      const updatedBooking = await this.bookingRepository.update(id, updateData);

      if (!updatedBooking) {
        // Le repository a retourné null, ce qui peut arriver si :
        // 1. Le document a été supprimé entre la vérification et la mise à jour (race condition)
        // 2. Le mapping a échoué
        // Tentons de récupérer le booking à nouveau pour vérifier s'il existe toujours
        logger.warn(
          { 
            bookingId: id, 
            step, 
            metadataKeys: Object.keys(updatedMetadata),
            metadataSize: JSON.stringify(updatedMetadata).length,
            updateData,
          },
          'Repository returned null after update, attempting to refetch booking',
        );
        
        const refetchedBooking = await this.bookingRepository.findById(id);
        if (!refetchedBooking) {
          logger.error(
            { 
              bookingId: id,
              step,
              updateData,
            },
            'Booking not found after update - document may have been deleted',
          );
          throw new Error('Erreur lors de la mise à jour de la réservation. La réservation n\'a pas pu être trouvée ou mise à jour.');
        }
        
        // Le booking existe toujours, vérifier si la mise à jour a été appliquée
        // en comparant les métadonnées
        const refetchedMetadata = refetchedBooking.metadata || {};
        const expectedStep = updatedMetadata['currentStep'];
        const actualStep = refetchedMetadata['currentStep'];
        
        if (expectedStep && actualStep === expectedStep) {
          // La mise à jour semble avoir été appliquée malgré le null
          logger.info(
            { bookingId: id, step, expectedStep, actualStep },
            'Booking refetched successfully after update returned null - update appears to have been applied',
          );
          return refetchedBooking;
        }
        
        // La mise à jour n'a pas été appliquée, réessayer une fois
        logger.warn(
          { bookingId: id, step, expectedStep, actualStep },
          'Update not applied, retrying once',
        );
        
        const retryBooking = await this.bookingRepository.update(id, updateData);
        if (!retryBooking) {
          logger.error(
            { 
              bookingId: id,
              step,
              updateData,
            },
            'Failed to update booking after retry - repository returned null again',
          );
          throw new Error('Erreur lors de la mise à jour de la réservation. La réservation n\'a pas pu être trouvée ou mise à jour.');
        }
        
        logger.info(
          { bookingId: id, step },
          'Booking updated successfully after retry',
        );
        return retryBooking;
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
      if (error instanceof ExpectedDomainError) {
        logger.warn(
          { id, step, errorMessage: error.message },
          'Validation d\'étape refusée',
        );
        throw error;
      }

      // Extraire les détails de l'erreur de manière sécurisée pour le logging
      let errorMessage = 'Erreur inconnue';
      let errorStack: string | undefined;
      let errorName: string | undefined;
      
      if (error instanceof Error) {
        errorMessage = error.message || 'Erreur inconnue';
        errorStack = error.stack;
        errorName = error.name;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        const errorRecord = error as Record<string, unknown>;
        const message = errorRecord['message'];
        const errorValue = errorRecord['error'];
        const stack = errorRecord['stack'];
        const name = errorRecord['name'];

        errorMessage =
          (typeof message === 'string' && message) ||
          (typeof errorValue === 'string' && errorValue) ||
          JSON.stringify(error);
        errorStack = typeof stack === 'string' ? stack : undefined;
        errorName = typeof name === 'string' ? name : undefined;
      }
      
      logger.error({ 
        errorMessage,
        errorName,
        errorStack,
        errorType: typeof error,
        id, 
        step, 
      }, 'Erreur validateStep');
      Sentry.captureException(error);
      throw error;
    }
  }
}

// Export singleton
export const bookingService = BookingService.getInstance();

