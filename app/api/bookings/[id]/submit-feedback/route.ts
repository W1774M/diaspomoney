/**
 * API Route pour soumettre un feedback sur une prestation
 * POST /api/bookings/[id]/submit-feedback
 */

import { bookingService } from '@/services/booking/booking.service';
import { childLogger } from '@/lib/logger';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import * as crypto from 'crypto';

const log = childLogger({ route: 'api/bookings/[id]/submit-feedback' });

const SubmitFeedbackSchema = z.object({
  token: z.string().min(1),
  // Feedback DiaspoMoney
  diaspomoneyRating: z.number().int().min(1).max(5).optional(),
  diaspomoneyComment: z.string().optional(),
  // Feedback service/prestataire
  serviceRating: z.number().int().min(1).max(5).optional(),
  serviceComment: z.string().optional(),
  // Rétrocompatibilité avec l'ancien format
  rating: z.number().int().min(0).max(5).optional(),
  comment: z.string().optional(),
}).refine(
  (data) => {
    // Au moins un feedback doit être fourni
    return (
      (data.diaspomoneyRating !== undefined && data.diaspomoneyRating > 0) ||
      (data.serviceRating !== undefined && data.serviceRating > 0) ||
      (data.rating !== undefined && data.rating > 0)
    );
  },
  {
    message: 'Au moins une note doit être attribuée (DiaspoMoney ou service/prestataire)',
  }
);

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
 * POST /api/bookings/[id]/submit-feedback - Soumettre un feedback
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
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

    // Parser et valider le body
    const body = await request.json();
    const validationResult = SubmitFeedbackSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { 
      token, 
      diaspomoneyRating, 
      diaspomoneyComment, 
      serviceRating, 
      serviceComment,
      // Rétrocompatibilité
      rating: legacyRating,
      comment: legacyComment,
    } = validationResult.data;

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

    // Enregistrer le feedback dans les métadonnées
    const feedbackData: any = {
      submittedAt: new Date().toISOString(),
    };
    
    // Feedback DiaspoMoney
    if (diaspomoneyRating !== undefined && diaspomoneyRating > 0) {
      feedbackData.diaspomoney = {
        rating: diaspomoneyRating,
        comment: diaspomoneyComment?.trim() || '',
      };
    }
    
    // Feedback service/prestataire
    if (serviceRating !== undefined && serviceRating > 0) {
      feedbackData.service = {
        rating: serviceRating,
        comment: serviceComment?.trim() || '',
      };
    }
    
    // Rétrocompatibilité avec l'ancien format
    if (legacyRating !== undefined && legacyRating > 0) {
      feedbackData.rating = legacyRating;
      feedbackData.comment = legacyComment?.trim() || '';
    }
    
    await bookingService.updateBooking(bookingId, {
      metadata: {
        ...metadata,
        feedback: feedbackData,
        feedbackSubmittedAt: new Date().toISOString(),
      },
    });

    log.info(
      { 
        bookingId, 
        hasDiaspomoneyFeedback: !!diaspomoneyRating,
        hasServiceFeedback: !!serviceRating,
        legacyRating,
      },
      'Feedback submitted successfully',
    );

    return NextResponse.json({
      success: true,
      message: 'Feedback enregistré avec succès',
    });
  } catch (error) {
    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;
    
    log.error(
      { error, bookingId, msg: 'Error submitting feedback' },
      'Error submitting feedback',
    );

    return NextResponse.json(
      { error: 'Erreur lors de la soumission du feedback' },
      { status: 500 },
    );
  }
}
