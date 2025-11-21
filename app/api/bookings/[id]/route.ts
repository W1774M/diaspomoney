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
  { params }: { params: { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]',
  });

  try {
    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      log.warn({ bookingId: params.id }, 'Invalid booking ID format');
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 },
      );
    }

    log.debug({ bookingId: params.id }, 'Fetching booking');

    // Utiliser le service avec décorateurs (@Log, @Cacheable)
    const booking = await bookingService.getBookingById(params.id);

    log.info(
      { bookingId: params.id, status: booking.status },
      'Booking fetched successfully',
    );

    return NextResponse.json({
      success: true,
      booking,
    });
  } catch (error) {
    log.error(
      { error, bookingId: params.id, msg: 'Error fetching booking' },
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
  { params }: { params: { id: string } },
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

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      log.warn({ bookingId: params.id }, 'Invalid booking ID format');
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 },
      );
    }

    const body = await request.json();
    
    // Validation avec Zod
    const data: UpdateBookingInput = validateBody(body, UpdateBookingSchema);
    
    log.debug(
      { bookingId: params.id, fields: Object.keys(data) },
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
    if (data.recipient !== undefined) updateData.recipient = data.recipient;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache)
    const updatedBooking = await bookingService.updateBooking(params.id, updateData);

    log.info(
      { bookingId: params.id, status: updatedBooking.status },
      'Booking updated successfully',
    );

    return NextResponse.json({
      success: true,
      message: 'Réservation mise à jour avec succès',
      booking: updatedBooking,
    });
  } catch (error) {
    log.error(
      { error, bookingId: params.id, msg: 'Error updating booking' },
      'Error updating booking',
    );

    if (error instanceof Error && error.message === 'Réservation non trouvée') {
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la réservation' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/bookings/[id]/cancel - Annuler une réservation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
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

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      log.warn({ bookingId: params.id }, 'Invalid booking ID format');
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 },
      );
    }

    log.debug(
      { bookingId: params.id, userId: session.user.id },
      'Cancelling booking',
    );

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache)
    const cancelledBooking = await bookingService.cancelBooking(params.id);

    log.info(
      { bookingId: params.id, userId: session.user.id },
      'Booking cancelled successfully',
    );

    return NextResponse.json({
      success: true,
      message: 'Réservation annulée avec succès',
      booking: cancelledBooking,
    });
  } catch (error) {
    log.error(
      { error, bookingId: params.id, msg: 'Error cancelling booking' },
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
