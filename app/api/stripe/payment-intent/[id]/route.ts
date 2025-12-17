/**
 * GET /api/stripe/payment-intent/[id]
 * Récupère les détails d'un PaymentIntent Stripe
 * Accessible uniquement aux administrateurs
 */

import { auth } from '@/auth';
import { handleApiRoute } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { getStripeInstance } from '@/lib/stripe-config';
import { ROLES } from '@/lib/constants';
import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';

const log = childLogger({ route: 'api/stripe/payment-intent/[id]' });

export async function GET(
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
      return { error: 'Accès refusé. Seuls les administrateurs peuvent accéder aux détails Stripe.' };
    }

    // Gérer params qui peut être une Promise dans Next.js 15+
    let paymentIntentId: string;
    try {
      const resolvedParams = await Promise.resolve(params);
      paymentIntentId = resolvedParams.id;
    } catch (paramError) {
      log.error({ error: paramError, msg: 'Error resolving params' });
      return { error: 'Erreur lors de la résolution des paramètres' };
    }

    if (!paymentIntentId || !paymentIntentId.startsWith('pi_')) {
      log.warn({ paymentIntentId }, 'Invalid payment intent ID format');
      return { error: 'ID de PaymentIntent invalide' };
    }

    log.info({ paymentIntentId, userId: session.user.id }, 'Fetching Stripe payment intent details');

    try {
      const stripe = getStripeInstance();

      // Récupérer le PaymentIntent avec les détails de la méthode de paiement
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['payment_method', 'latest_charge'],
      });

      // Récupérer les détails de la charge si disponible
      let charges = undefined;
      if (paymentIntent.latest_charge) {
        const chargeId =
          typeof paymentIntent.latest_charge === 'string'
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge.id;
        try {
          const charge = await stripe.charges.retrieve(chargeId, {
            expand: ['payment_method'],
          });
          charges = {
            data: [
              {
                receipt_url: charge.receipt_url || undefined,
                receipt_number: charge.receipt_number || undefined,
              },
            ],
          };
        } catch (chargeError) {
          log.warn({ error: chargeError, chargeId }, 'Error retrieving charge details');
        }
      }

      // Extraire les informations de la méthode de paiement
      let paymentMethod = undefined;
      if (paymentIntent.payment_method) {
        const pm =
          typeof paymentIntent.payment_method === 'string'
            ? await stripe.paymentMethods.retrieve(paymentIntent.payment_method)
            : paymentIntent.payment_method;

        paymentMethod = {
          type: pm.type,
          card: pm.card
            ? {
                brand: pm.card.brand,
                last4: pm.card.last4,
              }
            : undefined,
        };
      }

      const result = {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convertir de centimes en euros
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
        created: paymentIntent.created,
        paymentMethod,
        charges,
      };

      log.info({ paymentIntentId, status: paymentIntent.status }, 'Payment intent details retrieved successfully');

      return result;
    } catch (error: any) {
      log.error({ error, paymentIntentId }, 'Error fetching Stripe payment intent');
      Sentry.captureException(error, {
        tags: { component: 'StripeAPI', action: 'getPaymentIntent' },
        extra: { paymentIntentId },
      });

      if (error.type === 'StripeInvalidRequestError') {
        return { error: 'PaymentIntent non trouvé' };
      }

      throw error;
    }
  }, 'api/stripe/payment-intent/[id]');
}

