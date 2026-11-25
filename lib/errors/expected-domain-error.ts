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
