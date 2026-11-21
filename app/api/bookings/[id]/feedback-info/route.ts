/**
 * API Route pour récupérer les informations d'une réservation pour le feedback
 * GET /api/bookings/[id]/feedback-info?token=...
 */

import { bookingService } from '@/services/booking/booking.service';
import { childLogger } from '@/lib/logger';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

const log = childLogger({ route: 'api/bookings/[id]/feedback-info' });

/**
 * Vérifier le token de feedback
 */
function verifyFeedbackToken(token: string, bookingId: string): boolean {
  try {
    const secret = process.env['FEEDBACK_SECRET'] || process.env['NEXTAUTH_SECRET'] || 'default-secret';
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [tokenBookingId, timestamp, hash] = decoded.split(':');
    
    if (!tokenBookingId || !timestamp || !hash) {
      return false;
    }
    
    if (tokenBookingId !== bookingId) {
      return false;
    }

    // Vérifier que le token n'est pas trop ancien (30 jours)
    const tokenTimestamp = parseInt(timestamp, 10);
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 jours
    
    if (now - tokenTimestamp > maxAge) {
      return false;
    }

    // Vérifier le hash
    const data = `${bookingId}-${timestamp}`;
    const expectedHash = crypto.createHmac('sha256', secret).update(data).digest('hex');
    
    return hash === expectedHash;
  } catch (error) {
    log.error({ error }, 'Error verifying feedback token');
    return false;
  }
}

/**
 * GET /api/bookings/[id]/feedback-info - Récupérer les infos pour le feedback
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token manquant' },
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

    // Vérifier le token
    if (!verifyFeedbackToken(token, bookingId)) {
      log.warn({ bookingId }, 'Invalid feedback token');
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 401 },
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

    // Vérifier si un feedback a déjà été soumis
    const metadata = booking.metadata || {};
    if (metadata['feedbackSubmittedAt']) {
      return NextResponse.json(
        { error: 'Un feedback a déjà été soumis pour cette réservation' },
        { status: 400 },
      );
    }

    // Retourner les informations nécessaires (sans données sensibles)
    const reservationNumber = (booking as any).reservationNumber || `RES-${bookingId.slice(-8).toUpperCase()}`;
    const serviceName = metadata['serviceLabel'] as string | undefined || 'Service';
    const providerName = metadata['providerName'] as string | undefined;

    return NextResponse.json({
      booking: {
        reservationNumber,
        serviceName,
        providerName,
      },
    });
  } catch (error) {
    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;
    
    log.error(
      { error, bookingId, msg: 'Error fetching feedback info' },
      'Error fetching feedback info',
    );

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations' },
      { status: 500 },
    );
  }
}
