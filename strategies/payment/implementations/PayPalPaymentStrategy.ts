/**
 * Implémentation PayPal du Strategy Pattern de paiement
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import * as Sentry from '@sentry/nextjs';
import {
  IPaymentStrategy,
  PaymentData,
  PaymentResult,
  RefundData,
  RefundResult,
} from '../interfaces/IPaymentStrategy';

export class PayPalPaymentStrategy implements IPaymentStrategy {
  readonly name = 'PAYPAL';
  readonly supportedCurrencies = ['EUR', 'USD', 'GBP'];
  readonly supportedCountries = ['FR', 'US', 'GB', 'DE', 'ES', 'IT'];

  private apiUrl: string;
  private clientId: string;
  private clientSecret: string;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    this.apiUrl = isProduction
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
    this.clientId = process.env['PAYPAL_CLIENT_ID'] || '';
    this.clientSecret = process.env['PAYPAL_CLIENT_SECRET'] || '';

    if (!this.clientId || !this.clientSecret) {
      console.warn('[PayPalPaymentStrategy] PayPal credentials not configured');
    }
  }

  canProcess(data: PaymentData): boolean {
    return (
      this.supportedCurrencies.includes(data.currency.toUpperCase()) &&
      data.amount > 0 &&
      !!this.clientId &&
      !!this.clientSecret
    );
  }

  /**
   * Obtenir un token d'accès PayPal
   */
  private async getAccessToken(): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error('Failed to get PayPal access token');
      }

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('[PayPalPaymentStrategy] Error getting access token:', error);
      throw error;
    }
  }

  async processPayment(data: PaymentData): Promise<PaymentResult> {
    try {
      if (!this.canProcess(data)) {
        return {
          success: false,
          error: 'PayPal ne peut pas traiter ce paiement (devise ou montant invalide)',
        };
      }

      const accessToken = await this.getAccessToken();

      // Créer une commande PayPal
      const orderResponse = await fetch(`${this.apiUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: data.currency.toUpperCase(),
                value: data.amount.toFixed(2),
              },
              description: data.description,
            },
          ],
          application_context: {
            return_url: data.returnUrl || `${process.env['NEXTAUTH_URL'] || 'https://app.diaspomoney.fr'}/payment/success`,
            cancel_url: data.cancelUrl || `${process.env['NEXTAUTH_URL'] || 'https://app.diaspomoney.fr'}/payment/cancel`,
          },
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create PayPal order');
      }

      const order = await orderResponse.json();

      // Capturer le paiement immédiatement si un payment method est fourni
      if (data.paymentMethodId && order.id) {
        const captureResponse = await this.captureOrder(order.id, accessToken);
        return captureResponse;
      }

      monitoringManager.recordMetric({
        name: 'payment_processed',
        value: 1,
        timestamp: new Date(),
        labels: {
          provider: 'paypal',
          currency: data.currency.toLowerCase(),
        },
        type: 'counter',
      });

      return {
        success: true,
        transactionId: order.id,
        paymentIntentId: order.id,
        requiresAction: true,
        nextAction: {
          type: 'redirect',
          url: order.links?.find((link: any) => link.rel === 'approve')?.href,
        },
        metadata: {
          status: order.status,
          amount: data.amount,
          currency: data.currency,
        },
      };
    } catch (error: any) {
      console.error('[PayPalPaymentStrategy] Error in processPayment:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors du traitement du paiement PayPal',
      };
    }
  }

  async createPaymentIntent(data: PaymentData): Promise<PaymentResult> {
    // Pour PayPal, createPaymentIntent est similaire à processPayment
    return this.processPayment(data);
  }

  async confirmPaymentIntent(
    paymentIntentId: string,
    _paymentMethodId?: string,
  ): Promise<PaymentResult> {
    try {
      const accessToken = await this.getAccessToken();
      return await this.captureOrder(paymentIntentId, accessToken);
    } catch (error: any) {
      console.error('[PayPalPaymentStrategy] Error in confirmPaymentIntent:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors de la confirmation du paiement PayPal',
      };
    }
  }

  /**
   * Capturer une commande PayPal
   */
  private async captureOrder(orderId: string, accessToken: string): Promise<PaymentResult> {
    try {
      const response = await fetch(
        `${this.apiUrl}/v2/checkout/orders/${orderId}/capture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to capture PayPal order');
      }

      const capture = await response.json();

      return {
        success: capture.status === 'COMPLETED',
        transactionId: capture.id,
        paymentIntentId: orderId,
        metadata: {
          status: capture.status,
          amount: parseFloat(capture.purchase_units[0]?.payments?.captures[0]?.amount?.value || '0'),
          currency: capture.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la capture PayPal',
      };
    }
  }

  async refund(data: RefundData): Promise<RefundResult> {
    try {
      const accessToken = await this.getAccessToken();

      // Pour PayPal, on doit d'abord récupérer la capture ID depuis la transaction
      // Pour simplifier, on assume que transactionId est la capture ID
      const response = await fetch(
        `${this.apiUrl}/v2/payments/captures/${data.transactionId}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            amount: data.amount
              ? {
                  value: data.amount.toFixed(2),
                  currency_code: 'EUR', // Devrait être récupéré depuis la transaction
                }
              : undefined,
            note_to_payer: data.reason,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to refund PayPal payment');
      }

      const refund = await response.json();

      monitoringManager.recordMetric({
        name: 'payment_refunded',
        value: 1,
        timestamp: new Date(),
        labels: {
          provider: 'paypal',
        },
        type: 'counter',
      });

      return {
        success: refund.status === 'COMPLETED' || refund.status === 'PENDING',
        refundId: refund.id,
        amount: data.amount || parseFloat(refund.amount?.value || '0'),
      };
    } catch (error: any) {
      console.error('[PayPalPaymentStrategy] Error in refund:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors du remboursement PayPal',
      };
    }
  }

  async getTransactionStatus(transactionId: string): Promise<PaymentResult> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await fetch(
        `${this.apiUrl}/v2/checkout/orders/${transactionId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error('Failed to get PayPal order status');
      }

      const order = await response.json();

      return {
        success: order.status === 'COMPLETED',
        transactionId: order.id,
        paymentIntentId: order.id,
        metadata: {
          status: order.status,
        },
      };
    } catch (error: any) {
      console.error('[PayPalPaymentStrategy] Error in getTransactionStatus:', error);
      Sentry.captureException(error);

      return {
        success: false,
        error: error.message || 'Erreur lors de la récupération du statut PayPal',
      };
    }
  }
}

