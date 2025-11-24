/**
 * API Route pour récupérer, mettre à jour et annuler une réservation par ID
 * Implémente les design patterns :
 * - Service Layer Pattern (via bookingService)
 * - Repository Pattern (via bookingService qui utilise les repositories)
 * - Dependency Injection (via bookingService singleton)
 * - Logger Pattern (structured logging avec childLogger + @Log decorator dans le service)
 * - Middleware Pattern (authentification)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache dans bookingService)
 * - Singleton Pattern (bookingService)
 */

import { auth } from '@/auth';
import { validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { UpdateBookingSchema, type UpdateBookingInput } from '@/lib/validations/booking.schema';
import { bookingService } from '@/services/booking/booking.service';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/bookings/[id] - Récupérer une réservation par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]',
  });

  try {
    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      log.warn({ bookingId }, 'Invalid booking ID format');
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 },
      );
    }

    log.debug({ bookingId }, 'Fetching booking');

    // Utiliser le service avec décorateurs (@Log, @Cacheable)
    const booking = await bookingService.getBookingById(bookingId);

    if (!booking) {
      log.warn({ bookingId }, 'Booking not found');
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 },
      );
    }

    // Mapper le booking avec bookingMapper pour garantir un format cohérent
    const { bookingMapper } = await import('@/lib/mappers');
    const mappedBooking = bookingMapper.map(booking as any);

    log.info(
      { bookingId, status: mappedBooking.status },
      'Booking fetched successfully',
    );

    return NextResponse.json({
      success: true,
      booking: mappedBooking,
    });
  } catch (error) {
    const resolvedParams = await Promise.resolve(params);
    log.error(
      { error, bookingId: resolvedParams.id, msg: 'Error fetching booking' },
      'Error fetching booking',
    );

    // Gérer le cas où la réservation n'est pas trouvée
    if (error instanceof Error && error.message === 'Réservation non trouvée') {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/bookings/[id] - Mettre à jour une réservation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]',
  });

  // Logger immédiatement pour vérifier que la route est appelée
  log.info({ msg: 'PUT /api/bookings/[id] called' });

  // Résoudre params en dehors du try-catch pour qu'il soit accessible partout
  let bookingId: string;
  try {
    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = await Promise.resolve(params);
    bookingId = resolvedParams.id;
    
    log.info({ bookingId, msg: 'PUT handler started' });
  } catch (paramError) {
    log.error({ error: paramError, msg: 'Error resolving params' });
    return NextResponse.json(
      { error: 'Erreur lors de la résolution des paramètres' },
      { status: 400 },
    );
  }

  try {

    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      log.warn({ bookingId }, 'Invalid booking ID format');
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 },
      );
    }

    const body = await request.json();
    
    // Validation avec Zod
    const data: UpdateBookingInput = validateBody(body, UpdateBookingSchema);
    
    log.debug(
      { bookingId, fields: Object.keys(data) },
      'Updating booking',
    );

    // Construire l'objet de mise à jour avec seulement les propriétés définies
    const updateData: any = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.appointmentDate !== undefined) {
      updateData.appointmentDate = typeof data.appointmentDate === 'string' 
        ? new Date(data.appointmentDate) 
        : data.appointmentDate;
    }
    if (data.timeslot !== undefined) updateData.timeslot = data.timeslot;
    if (data.consultationMode !== undefined) updateData.consultationMode = data.consultationMode;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache)
    const updatedBooking = await bookingService.updateBooking(bookingId, updateData);

    if (!updatedBooking) {
      log.warn({ bookingId }, 'Booking not found after update');
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 },
      );
    }

    // Le booking retourné par updateBooking est déjà un Booking mappé
    // On doit le convertir en BookingResponse pour l'API
    // Utiliser le mapper pour garantir la cohérence avec les autres endpoints
    const { bookingMapper } = await import('@/lib/mappers');
    
    // Convertir le Booking en BookingDocument pour le mapper
    // Le mapper attend un BookingDocument (document MongoDB), pas un Booking déjà mappé
    const bookingDoc: any = {
      _id: updatedBooking._id,
      id: updatedBooking.id,
      reservationNumber: updatedBooking.reservationNumber,
      requesterId: updatedBooking.requesterId,
      providerId: updatedBooking.providerId,
      serviceId: updatedBooking.serviceId,
      serviceType: updatedBooking.serviceType,
      status: updatedBooking.status, // Le statut est déjà au bon format depuis le repository
      timeslot: updatedBooking.timeslot,
      consultationMode: updatedBooking.consultationMode,
      recipient: updatedBooking.recipient,
      metadata: updatedBooking.metadata,
      createdAt: updatedBooking.createdAt,
      updatedAt: updatedBooking.updatedAt,
    };
    
    // Ajouter appointmentDate seulement s'il existe
    if (updatedBooking.appointmentDate) {
      bookingDoc.appointmentDate = updatedBooking.appointmentDate;
    }
    
    // Utiliser le mapper pour garantir la cohérence
    let mappedBooking;
    try {
      mappedBooking = bookingMapper.map(bookingDoc);
    } catch (mapperError) {
      log.error(
        { 
          error: mapperError instanceof Error ? {
            name: mapperError.name,
            message: mapperError.message,
            stack: mapperError.stack,
          } : mapperError,
          bookingId,
          bookingDoc,
        },
        'Error mapping booking in PUT handler',
      );
      // En cas d'erreur de mapping, créer manuellement le BookingResponse
      mappedBooking = {
        id: updatedBooking.id,
        _id: updatedBooking._id,
        reservationNumber: updatedBooking.reservationNumber,
        requesterId: updatedBooking.requesterId,
        providerId: updatedBooking.providerId,
        serviceId: updatedBooking.serviceId,
        serviceType: updatedBooking.serviceType,
        status: updatedBooking.status,
        appointmentDate: updatedBooking.appointmentDate 
          ? (updatedBooking.appointmentDate instanceof Date 
              ? updatedBooking.appointmentDate.toISOString() 
              : new Date(updatedBooking.appointmentDate).toISOString())
          : undefined,
        timeslot: updatedBooking.timeslot,
        consultationMode: updatedBooking.consultationMode,
        recipient: updatedBooking.recipient,
        metadata: updatedBooking.metadata,
        createdAt: updatedBooking.createdAt instanceof Date 
          ? updatedBooking.createdAt.toISOString() 
          : new Date(updatedBooking.createdAt).toISOString(),
        updatedAt: updatedBooking.updatedAt instanceof Date 
          ? updatedBooking.updatedAt.toISOString() 
          : new Date(updatedBooking.updatedAt).toISOString(),
      };
    }

    log.info(
      { bookingId, status: mappedBooking.status },
      'Booking updated successfully',
    );

    return NextResponse.json({
      success: true,
      message: 'Réservation mise à jour avec succès',
      booking: mappedBooking,
    });
  } catch (error) {
    // bookingId est maintenant accessible depuis le scope externe
    // Logger l'erreur complète pour le débogage
    log.error(
      { 
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        } : error,
        bookingId,
        msg: 'Error updating booking', 
      },
      'Error updating booking',
    );

    if (error instanceof Error && error.message === 'Réservation non trouvée') {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 },
      );
    }

    // Retourner un message d'erreur plus détaillé en développement
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Erreur lors de la mise à jour de la réservation';
    
    return NextResponse.json(
      { 
        error: process.env.NODE_ENV === 'development' 
          ? errorMessage 
          : 'Erreur lors de la mise à jour de la réservation',
        ...(process.env.NODE_ENV === 'development' && error instanceof Error && {
          details: error.stack,
        }),
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/bookings/[id]/cancel - Annuler une réservation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Gérer params qui peut être une Promise dans Next.js 15+
    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      log.warn({ bookingId }, 'Invalid booking ID format');
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 },
      );
    }

    log.debug(
      { bookingId, userId: session.user.id },
      'Cancelling booking',
    );

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache)
    const cancelledBooking = await bookingService.cancelBooking(bookingId);

    log.info(
      { bookingId, userId: session.user.id },
      'Booking cancelled successfully',
    );

    return NextResponse.json({
      success: true,
      message: 'Réservation annulée avec succès',
      booking: cancelledBooking,
    });
  } catch (error) {
    const resolvedParams = await Promise.resolve(params);
    log.error(
      { error, bookingId: resolvedParams.id, msg: 'Error cancelling booking' },
      'Error cancelling booking',
    );

    if (error instanceof Error) {
      if (error.message === 'Réservation non trouvée') {
        return NextResponse.json(
          { error: 'Réservation non trouvée' },
          { status: 404 },
        );
      }
      if (
        error.message.includes('déjà annulée') ||
        error.message.includes('terminée')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: "Erreur lors de l'annulation de la réservation" },
      { status: 500 },
    );
  }
}
