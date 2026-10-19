/**
 * Application use case — ConfirmBookingPayment
 *
 * Point unique pour confirm-payment API + webhook Stripe.
 * Flux : preuve Stripe → agrégat Booking → email → events serveur.
 */

import { Booking } from '@/domain/booking';
import type { PaymentProofEvaluation } from '@/domain/payment';
import { bookingEvents, paymentEvents } from '@/lib/events';
import { childLogger } from '@/lib/logger';
import { bookingService } from '@/services/booking/booking.service';
import { emailService } from '@/services/email/email.service';
import {
  paymentService,
  type VerifyPaymentProofOptions,
} from '@/services/payment/payment.service';
import * as Sentry from '@sentry/nextjs';

export interface ConfirmBookingPaymentInput {
  /** pi_… ou cs_… */
  proofId: string;
  expectedAmount?: number;
  expectedCurrency?: string;
  acceptProcessing?: boolean;
  /** Si fourni : charge et met à jour le Booking */
  bookingId?: string;
  /** Contexte email quand pas de booking (flux confirm-payment legacy) */
  emailContext?: {
    requesterEmail?: string;
    requesterName?: string;
    serviceName?: string;
    providerName?: string;
    amount: number;
    currency: string;
    formattedDate?: string;
    contactEmail?: string;
  };
  /** Skip email (tests / déjà envoyé) */
  skipEmail?: boolean;
}

export interface ConfirmBookingPaymentResult {
  success: boolean;
  error?: string;
  bookingId?: string;
  reservationNumber?: string;
  paymentIntentId?: string;
  paymentStatus?: string;
  emailSent?: boolean;
  proof?: PaymentProofEvaluation;
}

export class ConfirmBookingPaymentService {
  private static instance: ConfirmBookingPaymentService;
  private readonly log = childLogger({
    component: 'ConfirmBookingPaymentService',
  });

  static getInstance(): ConfirmBookingPaymentService {
    if (!ConfirmBookingPaymentService.instance) {
      ConfirmBookingPaymentService.instance =
        new ConfirmBookingPaymentService();
    }
    return ConfirmBookingPaymentService.instance;
  }

  async execute(
    input: ConfirmBookingPaymentInput,
  ): Promise<ConfirmBookingPaymentResult> {
    const verifyOptions: VerifyPaymentProofOptions = {
      acceptProcessing: input.acceptProcessing ?? false,
    };
    if (input.expectedAmount !== undefined) {
      verifyOptions.expectedAmount = input.expectedAmount;
    }
    if (input.expectedCurrency) {
      verifyOptions.expectedCurrency = input.expectedCurrency;
    }

    const verification = await paymentService.verifyPaymentProof(
      input.proofId,
      verifyOptions,
    );

    const proof: PaymentProofEvaluation = {
      valid: verification.success,
      paymentStatus: verification.success
        ? ((verification.metadata?.['paymentStatus'] as
            | 'confirmed'
            | 'processing') || 'confirmed')
        : 'failed',
      paymentIntentId: verification.paymentIntentId,
      checkoutSessionId: verification.metadata?.[
        'checkoutSessionId'
      ] as string | undefined,
      amount: verification.metadata?.['amount'] as number | undefined,
      currency: verification.metadata?.['currency'] as string | undefined,
      providerStatus: String(verification.metadata?.['status'] || ''),
      ...(verification.error ? { error: verification.error } : {}),
    };

    if (!proof.valid) {
      this.log.warn(
        { proofId: input.proofId, error: proof.error },
        'ConfirmBookingPayment rejected: invalid payment proof',
      );
      return {
        success: false,
        error: proof.error || 'Paiement non confirmé auprès de Stripe',
        proof,
      };
    }

    let bookingDomain: Booking | null = null;
    let reservationNumber: string | undefined;
    let emailSent = false;

    try {
      if (input.bookingId) {
        const raw = await bookingService.getBookingById(input.bookingId);
        bookingDomain = Booking.fromPersistence({
          id: raw.id || raw._id,
          reservationNumber: raw.reservationNumber,
          requesterId: raw.requesterId,
          status: raw.status,
          metadata: raw.metadata,
        });

        // Idempotent si déjà confirmed
        if (bookingDomain.paymentStatus !== 'confirmed') {
          bookingDomain.markPaymentConfirmed(proof);
          const patch = bookingDomain.toApplicationUpdate();
          await bookingService.updateBooking(input.bookingId, {
            status: patch.status as any,
            metadata: patch.metadata,
          } as any);
        }

        reservationNumber = bookingDomain.reservationNumber;

        if (
          !input.skipEmail &&
          !bookingDomain.confirmationEmailSent &&
          proof.paymentStatus === 'confirmed'
        ) {
          emailSent = await this.sendBookingConfirmationEmail(bookingDomain, proof);
          if (emailSent) {
            bookingDomain.markConfirmationEmailSent();
            const patch = bookingDomain.toApplicationUpdate();
            await bookingService.updateBooking(input.bookingId, {
              metadata: patch.metadata,
            } as any);
          }
        }
      } else if (
        !input.skipEmail &&
        input.emailContext &&
        proof.paymentStatus === 'confirmed'
      ) {
        reservationNumber = `RES-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 11)
          .toUpperCase()}`;
        emailSent = await this.sendLegacyConfirmationEmails(
          input.emailContext,
          reservationNumber,
          proof.paymentIntentId || input.proofId,
        );
      }

      // Events serveur uniquement après preuve valide
      if (proof.paymentStatus === 'confirmed') {
        await paymentEvents
          .emitPaymentSucceeded({
            transactionId: proof.paymentIntentId || input.proofId,
            amount:
              proof.amount ??
              input.expectedAmount ??
              input.emailContext?.amount ??
              0,
            currency: (
              proof.currency ||
              input.expectedCurrency ||
              input.emailContext?.currency ||
              'EUR'
            ).toUpperCase(),
            userId:
              bookingDomain?.clientEmail ||
              input.emailContext?.requesterEmail ||
              input.bookingId ||
              'unknown',
            provider: 'STRIPE',
            timestamp: new Date(),
          })
          .catch((error) => {
            this.log.error({ error }, 'Error emitting paymentSucceeded');
          });

        if (input.bookingId) {
          await bookingEvents
            .emitBookingConfirmed(input.bookingId)
            .catch((error) => {
              this.log.error({ error }, 'Error emitting bookingConfirmed');
            });
        }
      }

      this.log.info(
        {
          bookingId: input.bookingId,
          paymentIntentId: proof.paymentIntentId,
          paymentStatus: proof.paymentStatus,
          emailSent,
        },
        'ConfirmBookingPayment completed',
      );

      return {
        success: true,
        bookingId: input.bookingId,
        reservationNumber,
        paymentIntentId: proof.paymentIntentId || input.proofId,
        paymentStatus: proof.paymentStatus,
        emailSent,
        proof,
      };
    } catch (error: any) {
      this.log.error(
        { error, bookingId: input.bookingId, proofId: input.proofId },
        'ConfirmBookingPayment failed after valid proof',
      );
      Sentry.captureException(error, {
        tags: { component: 'ConfirmBookingPaymentService' },
        extra: { bookingId: input.bookingId, proofId: input.proofId },
      });
      return {
        success: false,
        error: error.message || 'Erreur lors de la confirmation du paiement',
        proof,
      };
    }
  }

