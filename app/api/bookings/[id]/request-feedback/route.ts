/**
 * API Route pour demander un feedback sur une prestation
 * POST /api/bookings/[id]/request-feedback
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import { sendFeedbackRequestEmail } from '@/lib/email/resend';
import { cleanUrl } from '@/lib/utils';
import { ROLES } from '@/lib/constants';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

const log = childLogger({ route: 'api/bookings/[id]/request-feedback' });

/**
 * Générer un token sécurisé pour le feedback
 */
function generateFeedbackToken(bookingId: string): string {
  const secret = process.env['FEEDBACK_SECRET'] || process.env['NEXTAUTH_SECRET'] || 'default-secret';
  const timestamp = Date.now();
  const data = `${bookingId}-${timestamp}`;
  const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(`${bookingId}:${timestamp}:${hash}`).toString('base64url');
}

/**
 * POST /api/bookings/[id]/request-feedback - Demander un feedback
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const roles = session.user.roles || [];
    const isAdmin = roles.includes(ROLES.ADMIN) || roles.includes(ROLES.SUPERADMIN);
    
    if (!isAdmin) {
      log.warn({ userId: session.user.id, roles }, 'Forbidden: Admin role required');
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
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

    // Récupérer le booking
    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      log.warn({ bookingId }, 'Booking not found');
      return NextResponse.json(
        { error: 'Réservation non trouvée' },
        { status: 404 },
      );
    }

    // Vérifier que le booking est terminé
    if (booking.status !== 'FINISHED') {
      log.warn({ bookingId, status: booking.status }, 'Booking is not finished');
      return NextResponse.json(
        { error: 'La réservation doit être terminée pour demander un feedback' },
        { status: 400 },
      );
    }

    // Vérifier si un feedback a déjà été demandé
    const metadata = booking.metadata || {};
    if (metadata['feedbackRequestedAt']) {
      log.info({ bookingId }, 'Feedback already requested');
      return NextResponse.json(
        { error: 'Un feedback a déjà été demandé pour cette réservation' },
        { status: 400 },
      );
    }

    // Récupérer les informations du client
    const clientEmail = metadata['clientEmail'] as string | undefined;
    const clientFirstName = metadata['clientFirstName'] as string | undefined;
    const clientLastName = metadata['clientLastName'] as string | undefined;
    const clientName = clientFirstName && clientLastName
      ? `${clientFirstName} ${clientLastName}`
      : clientFirstName || clientLastName || 'Client';

    if (!clientEmail) {
      log.warn({ bookingId }, 'Client email not found in booking metadata');
      return NextResponse.json(
        { error: 'Email du client non trouvé' },
        { status: 400 },
      );
    }

    // Générer le token et l'URL de feedback
    const feedbackToken = generateFeedbackToken(bookingId);
    const baseUrl = cleanUrl(process.env['NEXT_PUBLIC_APP_URL']);
    const feedbackUrl = `${baseUrl}/feedback/${bookingId}?token=${feedbackToken}`;

    // Récupérer le nom du service
    const serviceName = metadata['serviceLabel'] as string | undefined || 'Service';
    const reservationNumber = (booking as any).reservationNumber || `RES-${bookingId.slice(-8).toUpperCase()}`;

    // Envoyer l'email
    const emailSent = await sendFeedbackRequestEmail(
      clientEmail,
      clientName,
      reservationNumber,
      serviceName,
      feedbackUrl,
    );

    if (!emailSent) {
      log.error({ bookingId, clientEmail }, 'Failed to send feedback request email');
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 },
      );
    }

    // Marquer le feedback comme demandé dans les métadonnées
    await bookingService.updateBooking(bookingId, {
      metadata: {
        ...metadata,
        feedbackRequestedAt: new Date().toISOString(),
        feedbackRequestedBy: session.user.id,
      },
    });

    log.info(
      { bookingId, clientEmail, reservationNumber },
      'Feedback request email sent successfully',
    );

    return NextResponse.json({
      success: true,
      message: 'Email de demande de feedback envoyé avec succès',
    });
  } catch (error) {
    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;
    
    log.error(
      { error, bookingId, msg: 'Error requesting feedback' },
      'Error requesting feedback',
    );

    return NextResponse.json(
      { error: 'Erreur lors de la demande de feedback' },
      { status: 500 },
    );
  }
}
