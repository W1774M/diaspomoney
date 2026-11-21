import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import { HTTP_STATUS_CODES } from '@/lib/constants';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { ROLES } from '@/lib/constants';

/**
 * DELETE /api/bookings/[id]/delete - Supprimer complètement une réservation
 * Cette route supprime :
 * - La réservation de la BDD
 * - La transaction associée dans la BDD
 * - Le PaymentIntent chez Stripe (remboursement ou annulation)
 * - La facture associée si elle existe
 * 
 * Accessible uniquement aux administrateurs
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]/delete',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est administrateur
    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
    if (!isAdmin) {
      log.warn({ userId: session.user.id, roles: userRoles }, 'Access denied: not admin');
      return NextResponse.json(
        { error: 'Accès refusé. Seuls les administrateurs peuvent supprimer des réservations.' },
        { status: 403 },
      );
    }

    // Gérer params qui peut être une Promise dans Next.js 15+
    let bookingId: string;
    try {
      const resolvedParams = await Promise.resolve(params);
      bookingId = resolvedParams.id;
    } catch (paramError) {
      log.error({ error: paramError, msg: 'Error resolving params' });
      return NextResponse.json(
        { error: 'Erreur lors de la résolution des paramètres' },
        { status: 400 },
      );
    }

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      log.warn({ bookingId }, 'Invalid booking ID format');
      return NextResponse.json(
        { error: 'ID de réservation invalide' },
        { status: 400 },
      );
    }

    log.info(
      { bookingId, userId: session.user.id },
      'Deleting booking completely',
    );

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache, @Audit)
    const result = await bookingService.deleteBookingCompletely(bookingId);

    log.info(
      { bookingId, userId: session.user.id, result },
      'Booking deleted completely',
    );

    return NextResponse.json({
      success: true,
      message: 'Réservation supprimée complètement avec tous ses éléments associés',
      deleted: result.deleted,
    });
  } catch (error) {
    let bookingId: string;
    try {
      const resolvedParams = await Promise.resolve(params);
      bookingId = resolvedParams.id;
    } catch {
      bookingId = 'unknown';
    }

    log.error(
      { error, bookingId, msg: 'Error deleting booking completely' },
      'Error deleting booking completely',
    );

    if (error instanceof Error) {
      if (error.message === 'Réservation non trouvée') {
        return NextResponse.json(
          { error: 'Réservation non trouvée' },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la suppression complète de la réservation' },
      { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}

