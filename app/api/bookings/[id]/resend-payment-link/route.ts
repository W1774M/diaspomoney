/**
 * POST /api/bookings/[id]/resend-payment-link
 * Renvoie le lien de paiement par email au client
 * Accessible uniquement aux administrateurs
 */

import { auth } from '@/auth';
import { handleApiRoute } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import { ROLES } from '@/lib/constants';
import { createCheckoutSession } from '@/lib/stripe-checkout';
import { sendPaymentLinkEmail } from '@/lib/email/resend';
import { NextRequest } from 'next/server';
import mongoose from 'mongoose';

const log = childLogger({ route: 'api/bookings/[id]/resend-payment-link' });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return { error: 'Non autorisé' };
    }

    // Vérifier que l'utilisateur est administrateur
    const userRoles = session.user.roles || [];
    const isAdmin = userRoles.includes(ROLES.ADMIN) || userRoles.includes(ROLES.SUPERADMIN);
    if (!isAdmin) {
      log.warn({ userId: session.user.id, roles: userRoles }, 'Access denied: not admin');
      return { error: 'Accès refusé. Seuls les administrateurs peuvent renvoyer le lien de paiement.' };
    }

    // Gérer params qui peut être une Promise dans Next.js 15+
    let bookingId: string;
    try {
      const resolvedParams = await Promise.resolve(params);
      bookingId = resolvedParams.id;
    } catch (paramError) {
      log.error({ error: paramError, msg: 'Error resolving params' });
      return { error: 'Erreur lors de la résolution des paramètres' };
    }

    // Vérifier que l'ID est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      log.warn({ bookingId }, 'Invalid booking ID format');
      return { error: 'ID de réservation invalide' };
    }

    log.info({ bookingId, userId: session.user.id }, 'Resending payment link');

    // Récupérer la réservation
    const booking = await bookingService.getBookingById(bookingId);
    if (!booking) {
      log.warn({ bookingId }, 'Booking not found');
      return { error: 'Réservation non trouvée' };
    }

    const metadata = booking.metadata || {};
    const clientEmail = metadata['clientEmail'] as string | undefined;
    const clientFirstName = metadata['clientFirstName'] as string | undefined;
    const clientLastName = metadata['clientLastName'] as string | undefined;
    const serviceName = metadata['serviceLabel'] as string || 'Service';
    const totalAmount = metadata['totalAmount'] as number | string | undefined;
    const currency = (metadata['currency'] as string) || 'EUR';

    if (!clientEmail) {
      log.warn({ bookingId }, 'Client email not found in booking metadata');
      return { error: 'L\'email du client n\'est pas disponible pour cette réservation' };
    }

    // Convertir le montant en nombre si c'est une string
    let amountInEuros: number;
    if (typeof totalAmount === 'string') {
      amountInEuros = parseFloat(totalAmount.replace(/[^\d.,]/g, '').replace(',', '.'));
    } else if (typeof totalAmount === 'number') {
      amountInEuros = totalAmount;
    } else {
      log.warn({ bookingId }, 'Total amount not found in booking metadata');
      return { error: 'Le montant de la commande n\'est pas défini' };
    }

    if (isNaN(amountInEuros) || amountInEuros <= 0) {
      log.warn({ bookingId, amountInEuros }, 'Invalid amount');
      return { error: 'Le montant de la commande est invalide' };
    }

    try {
      // Créer un nouveau Checkout Session Stripe
      const checkoutResult = await createCheckoutSession({
        amount: amountInEuros,
        currency,
        customerEmail: clientEmail,
        bookingId,
        reservationNumber: booking.reservationNumber || bookingId,
        serviceName,
        metadata: {
          bookingId,
          reservationNumber: booking.reservationNumber || bookingId,
          resendBy: session.user.id,
        },
      });

      // Mettre à jour les métadonnées avec le nouveau lien
      const updatedMetadata = {
        ...metadata,
        paymentUrl: checkoutResult.url,
        checkoutSessionId: checkoutResult.sessionId,
        paymentLinkSentAt: new Date().toISOString(),
        paymentLinkResentAt: new Date().toISOString(),
        paymentLinkResentBy: session.user.id,
      };

      // Mettre à jour la réservation via le repository
      const { getBookingRepository } = await import('@/repositories');
      const bookingRepository = getBookingRepository();
      await bookingRepository.update(bookingId, {
        metadata: updatedMetadata,
      });

      // Envoyer l'email avec le lien de paiement
      const clientName = clientFirstName && clientLastName
        ? `${clientFirstName} ${clientLastName}`
        : clientFirstName || clientLastName || 'Client';
      
      const emailSent = await sendPaymentLinkEmail(
        clientEmail,
        clientName,
        booking.reservationNumber || bookingId,
        serviceName,
        amountInEuros,
        currency,
        checkoutResult.url,
      );

      if (!emailSent) {
        log.warn({ bookingId, clientEmail }, 'Failed to send payment link email');
        // Retourner quand même le succès car le lien a été créé
      }

      log.info(
        { bookingId, checkoutSessionId: checkoutResult.sessionId, clientEmail },
        'Payment link resent successfully',
      );

      return {
        success: true,
        message: 'Lien de paiement renvoyé avec succès',
        paymentUrl: checkoutResult.url,
        emailSent,
      };
    } catch (error) {
      log.error({ error, bookingId }, 'Error resending payment link');
      throw error;
    }
  }, 'api/bookings/[id]/resend-payment-link');
}

