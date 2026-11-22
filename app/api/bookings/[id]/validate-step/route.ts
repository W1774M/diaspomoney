import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import { HTTP_STATUS_CODES } from '@/lib/constants';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { ROLES } from '@/lib/constants';
import { z } from 'zod';

const ValidateStepSchema = z.object({
  step: z.number().min(1).max(4),
});

/**
 * POST /api/bookings/[id]/validate-step - Valider une étape de progression
 * Permet à l'admin de valider manuellement une étape qui n'a pas été terminée par l'utilisateur
 * 
 * Accessible uniquement aux administrateurs
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/bookings/[id]/validate-step',
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
        { error: 'Accès refusé. Seuls les administrateurs peuvent valider des étapes.' },
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

    // Valider le body
    const body = await request.json();
    const validationResult = ValidateStepSchema.safeParse(body);
    if (!validationResult.success) {
      log.warn({ errors: validationResult.error.errors }, 'Invalid request body');
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.errors },
        { status: 400 },
      );
    }

    const { step } = validationResult.data;

    log.info(
      { bookingId, step, userId: session.user.id },
      'Validating booking step',
    );

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache, @Audit)
    const updatedBooking = await bookingService.validateStep(
      bookingId,
      step,
      session.user.id,
    );

    log.info(
      { bookingId, step, userId: session.user.id },
      'Booking step validated successfully',
    );

    return NextResponse.json({
      success: true,
      message: `Étape ${step} validée avec succès`,
      booking: updatedBooking,
    });
  } catch (error) {
    let bookingId: string;
    try {
      const resolvedParams = await Promise.resolve(params);
      bookingId = resolvedParams.id;
    } catch {
      bookingId = 'unknown';
    }

    // Extraire les détails de l'erreur de manière sécurisée
    let errorMessage = 'Erreur inconnue';
    let errorStack: string | undefined;
    let errorName: string | undefined;
    let errorCode: string | undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message || 'Erreur inconnue';
      errorStack = error.stack;
      errorName = error.name;
      errorCode = (error as any).code;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // Essayer d'extraire le message depuis un objet d'erreur
      errorMessage = (error as any).message || (error as any).error || JSON.stringify(error);
      errorStack = (error as any).stack;
      errorName = (error as any).name;
      errorCode = (error as any).code;
    }
    
    log.error(
      { 
        errorMessage,
        errorName,
        errorCode,
        errorStack,
        errorType: typeof error,
        errorStringified: typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error),
        bookingId, 
        step: (error as any)?.step,
        msg: 'Error validating booking step' 
      },
      'Error validating booking step',
    );

    if (error instanceof Error) {
      if (error.message === 'Réservation non trouvée') {
        return NextResponse.json(
          { error: 'Réservation non trouvée' },
          { status: 404 },
        );
      }
      // Erreurs de validation d'étape (déjà complétée, déjà passée, etc.)
      if (error.message.includes('déjà complétée') || 
          error.message.includes('ne peut pas être validée') ||
          error.message.includes('déjà passée') ||
          error.message.includes('ne peut valider que') ||
          error.message.startsWith('Impossible de valider')) {
        return NextResponse.json(
          { 
            error: error.message,
            code: 'STEP_VALIDATION_ERROR',
          },
          { status: 400 },
        );
      }
      // Si l'erreur est liée à Stripe, retourner un message plus explicite
      if (error.message.includes('Stripe') || error.message.includes('STRIPE_SECRET_KEY')) {
        log.warn({ bookingId, errorMessage }, 'Stripe configuration error during step validation');
        return NextResponse.json(
          { 
            error: 'Erreur de configuration Stripe. L\'étape a été validée mais le lien de paiement n\'a pas pu être généré. Veuillez vérifier la configuration Stripe.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
          },
          { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR },
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Erreur lors de la validation de l\'étape',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR },
    );
  }
}