  private async sendBookingConfirmationEmail(
    booking: Booking,
    proof: PaymentProofEvaluation,
  ): Promise<boolean> {
    const email = booking.clientEmail;
    if (!email || booking.expectedAmount == null) {
      this.log.warn(
        { bookingId: booking.id },
        'Cannot send confirmation email: missing email or amount',
      );
      return false;
    }

    const name = email.split('@')[0] || 'Client';
    return emailService.sendPaymentConfirmationEmail(
      email,
      name,
      booking.expectedAmount,
      booking.expectedCurrency || proof.currency || 'EUR',
      booking.serviceLabel || 'Service DiaspoMoney',
    );
  }

  private async sendLegacyConfirmationEmails(
    ctx: NonNullable<ConfirmBookingPaymentInput['emailContext']>,
    reservationNumber: string,
    paymentRef: string,
  ): Promise<boolean> {
    const emailSubject = `Confirmation de réservation - ${reservationNumber} - DiaspoMoney`;
    const serviceName = ctx.serviceName || 'N/A';
    const providerName = ctx.providerName || 'N/A';
    const formattedDate = ctx.formattedDate || 'Non spécifié';
    const requesterName = ctx.requesterName || 'Client';

    const emailHTML = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Confirmation</title></head>
<body>
  <h1>Confirmation de réservation</h1>
  <p>Numéro : ${reservationNumber}</p>
  <p>Date : ${formattedDate}</p>
  <p>Service : ${serviceName}</p>
  <p>Prestataire : ${providerName}</p>
  <p>Prix : ${ctx.amount} ${ctx.currency}</p>
  <p>Statut : Paiement confirmé (Stripe)</p>
  <p>Réf. paiement : ${paymentRef}</p>
</body>
</html>`;

    const emailText = `
Confirmation de réservation - ${reservationNumber}
Bonjour ${requesterName},
Service : ${serviceName}
Prestataire : ${providerName}
Prix : ${ctx.amount} ${ctx.currency}
Réf. paiement : ${paymentRef}
`;

    const promises: Promise<boolean>[] = [];
    const contactEmail =
      ctx.contactEmail ||
      process.env['EMAIL_CONTACT'] ||
      'contact@diaspomoney.fr';

    if (contactEmail) {
      promises.push(
        emailService.sendCustomEmail(
          contactEmail,
          emailSubject,
          emailHTML,
          emailText,
        ),
      );
    }
    if (ctx.requesterEmail) {
      promises.push(
        emailService.sendCustomEmail(
          ctx.requesterEmail,
          emailSubject,
          emailHTML,
          emailText,
        ),
      );
    }

    const results = await Promise.all(promises);
    return results.some(Boolean);
  }
}

export const confirmBookingPaymentService =
  ConfirmBookingPaymentService.getInstance();
