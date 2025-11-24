/**
 * Configuration Stripe conforme à la documentation officielle
 * https://docs.stripe.com/api/authentication?lang=node
 * 
 * Cette configuration implémente les bonnes pratiques :
 * - Validation des clés API (préfixes sk_test_ et sk_live_)
 * - Gestion des erreurs selon les types Stripe
 * - Initialisation lazy pour éviter les erreurs au build
 * - Support des clés par requête pour Connect
 */

import Stripe from 'stripe';
import { childLogger } from './logger';

const log = childLogger({ component: 'StripeConfig' });

/**
 * Valide qu'une clé API Stripe a le bon format
 * Les clés test ont le préfixe sk_test_ et les clés live sk_live_
 */
function validateStripeKey(apiKey: string | undefined): apiKey is string {
  if (!apiKey) {
    return false;
  }
  
  const isValidFormat = apiKey.startsWith('sk_test_') || apiKey.startsWith('sk_live_');
  
  if (!isValidFormat) {
    log.warn({ 
      keyPrefix: apiKey.substring(0, 10), 
    }, 'Stripe key format may be invalid');
  }
  
  return isValidFormat;
}

/**
 * Détecte le mode (test ou live) depuis la clé API
 */
export function getStripeMode(apiKey: string): 'test' | 'live' {
  if (apiKey.startsWith('sk_test_')) {
    return 'test';
  }
  if (apiKey.startsWith('sk_live_')) {
    return 'live';
  }
  // Par défaut, considérer comme test pour la sécurité
  return 'test';
}

/**
 * Instance Stripe globale (singleton)
 * Initialisée de manière lazy pour éviter les erreurs au build
 */
let stripeInstance: Stripe | null = null;

/**
 * Options de configuration Stripe
 * Conforme à la documentation officielle
 */
export interface StripeConfigOptions {
  apiKey?: string;
  apiVersion?: string;
  maxNetworkRetries?: number;
  timeout?: number;
  typescript?: boolean;
}

/**
 * Obtient ou crée l'instance Stripe globale
 * Conforme à la documentation : https://docs.stripe.com/api/authentication?lang=node
 */
export function getStripeInstance(options?: StripeConfigOptions): Stripe {
  // Si une instance existe déjà et qu'aucune option n'est fournie, la retourner
  if (stripeInstance && !options) {
    return stripeInstance;
  }

  // Utiliser la clé fournie en option ou celle de l'environnement
  const apiKey = options?.apiKey || process.env['STRIPE_SECRET_KEY'];
  
  if (!validateStripeKey(apiKey)) {
    const error = new Error(
      'Stripe secret key must be set in environment variables (STRIPE_SECRET_KEY). ' +
      'Keys must start with sk_test_ (test mode) or sk_live_ (live mode).',
    );
    log.error({ hasKey: !!apiKey }, 'Stripe secret key validation failed');
    throw error;
  }

  const mode = getStripeMode(apiKey);
  log.info({ mode }, 'Initializing Stripe instance');

  // Créer une nouvelle instance avec les options fournies
  const instance = new Stripe(apiKey, {
    apiVersion: options?.apiVersion as Stripe.LatestApiVersion || '2025-10-29.clover',
    maxNetworkRetries: options?.maxNetworkRetries || 2,
    timeout: options?.timeout || 20000,
    typescript: (options?.typescript ?? true) as true,
  });

  // Si aucune option n'est fournie, sauvegarder comme instance globale
  if (!options) {
    stripeInstance = instance;
  }

  return instance;
}

/**
 * Crée une instance Stripe avec une clé API spécifique (pour Connect)
 * Utile pour les requêtes par compte connecté
 * Conforme à : https://docs.stripe.com/api/authentication?lang=node#connected-accounts
 */
export function getStripeInstanceForAccount(
  _accountId: string,
  apiKey?: string,
): Stripe {
  // accountId parameter reserved for future Connect account support
  const instance = getStripeInstance({ apiKey: apiKey as string });
  
  // Note: Pour les requêtes Connect, utiliser l'option stripeAccount
  // dans les appels API plutôt que de créer une nouvelle instance
  return instance;
}

/**
 * Réinitialise l'instance Stripe (utile pour les tests)
 */
export function resetStripeInstance(): void {
  stripeInstance = null;
  log.info('Stripe instance reset');
}

/**
 * Vérifie si Stripe est configuré
 */
export function isStripeConfigured(): boolean {
  const apiKey = process.env['STRIPE_SECRET_KEY'];
  return validateStripeKey(apiKey);
}

/**
 * Types d'erreurs Stripe selon la documentation
 * https://docs.stripe.com/api/errors
 */
export enum StripeErrorType {
  CARD_ERROR = 'card_error',
  INVALID_REQUEST_ERROR = 'invalid_request_error',
  API_ERROR = 'api_error',
  IDEMPOTENCY_ERROR = 'idempotency_error',
  AUTHENTICATION_ERROR = 'authentication_error',
  RATE_LIMIT_ERROR = 'rate_limit_error',
}

/**
 * Gère les erreurs Stripe selon leur type
 * Conforme à la documentation : https://docs.stripe.com/api/errors
 */
export function handleStripeError(error: unknown): {
  type: StripeErrorType;
  message: string;
  code?: string;
  declineCode?: string;
  param?: string;
} {
  if (error instanceof Stripe.errors.StripeError) {
    const stripeError = error as Stripe.errors.StripeError;
    
    let errorType: StripeErrorType;
    
    if (stripeError instanceof Stripe.errors.StripeCardError) {
      errorType = StripeErrorType.CARD_ERROR;
    } else if (stripeError instanceof Stripe.errors.StripeRateLimitError) {
      errorType = StripeErrorType.RATE_LIMIT_ERROR;
    } else if (stripeError instanceof Stripe.errors.StripeInvalidRequestError) {
      errorType = StripeErrorType.INVALID_REQUEST_ERROR;
    } else if (stripeError instanceof Stripe.errors.StripeAPIError) {
      errorType = StripeErrorType.API_ERROR;
    } else if (stripeError instanceof Stripe.errors.StripeAuthenticationError) {
      errorType = StripeErrorType.AUTHENTICATION_ERROR;
    } else if (stripeError instanceof Stripe.errors.StripeIdempotencyError) {
      errorType = StripeErrorType.IDEMPOTENCY_ERROR;
    } else {
      errorType = StripeErrorType.API_ERROR;
    }

    return {
      type: errorType,
      message: stripeError.message || 'Une erreur Stripe est survenue',
      code: stripeError.code as string,
      declineCode: (stripeError as any).decline_code,
      param: (stripeError as any).param,
    };
  }

  // Erreur non-Stripe
  const message = error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
  return {
    type: StripeErrorType.API_ERROR,
    message,
  };
}

/**
 * Vérifie si une erreur est récupérable (peut être réessayée)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Stripe.errors.StripeError) {
    // Les erreurs de rate limit et d'API peuvent être réessayées
    return (
      error instanceof Stripe.errors.StripeRateLimitError ||
      error instanceof Stripe.errors.StripeAPIError
    );
  }
  return false;
}

