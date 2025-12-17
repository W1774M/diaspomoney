import { BookingQueryBuilder } from "@/builders";

import { handleApiRoute, ApiError, validateBody, ApiErrors } from '@/lib/api/error-handler';
import { createPaginatedResponse, createResourceResponse } from '@/lib/api/response';
import type { BookingFacadeData } from '@/lib/types';
import { CreateBookingSchema, type CreateBookingInput } from '@/lib/validations/booking.schema';
import { initializeDI } from "@/lib/di/initialize";
import { logger } from "@/lib/logger";
import { getBookingRepository } from "@/repositories";
import { serviceBookingFacade } from "@/facades";
import { NextRequest } from "next/server";
import { auth } from '@/auth';
import { ROLES } from '@/lib/constants';

// ---------------------------------------------
// CONSTANTS
// ---------------------------------------------
const PAGINATION_DEFAULT_LIMIT = 50;

import { BOOKING_STATUSES, TRANSACTION_STATUSES } from '@/lib/constants';

// The allowed statuses for filtering
const VALID_STATUSES = [
  BOOKING_STATUSES.DRAFT,
  BOOKING_STATUSES.PENDING,
  BOOKING_STATUSES.CONFIRMED,
  BOOKING_STATUSES.FINISHED,
  BOOKING_STATUSES.CANCELLED,
] as const;
type ValidStatus = typeof VALID_STATUSES[number];

// ---------------------------------------------
// INITIALIZE DI
// ---------------------------------------------

if (typeof window === 'undefined') {
  initializeDI();
}

