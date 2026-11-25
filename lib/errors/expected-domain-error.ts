import * as Sentry from '@sentry/nextjs';

/**
 * Refus métier prévu : la route le traduit en 4xx.
 * Ce n'est pas une panne, donc les décorateurs ne doivent pas l'envoyer à Sentry.
 */
export class ExpectedDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExpectedDomainError';
  }
}

/**
 * Envoie l'erreur à Sentry sauf si c'est un refus métier prévu (ExpectedDomainError) :
 * « réservation introuvable », étape déjà validée… ne sont pas des pannes.
 */
export function captureUnexpected(error: unknown, context?: Parameters<typeof Sentry.captureException>[1]): void {
  if (error instanceof ExpectedDomainError) return;
  Sentry.captureException(error, context);
}
