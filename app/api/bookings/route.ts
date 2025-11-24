import { BookingQueryBuilder } from "@/builders";
// Désactiver le prerendering pour cette route API
export const dynamic = 'force-dynamic';

import { handleApiRoute, ApiError, validateBody } from '@/lib/api/error-handler';
import { createPaginatedResponse, createResourceResponse } from '@/lib/api/response';
import type { BookingFacadeData } from '@/lib/types';
import { CreateBookingSchema, type CreateBookingInput } from '@/lib/validations/booking.schema';
import { initializeDI } from "@/lib/di/initialize";
import { logger } from "@/lib/logger";
import { getBookingRepository } from "@/repositories";
import { serviceBookingFacade } from "@/facades";
import { NextRequest } from "next/server";

// ---------------------------------------------
// CONSTANTS
// ---------------------------------------------
const PAGINATION_DEFAULT_LIMIT = 50;

import { BOOKING_STATUSES } from '@/lib/constants';

// The allowed statuses for filtering
const VALID_STATUSES = [
  BOOKING_STATUSES.PENDING,
  BOOKING_STATUSES.CONFIRMED,
  BOOKING_STATUSES.COMPLETED,
  BOOKING_STATUSES.CANCELLED,
  BOOKING_STATUSES.NO_SHOW,
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const providerId = searchParams.get("providerId");
    const status = searchParams.get("status");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Utiliser BookingQueryBuilder pour construire la requête (Builder Pattern)
    const queryBuilder = new BookingQueryBuilder();

    // Appliquer les filtres
    if (userId) {
      queryBuilder.byRequester(userId);
    }
    if (providerId) {
      queryBuilder.byProvider(providerId);
    }
    if (status && VALID_STATUSES.includes(status as ValidStatus)) {
      // Accept only known statuses
      queryBuilder.byStatus(status as ValidStatus);
    }

    // Pagination avec valeurs par défaut
    const pageLimit = limit ? parseInt(limit) : PAGINATION_DEFAULT_LIMIT;
    const pageOffset = offset ? parseInt(offset) : 0;
    const page = Math.floor(pageOffset / pageLimit) + 1;
    queryBuilder.page(page, pageLimit);

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