/**
 * GET /api/bookings - Récupérer les réservations
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
    const isProvider = userRoles.includes(ROLES.PROVIDER);
    const isCustomer = userRoles.includes(ROLES.CUSTOMER);
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const requestedProviderId = searchParams.get("providerId");
    const viewMode = searchParams.get("viewMode"); // "customer" ou "provider"
    const status = searchParams.get("status");
    const paymentStatus = searchParams.get("paymentStatus");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const sortBy = searchParams.get("sortBy");
    const sortOrder = searchParams.get("sortOrder") || 'desc'; // Par défaut, tri décroissant

    // Construire les filtres pour le repository
    const bookingFilters: Record<string, any> = {};
    
    // Logique de filtrage basée sur les rôles et permissions
    // IMPORTANT : Les non-admins ne peuvent JAMAIS voir les commandes d'autres utilisateurs
    // Les paramètres userId et providerId dans l'URL sont ignorés pour les non-admins
    
    if (isAdmin) {
      // Les admins peuvent voir toutes les commandes
      // Ils peuvent aussi filtrer par userId ou providerId s'ils sont fournis
      if (requestedUserId) {
        bookingFilters["requesterId"] = requestedUserId;
      }
      if (requestedProviderId) {
        bookingFilters["providerId"] = requestedProviderId;
      }
      // Si aucun filtre n'est fourni, les admins voient toutes les commandes (pas de filtre appliqué)
    } else {
      // Pour les non-admins, FORCER le filtrage par leur propre userId
      // Ignorer complètement les paramètres userId/providerId de l'URL pour éviter les contournements
      
      if (isProvider && isCustomer) {
        // Utilisateur avec les deux rôles : permettre de switcher via viewMode
        if (viewMode === 'provider') {
          // Vue provider : voir uniquement les commandes où il est le provider
          bookingFilters["providerId"] = userId;
        } else {
          // Vue customer (par défaut) : voir uniquement les commandes où il est le requester
          bookingFilters["requesterId"] = userId;
        }
      } else if (isProvider) {
        // Provider uniquement : voir uniquement ses propres commandes (où il est le provider)
        bookingFilters["providerId"] = userId;
      } else if (isCustomer) {
        // Customer uniquement : voir uniquement ses propres commandes (où il est le requester)
        bookingFilters["requesterId"] = userId;
      } else {
        // Aucun rôle valide : refuser l'accès
        throw ApiErrors.FORBIDDEN;
      }
      
      // SÉCURITÉ : S'assurer qu'un filtre est toujours appliqué pour les non-admins
      // Si aucun filtre n'est défini, c'est une erreur de sécurité
      if (!bookingFilters["requesterId"] && !bookingFilters["providerId"]) {
        logger.warn(
          { userId, roles: userRoles, viewMode, isProvider, isCustomer },
          'No booking filter applied for non-admin user - security issue',
        );
        throw ApiErrors.FORBIDDEN;
      }
      
      // Log de sécurité pour vérifier que le filtrage est bien appliqué
      logger.debug(
        {
          userId,
          roles: userRoles,
          viewMode,
          filterApplied: bookingFilters["requesterId"] ? 'requesterId' : 'providerId',
          filterValue: bookingFilters["requesterId"] || bookingFilters["providerId"],
        },
        'Booking filter applied for non-admin user',
      );
    }
    if (status && VALID_STATUSES.includes(status as ValidStatus)) {
      bookingFilters["status"] = status;
    }
    if (paymentStatus && Object.values(TRANSACTION_STATUSES).includes(paymentStatus as any)) {
      // Passer paymentStatus dans les filtres pour que buildBookingQuery le gère
      // Passer paymentStatus dans les filtres pour que buildBookingQuery le gère
      bookingFilters["paymentStatus"] = paymentStatus;
    }

    // Utiliser BookingQueryBuilder pour construire la requête (Builder Pattern)
    const queryBuilder = new BookingQueryBuilder();

    // Appliquer les filtres
    if (bookingFilters["requesterId"]) {
      queryBuilder.byRequester(bookingFilters["requesterId"]);
    }
    if (bookingFilters["providerId"]) {
      queryBuilder.byProvider(bookingFilters["providerId"]);
    }
    if (bookingFilters["status"]) {
      queryBuilder.byStatus(bookingFilters["status"] as ValidStatus);
    }
    if (bookingFilters["paymentStatus"]) {
      queryBuilder.byPaymentStatus(bookingFilters["paymentStatus"]);
    }

    // Pagination avec valeurs par défaut
    const pageLimit = limit ? parseInt(limit) : PAGINATION_DEFAULT_LIMIT;
    const pageOffset = offset ? parseInt(offset) : 0;
    const page = Math.floor(pageOffset / pageLimit) + 1;
    queryBuilder.page(page, pageLimit);

    // Tri
    if (sortBy) {
      const direction = sortOrder === 'asc' ? 'asc' : 'desc';
      // Mapper les champs de tri
      switch (sortBy) {
        case 'appointmentDate':
          queryBuilder.orderByAppointmentDate(direction);
          break;
        case 'createdAt':
          queryBuilder.orderByCreatedAt(direction);
          break;
        case 'reservationNumber':
          queryBuilder.orderByReservationNumber(direction);
          break;
        case 'amount':
          queryBuilder.orderByAmount(direction);
          break;
        case 'completionRate':
          queryBuilder.orderByCompletionRate(direction);
          break;
        default:
          // Par défaut, trier par date de création décroissante
          queryBuilder.orderByCreatedAt('desc');
      }
    } else {
      // Par défaut, trier par date de création décroissante
      queryBuilder.orderByCreatedAt('desc');
    }

    // Construire la requête
    const query = queryBuilder.build();

    // Utiliser le repository avec les filtres du builder
    const bookingRepository = getBookingRepository();
    // Ensure pagination keys are defined
    const repoLimit = query.pagination?.limit ?? pageLimit;
    const repoPage = query.pagination?.page ?? page;
    const repoOffset = (repoPage - 1) * repoLimit;

    const result = await bookingRepository.findBookingsWithFilters(
      query.filters,
      {
        limit: repoLimit,
        page: repoPage,
        offset: repoOffset,
        sort: query.sort,
      },
    );

    // Mapper les bookings avec bookingMapper pour garantir un format cohérent
    const { bookingMapper } = await import('@/lib/mappers');
    const mappedBookings = bookingMapper.mapMany(result.data as any[]);

    return createPaginatedResponse(
      mappedBookings,
      {
        page: repoPage,
        limit: repoLimit,
        total: result.total,
      },
    );
  }, 'api/bookings');
}

/**
 * POST /api/bookings - Créer une nouvelle réservation
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Validation avec Zod
    const body = await request.json();
    const data = validateBody(body, CreateBookingSchema) as CreateBookingInput;

    // Si un paiement est inclus, utiliser la facade avec Command Pattern pour orchestrer tout le processus
    if (data.payment) {
      // Build strictly-typed bookingData according to BookingFacadeData
      const bookingData: BookingFacadeData = {
        requesterId: data.requesterId,
        providerId: data.providerId,
        serviceId: data.serviceId ?? 'default',
        serviceType: data.serviceType,
        appointmentDate: data.appointmentDate
          ? (typeof data.appointmentDate === 'string'
              ? new Date(data.appointmentDate)
              : data.appointmentDate)
          : new Date(),
        timeslot: typeof data.timeslot === "string" ? data.timeslot : undefined,
        consultationMode: (data.consultationMode as 'IN_PERSON' | 'TELEMEDICINE' | 'HYBRID') ?? undefined,
        recipient: data.recipient
          ? typeof data.recipient === 'string'
            ? data.recipient
            : `${data.recipient.firstName} ${data.recipient.lastName}`.trim()
          : undefined,
        payment: data.payment as BookingFacadeData['payment'] | undefined,
        metadata: data.metadata as Record<string, string> | undefined,
      } as BookingFacadeData;

      // Utiliser serviceBookingFacade directement (logique fusionnée de BookingFacade)
      const result = await serviceBookingFacade.createBookingWithPayment(bookingData);

      if (!result.success) {
        throw new ApiError(400, result.error || 'Erreur lors de la création de la réservation');
      }

      // Extraire l'ID de booking de manière type-safe
      const bookingId = result.booking?.id ||
        (result.booking && '_id' in result.booking ? String(result.booking._id) : undefined);

      logger.info({
        bookingId,
        paymentSuccess: result.paymentResult?.success,
      }, 'Booking created with payment via ServiceBookingFacade');

      return createResourceResponse(
        result.booking,
        {
          message: "Rendez-vous créé avec paiement traité avec succès",
          metadata: {
            paymentResult: result.paymentResult,
          },
        },
      );
    }

    // Sinon, créer simplement la réservation sans paiement
    const bookingData: BookingFacadeData = {
      requesterId: data.requesterId,
      providerId: data.providerId,
      serviceId: data.serviceId ?? 'default',
      serviceType: data.serviceType,
      appointmentDate: data.appointmentDate
        ? (typeof data.appointmentDate === 'string'
            ? new Date(data.appointmentDate)
            : data.appointmentDate)
        : new Date(),
      timeslot: typeof data.timeslot === "string" ? data.timeslot : undefined,
      consultationMode: (data.consultationMode as 'IN_PERSON' | 'TELEMEDICINE' | 'HYBRID') ?? undefined,
      recipient: data.recipient
        ? typeof data.recipient === 'string' 
          ? data.recipient
          : `${data.recipient.firstName} ${data.recipient.lastName}`.trim()
        : undefined,
      metadata: data.metadata as Record<string, string> | undefined,
    } as BookingFacadeData;

    // Utiliser serviceBookingFacade pour créer la réservation sans paiement
    const result = await serviceBookingFacade.createBookingWithPayment({
      ...bookingData,
      payment: undefined as any,
    });

    if (!result.success) {
      throw new ApiError(400, result.error || 'Erreur lors de la création de la réservation');
    }

    return createResourceResponse(
      result.booking,
      {
        message: "Rendez-vous créé avec succès",
      },
    );
  }, 'api/bookings');
}
