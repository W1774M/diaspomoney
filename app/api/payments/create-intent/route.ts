// Elle nécessite une connexion MongoDB qui n'est pas disponible pendant le build
;

import { auth } from '@/auth';
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { CreatePaymentIntentSchema, type CreatePaymentIntentInput } from '@/lib/validations/payment.schema';
import { paymentService } from '@/services/payment/payment.service.strategy';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  return handleApiRoute(req, async () => {
    // Authentification optionnelle - les paiements peuvent être effectués sans être connecté
    const session = await auth();
    const reqId = req.headers.get('x-request-id');
    const log = childLogger({
      requestId: reqId || undefined,
      route: 'payments/create-intent',
    });
    
    // Utiliser l'ID utilisateur si connecté, sinon utiliser 'guest'
    // Le customer Stripe sera créé avec l'email dans la stratégie Stripe
    const customerId = session?.user?.id || 'guest';
    
    if (session?.user?.id) {
      log.info({ userId: customerId, authenticated: true }, 'Authenticated user payment');
    } else {
      log.info({ authenticated: false }, 'Guest user payment');
    }

    // Validation avec Zod
    const body = await req.json();
    
    log.info({ body }, 'Received payment intent request');
    
    const data: CreatePaymentIntentInput = validateBody(body, CreatePaymentIntentSchema);
    
    const amount = data.amount;
    const currency = data.currency.toLowerCase();
    const email = data.email;
    const metadata = data.metadata;
    
    log.info({ 
      amount, 
      currency, 
      hasEmail: !!email,
      hasMetadata: !!metadata, 
    }, 'Validated payment intent data');

    // Tentative de création de PaymentIntent avec PaymentService (Strategy Pattern)
    // Convertir le montant de centimes en euros pour PaymentService
    const amountInEuros = amount / 100;
    
    // Utiliser PaymentService avec Strategy Pattern
    // Le service sélectionne automatiquement la meilleure stratégie (Stripe par défaut)
    const paymentIntent = await paymentService.createPaymentIntent(
      amountInEuros,
      currency.toUpperCase(),
      customerId, // Utiliser l'ID utilisateur si connecté, sinon 'guest'
      {
        ...(metadata || {}),
        customerEmail: email || '',
        ...(session?.user?.id && { userId: session.user.id }), // Ajouter l'ID utilisateur si disponible
      },
    );

    // Vérifier que clientSecret est présent avant de retourner
    if (!paymentIntent.clientSecret) {
      const error = new Error(
        `Le PaymentIntent ${paymentIntent.id} a été créé mais aucun clientSecret n'est disponible. ` +
        `Status: ${paymentIntent.status}`,
      );
      log.error(
        {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          paymentIntent,
        },
        'PaymentIntent created but no clientSecret available',
      );
      throw error;
    }

    log.info({
      msg: 'PaymentIntent created',
      amount,
      currency,
      email,
      paymentIntentId: paymentIntent.id,
      hasClientSecret: !!paymentIntent.clientSecret,
      clientSecretPrefix: `${paymentIntent.clientSecret.substring(0, 20)  }...`,
    });

    // Retourner un objet simple, handleApiRoute fera le NextResponse.json()
    return {
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.id,
      currency: paymentIntent.currency,
      amount: paymentIntent.amount * 100, // Convertir en centimes pour le client
      status: paymentIntent.status,
    };
  }, 'api/payments/create-intent');
}
