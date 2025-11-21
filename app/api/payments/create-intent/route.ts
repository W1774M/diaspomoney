// Désactiver le prerendering pour cette route API
// Elle nécessite une connexion MongoDB qui n'est pas disponible pendant le build
;

import { auth } from '@/auth';
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { CreatePaymentIntentSchema, type CreatePaymentIntentInput } from '@/lib/validations/payment.schema';
import { paymentService } from '@/services/payment/payment.service.strategy';
import { UserRole } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  return handleApiRoute(req, async () => {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Correction : certains types d'utilisateur n'ont pas le champ "roles", doit utiliser "role"
    // On gère le cas où soit "role" soit "roles" est défini.
    let userRole: UserRole | undefined = undefined;
    if ('role' in session.user && session.user.role) {
      userRole = session.user.role as UserRole;
    } else if (
      'roles' in session.user &&
      Array.isArray(session.user.roles) &&
      session.user.roles.length > 0
    ) {
      userRole = session.user.roles[0] as UserRole;
    }
    if (!userRole || userRole !== UserRole.CUSTOMER) {
      return NextResponse.json(
        { error: 'Seuls les clients peuvent effectuer des paiements' },
        { status: 403 },
      );
    }

    // Validation avec Zod
    const body = await req.json();
    const data: CreatePaymentIntentInput = validateBody(body, CreatePaymentIntentSchema);
    
    const amount = data.amount;
    const currency = data.currency.toLowerCase();
    const email = data.email;
    const metadata = data.metadata;

    // Tentative de création de PaymentIntent avec PaymentService (Strategy Pattern)
    // Convertir le montant de centimes en euros pour PaymentService
    const amountInEuros = amount / 100;
    
    // Utiliser PaymentService avec Strategy Pattern
    // Le service sélectionne automatiquement la meilleure stratégie (Stripe par défaut)
    const paymentIntent = await paymentService.createPaymentIntent(
      amountInEuros,
      currency.toUpperCase(),
      session.user.id, // Utiliser l'ID utilisateur comme customerId
      {
        ...(metadata || {}),
        customerEmail: email,
      },
    );

    const reqId = req.headers.get('x-request-id');
    const log = childLogger({
      requestId: reqId || undefined,
      route: 'payments/create-intent',
    });
    log.info({
      msg: 'PaymentIntent created',
      amount,
      currency,
      email,
      paymentIntentId: paymentIntent.id,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.clientSecret,
      paymentIntentId: paymentIntent.id,
      currency: paymentIntent.currency,
      amount: paymentIntent.amount * 100, // Convertir en centimes pour le client
      status: paymentIntent.status,
    });
  }, 'api/payments/create-intent');
}
