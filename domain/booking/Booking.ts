/**
 * Agrégat Booking (comportement domaine) — sans Mongoose / Stripe.
 */

import type { PaymentProofEvaluation } from '@/domain/payment';
import {
  DOMAIN_BOOKING_STATUSES,
  canTransitionBookingStatus,
  toDomainBookingStatus,
  toPersistenceBookingStatus,
  type DomainBookingStatus,
  type PersistenceBookingStatus,
} from './BookingStatus';
import {
  DOMAIN_PAYMENT_STATUSES,
  canTransitionPaymentStatus,
  type DomainPaymentStatus,
} from './PaymentStatus';

export interface BookingProps {
  id: string;
  reservationNumber?: string | undefined;
  clientId: string;
  status: DomainBookingStatus;
  paymentStatus: DomainPaymentStatus;
  paymentIntentId?: string | undefined;
  checkoutSessionId?: string | undefined;
  expectedAmount?: number | undefined;
  expectedCurrency?: string | undefined;
  clientEmail?: string | undefined;
  serviceLabel?: string | undefined;
  confirmationEmailSent?: boolean | undefined;
  /** Events domaine déjà émis (idempotence API ↔ webhook) */
  paymentEventsEmitted?: boolean | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export class Booking {
  private props: BookingProps;

  private constructor(props: BookingProps) {
    this.props = { ...props, metadata: { ...(props.metadata || {}) } };
  }

  static create(props: BookingProps): Booking {
    if (!props.id) {
      throw new Error('Booking id is required');
    }
    return new Booking(props);
  }

  static fromPersistence(raw: {
    id: string;
    reservationNumber?: string;
    userId?: string;
    requesterId?: string;
    status?: string;
    metadata?: Record<string, unknown>;
  }): Booking {
    const metadata = raw.metadata || {};
    const paymentStatusRaw = String(
      metadata['paymentStatus'] || DOMAIN_PAYMENT_STATUSES.PENDING,
    ).toLowerCase() as DomainPaymentStatus;

    const paymentStatus = (
      Object.values(DOMAIN_PAYMENT_STATUSES) as string[]
    ).includes(paymentStatusRaw)
      ? paymentStatusRaw
      : DOMAIN_PAYMENT_STATUSES.PENDING;

    const amountRaw = metadata['totalAmount'];
    const expectedAmount =
      typeof amountRaw === 'number'
        ? amountRaw
        : amountRaw
          ? parseFloat(String(amountRaw))
          : undefined;

    return new Booking({
      id: raw.id,
      reservationNumber: raw.reservationNumber,
      clientId: raw.userId || raw.requesterId || '',
      status: toDomainBookingStatus(raw.status || 'pending'),
      paymentStatus,
      paymentIntentId: metadata['paymentIntentId'] as string | undefined,
      checkoutSessionId: metadata['checkoutSessionId'] as string | undefined,
      expectedAmount: Number.isFinite(expectedAmount)
        ? expectedAmount
        : undefined,
      expectedCurrency: 'EUR',
      clientEmail: metadata['clientEmail'] as string | undefined,
      serviceLabel: metadata['serviceLabel'] as string | undefined,
      confirmationEmailSent: Boolean(metadata['confirmationEmailSent']),
      paymentEventsEmitted: Boolean(metadata['paymentEventsEmitted']),
      metadata,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get reservationNumber(): string | undefined {
    return this.props.reservationNumber;
  }

  get status(): DomainBookingStatus {
    return this.props.status;
  }

  get paymentStatus(): DomainPaymentStatus {
    return this.props.paymentStatus;
  }

  get paymentIntentId(): string | undefined {
    return this.props.paymentIntentId;
  }

  get clientEmail(): string | undefined {
    return this.props.clientEmail;
  }

  get serviceLabel(): string | undefined {
    return this.props.serviceLabel;
  }

  get expectedAmount(): number | undefined {
    return this.props.expectedAmount;
  }

  get expectedCurrency(): string | undefined {
    return this.props.expectedCurrency;
  }

  get confirmationEmailSent(): boolean {
    return Boolean(this.props.confirmationEmailSent);
  }

  get paymentEventsEmitted(): boolean {
    return Boolean(this.props.paymentEventsEmitted);
  }

  get metadata(): Record<string, unknown> {
    return { ...(this.props.metadata || {}) };
  }

  /**
   * True si ce booking est déjà confirmé pour la même preuve (pi_/cs_).
   * False si pas encore confirmé. Throw si confirmé avec une autre preuve.
   */
  isIdempotentReplayFor(proofId: string, paymentIntentId?: string): boolean {
    if (this.props.paymentStatus !== DOMAIN_PAYMENT_STATUSES.CONFIRMED) {
      return false;
    }
    const known =
      this.props.paymentIntentId ||
      this.props.checkoutSessionId ||
      (this.props.metadata?.['paymentConfirmationKey'] as string | undefined);
    const candidates = [proofId, paymentIntentId].filter(Boolean) as string[];
    if (!known) {
      // Confirmé sans clé stockée : traiter comme replay safe
      return true;
    }
    if (candidates.includes(known)) {
      return true;
    }
    throw new Error(
      `Booking already confirmed with different payment proof (${known})`,
    );
  }

  /** Facture acquittée déjà émise pour ce paiement (idempotence) */
  get invoiceId(): string | undefined {
    const id = this.props.metadata?.['invoiceId'];
    return typeof id === 'string' && id ? id : undefined;
  }

  recordInvoiceIssued(invoiceId: string, invoiceNumber?: string): void {
    if (!invoiceId) {
      throw new Error('invoiceId is required');
    }
    const metadata = { ...(this.props.metadata || {}) };
    metadata['invoiceId'] = invoiceId;
    if (invoiceNumber) {
      metadata['invoiceNumber'] = invoiceNumber;
    }
    this.props.metadata = metadata;
  }

  markPaymentEventsEmitted(): void {
    this.props.paymentEventsEmitted = true;
    const metadata = { ...(this.props.metadata || {}) };
    metadata['paymentEventsEmitted'] = true;
    metadata['paymentEventsEmittedAt'] = new Date().toISOString();
    this.props.metadata = metadata;
  }

  assertCanConfirmPayment(): void {
    if (this.props.status === DOMAIN_BOOKING_STATUSES.CANCELLED) {
      throw new Error('Cannot confirm payment on a cancelled booking');
    }
    if (this.props.status === DOMAIN_BOOKING_STATUSES.FINISHED) {
      throw new Error('Cannot confirm payment on a finished booking');
    }
    if (this.props.paymentStatus === DOMAIN_PAYMENT_STATUSES.CONFIRMED) {
      // Idempotent — already confirmed is OK for webhook retries
      return;
    }
  }

  markPaymentConfirmed(proof: PaymentProofEvaluation): void {
    this.assertCanConfirmPayment();

    if (!proof.valid || proof.paymentStatus === 'failed') {
      throw new Error(proof.error || 'Invalid payment proof');
    }

    const nextPayment: DomainPaymentStatus =
      proof.paymentStatus === 'processing'
        ? DOMAIN_PAYMENT_STATUSES.PROCESSING
        : DOMAIN_PAYMENT_STATUSES.CONFIRMED;

    if (
      !canTransitionPaymentStatus(this.props.paymentStatus, nextPayment) &&
      this.props.paymentStatus !== nextPayment
    ) {
      throw new Error(
        `Invalid payment status transition: ${this.props.paymentStatus} → ${nextPayment}`,
      );
    }

    this.props.paymentStatus = nextPayment;
    if (proof.paymentIntentId) {
      this.props.paymentIntentId = proof.paymentIntentId;
    }
    if (proof.checkoutSessionId) {
      this.props.checkoutSessionId = proof.checkoutSessionId;
    }

    if (
      nextPayment === DOMAIN_PAYMENT_STATUSES.CONFIRMED &&
      canTransitionBookingStatus(
        this.props.status,
        DOMAIN_BOOKING_STATUSES.CONFIRMED,
      )
    ) {
      this.props.status = DOMAIN_BOOKING_STATUSES.CONFIRMED;
    }

    const metadata = { ...(this.props.metadata || {}) };
    metadata['paymentStatus'] = nextPayment;
    metadata['paymentPending'] = nextPayment !== DOMAIN_PAYMENT_STATUSES.CONFIRMED;
    metadata['paymentConfirmedAt'] = new Date().toISOString();
    const confirmationKey =
      proof.paymentIntentId || proof.checkoutSessionId || undefined;
    if (confirmationKey) {
      metadata['paymentConfirmationKey'] = confirmationKey;
    }
    if (this.props.paymentIntentId) {
      metadata['paymentIntentId'] = this.props.paymentIntentId;
    }
    if (this.props.checkoutSessionId) {
      metadata['checkoutSessionId'] = this.props.checkoutSessionId;
    }

    // Paiement confirmé via lien Stripe → étape 3 (Paiement) sans validation admin
    if (nextPayment === DOMAIN_PAYMENT_STATUSES.CONFIRMED) {
      this.advanceProgressToPaymentStep(metadata);
    } else {
      const progressHistory = (metadata['progressHistory'] as any[]) || [];
      const step3History = progressHistory.find((h: any) => h.step === 3);
      if (step3History) {
        metadata['progressHistory'] = progressHistory.map((h: any) =>
          h.step === 3
            ? {
                ...h,
                completed: false,
                data: {
                  ...h.data,
                  paymentPending: true,
                  paymentConfirmed: false,
                },
              }
            : h,
        );
      }
    }

    this.props.metadata = metadata;
  }

  /**
   * Passe la commande à l'étape 3 (Paiement) dès que le paiement Stripe est confirmé.
   * Pas de validation manuelle admin : le paiement via le lien suffit.
   */
  private advanceProgressToPaymentStep(
    metadata: Record<string, unknown>,
  ): void {
    const STEP_NAMES: Record<number, string> = {
      1: 'Informations client',
      2: 'Sélection du service',
      3: 'Paiement',
      4: 'Confirmation',
    };
    const PAYMENT_STEP = 3;
    const now = new Date().toISOString();

    const currentStep =
      typeof metadata['currentStep'] === 'number'
        ? (metadata['currentStep'] as number)
        : 0;

    // Ne pas reculer si la commande est déjà plus avancée (ex. étape 4)
    if (currentStep < PAYMENT_STEP) {
      metadata['currentStep'] = PAYMENT_STEP;
      metadata['stepName'] = `Étape ${PAYMENT_STEP} : ${STEP_NAMES[PAYMENT_STEP]}`;
    }

    metadata['lastUpdatedAt'] = now;

    const progressHistory = Array.isArray(metadata['progressHistory'])
      ? ([...(metadata['progressHistory'] as any[])] as any[])
      : [];

    const upsertCompletedStep = (step: number) => {
      const existingIdx = progressHistory.findIndex(
        (h: any) => h?.step === step,
      );
      const stepName = `Étape ${step} : ${STEP_NAMES[step] || `Étape ${step}`}`;
      const base = {
        step,
        stepName,
        timestamp: now,
        completed: true,
        validatedByPayment: step === PAYMENT_STEP,
        data: {
          previousStep: currentStep,
          ...(step === PAYMENT_STEP
            ? {
                paymentPending: false,
                paymentConfirmed: true,
                paymentConfirmedAt: now,
              }
            : { autoCompletedByPayment: true }),
        },
      };

      if (existingIdx >= 0) {
        const existing = progressHistory[existingIdx];
        progressHistory[existingIdx] = {
          ...existing,
          ...base,
          data: {
            ...(existing?.data || {}),
            ...base.data,
          },
          ...(step === PAYMENT_STEP ? { paymentConfirmedAt: now } : {}),
        };
      } else {
        progressHistory.push(base);
      }
    };

    // Étapes 1–3 complétées : le paiement via le lien vaut validation de l'étape Paiement
    for (let step = 1; step <= PAYMENT_STEP; step++) {
      upsertCompletedStep(step);
    }

    metadata['progressHistory'] = progressHistory;
  }

  markPaymentFailed(error?: string): void {
    if (
      !canTransitionPaymentStatus(
        this.props.paymentStatus,
        DOMAIN_PAYMENT_STATUSES.FAILED,
      )
    ) {
      throw new Error(
        `Cannot mark payment failed from status ${this.props.paymentStatus}`,
      );
    }
    this.props.paymentStatus = DOMAIN_PAYMENT_STATUSES.FAILED;
    const metadata = { ...(this.props.metadata || {}) };
    metadata['paymentStatus'] = DOMAIN_PAYMENT_STATUSES.FAILED;
    metadata['paymentPending'] = false;
    metadata['paymentFailedAt'] = new Date().toISOString();
    if (error) {
      metadata['paymentError'] = error;
    }
    this.props.metadata = metadata;
  }

  markConfirmationEmailSent(): void {
    this.props.confirmationEmailSent = true;
    const metadata = { ...(this.props.metadata || {}) };
    metadata['confirmationEmailSent'] = true;
    metadata['confirmationEmailSentAt'] = new Date().toISOString();
    this.props.metadata = metadata;
  }

  /** Patch pour BookingService / repo applicatif (statuts domaine UPPER) */
  toApplicationUpdate(): {
    status: DomainBookingStatus;
    metadata: Record<string, unknown>;
  } {
    return {
      status: this.props.status,
      metadata: this.metadata,
    };
  }

  /** Valeurs Mongoose lowercase (anti-corruption) */
  toPersistenceStatus(): PersistenceBookingStatus {
    return toPersistenceBookingStatus(this.props.status);
  }

  /** Patch prêt pour bookingService.updateBooking */
  toPersistenceUpdate(): {
    status: PersistenceBookingStatus;
    metadata: Record<string, unknown>;
  } {
    return {
      status: toPersistenceBookingStatus(this.props.status),
      metadata: this.metadata,
    };
  }
}
