/**
 * Application use case — ConfirmBookingPayment
 *
 * Point unique pour confirm-payment API + webhook Stripe.
 * Flux : preuve Stripe → agrégat Booking → email → events serveur.
 * Idempotent : second passage (API ↔ webhook) ne re-émet ni events ni email.
 */

import { Booking } from '@/domain/booking';
import { EmailDispatch } from '@/domain/comms';
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
  eventsEmitted?: boolean;
  /** True si déjà confirmé pour la même preuve (replay API↔webhook) */
  idempotent?: boolean;
  alreadyConfirmed?: boolean;
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

  /** Remise à zéro du singleton (tests) */
  static resetInstanceForTests(): void {
    ConfirmBookingPaymentService.instance =
      new ConfirmBookingPaymentService();
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
    let eventsEmitted = false;
    let alreadyConfirmed = false;
    let mutated = false;

    try {
      if (input.bookingId) {
        const raw = await bookingService.getBookingById(input.bookingId);
        bookingDomain = Booking.fromPersistence({
          id: String((raw as { id?: string; _id?: string }).id || (raw as { _id?: string })._id),
          reservationNumber: raw.reservationNumber,
          requesterId: String(
            (raw as { requesterId?: string }).requesterId || '',
          ),
          status: raw.status,
          metadata: (raw.metadata || {}) as Record<string, unknown>,
        });

        try {
          alreadyConfirmed = bookingDomain.isIdempotentReplayFor(
            input.proofId,
            proof.paymentIntentId,
          );
        } catch (conflict) {
          return {
            success: false,
            error:
              conflict instanceof Error
                ? conflict.message
                : 'Booking already confirmed with different payment proof',
            proof,
            alreadyConfirmed: true,
          };
        }

        if (!alreadyConfirmed) {
          bookingDomain.markPaymentConfirmed(proof);
          mutated = true;
        }

        reservationNumber = bookingDomain.reservationNumber;

        if (
          !input.skipEmail &&
          !bookingDomain.confirmationEmailSent &&
          proof.paymentStatus === 'confirmed'
        ) {
          emailSent = await this.sendBookingConfirmationEmail(
            bookingDomain,
            proof,
          );
          if (emailSent) {
            bookingDomain.markConfirmationEmailSent();
            mutated = true;
          }
        }

        // Events une seule fois (flag metadata)
        if (
          proof.paymentStatus === 'confirmed' &&
          !bookingDomain.paymentEventsEmitted
        ) {
          await this.emitConfirmedEvents(
            input,
            proof,
            bookingDomain,
          );
          bookingDomain.markPaymentEventsEmitted();
          eventsEmitted = true;
          mutated = true;
        }

        if (mutated) {
          const persistence = bookingDomain.toPersistenceUpdate();
          await bookingService.updateBooking(input.bookingId, {
            status: persistence.status as never,
            metadata: persistence.metadata,
          } as never);
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

        await this.emitConfirmedEvents(input, proof, null);
        eventsEmitted = true;
      } else if (proof.paymentStatus === 'confirmed' && !input.bookingId) {
        await this.emitConfirmedEvents(input, proof, null);
        eventsEmitted = true;
      }

      const idempotent =
        Boolean(input.bookingId) &&
        alreadyConfirmed &&
        !eventsEmitted &&
        !emailSent;

      this.log.info(
        {
          bookingId: input.bookingId,
          paymentIntentId: proof.paymentIntentId,
          paymentStatus: proof.paymentStatus,
          emailSent,
          eventsEmitted,
          alreadyConfirmed,
          idempotent,
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
        eventsEmitted,
        alreadyConfirmed,
        idempotent,
        proof,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
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
        error: err.message || 'Erreur lors de la confirmation du paiement',
        proof,
      };
    }
  }

  private async emitConfirmedEvents(
    input: ConfirmBookingPaymentInput,
    proof: PaymentProofEvaluation,
    bookingDomain: Booking | null,
  ): Promise<void> {
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
          bookingDomain?.clientId ||
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

  private assertEmailDispatch(
    to: string,
    subject: string,
    content: { html?: string; text?: string; templateId?: string },
  ): EmailDispatch {
    return EmailDispatch.of({
      to,
      subject,
      ...(content.html !== undefined ? { html: content.html } : {}),
      ...(content.text !== undefined ? { text: content.text } : {}),
      ...(content.templateId !== undefined
        ? { templateId: content.templateId }
        : {}),
    });
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
    const service = booking.serviceLabel || 'Service DiaspoMoney';
    this.assertEmailDispatch(email, `Confirmation de paiement - ${service}`, {
      templateId: 'payment_confirmation',
    });
    return emailService.sendPaymentConfirmationEmail(
      email,
      name,
      booking.expectedAmount,
      booking.expectedCurrency || proof.currency || 'EUR',
      service,
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
      this.assertEmailDispatch(contactEmail, emailSubject, {
        html: emailHTML,
        text: emailText,
      });
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
      this.assertEmailDispatch(ctx.requesterEmail, emailSubject, {
        html: emailHTML,
        text: emailText,
      });
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
