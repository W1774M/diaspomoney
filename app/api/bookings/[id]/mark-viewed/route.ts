/**
 * API Route pour marquer une commande comme vue
 * Implémente les design patterns :
 * - Service Layer Pattern (via bookingService)
 * - Repository Pattern (via bookingService qui utilise les repositories)
 * - Logger Pattern (structured logging avec childLogger)
 * - Middleware Pattern (authentification)
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/bookings/[id]/mark-viewed - Marquer une commande comme vue
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]/mark-viewed',
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
    const userId = session.user.id;

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      log.warn({ bookingId }, 'Invalid booking ID format');
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 },
      );
    }

    log.debug({ bookingId, userId }, 'Marking booking as viewed');

    // Récupérer le booking actuel
    const booking = await bookingService.getBookingById(bookingId);

    if (!booking) {
      log.warn({ bookingId }, 'Booking not found');
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 },
      );
    }

    // Mettre à jour metadata.viewedBy pour ajouter l'utilisateur actuel
    const currentMetadata = booking.metadata || {};
    const viewedBy = currentMetadata['viewedBy'] || [];
    const viewedByArray = Array.isArray(viewedBy) ? viewedBy : [viewedBy].filter(Boolean);

    // Ajouter l'utilisateur s'il n'est pas déjà dans la liste
    if (!viewedByArray.includes(userId)) {
      viewedByArray.push(userId);
    }

    // Mettre à jour le booking avec le nouveau metadata
    const updateData = {
      metadata: {
        ...currentMetadata,
        viewedBy: viewedByArray,
        viewedAt: new Date().toISOString(),
      },
    };

    try {
    await bookingService.updateBooking(bookingId, updateData);
    } catch (updateError) {
      // Si l'erreur est "Réservation non trouvée", c'est probablement que la réservation
      // a été supprimée entre le moment où on l'a récupérée et maintenant
      if (updateError instanceof Error && updateError.message === 'Réservation non trouvée') {
        log.warn({ bookingId, userId }, 'Booking not found during update (may have been deleted)');
        return NextResponse.json(
          { error: 'Réservation non trouvée' },
          { status: 404 },
        );
      }
      // Relancer l'erreur pour qu'elle soit gérée par le catch externe
      throw updateError;
    }

    log.info({ bookingId, userId }, 'Booking marked as viewed successfully');

    return NextResponse.json({
      success: true,
      message: 'Commande marquée comme vue',
    });
  } catch (error) {
    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;
    
    // Si c'est déjà une erreur "Réservation non trouvée", retourner 404
    if (error instanceof Error && error.message === 'Réservation non trouvée') {
      log.warn({ bookingId }, 'Booking not found');
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 },
      );
    }

    log.error(
      { error, bookingId, msg: 'Error marking booking as viewed' },
      'Error marking booking as viewed',
    );

    return NextResponse.json(
      { error: 'Erreur lors du marquage de la commande comme vue' },
      { status: 500 },
    );
  }
}

