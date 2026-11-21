/**
 * Types et interfaces pour Stripe
 * Wrappers autour des types Stripe pour une meilleure organisation et réutilisabilité
 */

import type Stripe from 'stripe';

/**
 * Payment Intent Stripe (type brut de la bibliothèque Stripe)
 */
export type StripePaymentIntent = Stripe.PaymentIntent;

/**
 * Payment Method Stripe (type brut de la bibliothèque Stripe)
 * Note: Le type wrapper StripePaymentMethod est défini dans payments.types.ts
 * Ce type est utilisé uniquement pour les opérations internes Stripe
 */
export type StripePaymentMethodRaw = Stripe.PaymentMethod;

/**
 * Dispute Stripe (type brut de la bibliothèque Stripe)
 */
export type StripeDispute = Stripe.Dispute;

/**
 * Charge Stripe (type brut de la bibliothèque Stripe)
 */
export type StripeCharge = Stripe.Charge;

/**
 * Paramètres pour créer un remboursement Stripe
 */
export type StripeRefundCreateParams = Stripe.RefundCreateParams;

/**
 * Paramètres pour créer un Payment Intent Stripe
 */
export type StripePaymentIntentCreateParams = Stripe.PaymentIntentCreateParams;

/**
 * Paramètres pour confirmer un Payment Intent Stripe
 */
export type StripePaymentIntentConfirmParams = Stripe.PaymentIntentConfirmParams;

/**
 * Paramètres pour attacher une méthode de paiement Stripe
 */
export type StripePaymentMethodAttachParams = Stripe.PaymentMethodAttachParams;

/**
 * Paramètres pour mettre à jour un client Stripe
 */
export type StripeCustomerUpdateParams = Stripe.CustomerUpdateParams;

/**
 * Paramètres pour lister les méthodes de paiement Stripe
 */
export type StripePaymentMethodListParams = Stripe.PaymentMethodListParams;

/**
 * Événement webhook Stripe
 */
export type StripeWebhookEvent = Stripe.Event;

/**
 * Type d'événement webhook Stripe
 */
export type StripeWebhookEventType = Stripe.Event.Type;

/**
 * Données d'un événement webhook Stripe
 */
export type StripeWebhookEventData = Stripe.Event.Data;

/**
 * Erreur de paiement Stripe
 */
export type StripePaymentError = Stripe.PaymentIntent.LastPaymentError;

/**
 * Configuration Stripe
 */
export interface StripeConfig {
  secretKey: string;
  apiVersion: string;
  webhookSecret?: string;
}

/**
 * Options pour initialiser le client Stripe
 */
export interface StripeClientOptions {
  apiVersion: string;
  maxNetworkRetries?: number;
  timeout?: number;
  telemetry?: boolean;
}

