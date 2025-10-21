import { childLogger } from '@/lib/logger';
import { createPaymentIntent } from '@/lib/stripe-server';
import { UserRole } from '@/types/user';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../auth/[...nextauth]/route';

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.id) {
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
        { status: 403 }
      );
    }

    // On parse le JSON et gère les erreurs de parsing
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Le corps de la requête doit être au format JSON valide.' },
        { status: 400 }
      );
    }
    const { amount, currency = 'eur', email, metadata } = body || {};

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount (minor units)' },
        { status: 400 }
      );
    }

    // On vérifie également l'email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email manquant ou invalide' },
        { status: 400 }
      );
    }

    // Tentative de création de PaymentIntent
    let intent;
    try {
      intent = await createPaymentIntent({
        amountInMinorUnit: amount,
        currency,
        customerEmail: email,
        metadata,
      });
    } catch (intentError: any) {
      const reqId = req.headers.get('x-request-id');
      const log = childLogger({
        requestId: reqId || undefined,
        route: 'payments/create-intent',
      });
      log.error({
        err: intentError,
        msg: 'Erreur Stripe lors de la création du PaymentIntent',
      });
      return NextResponse.json(
        {
          error:
            intentError?.message ||
            'Erreur lors de la création du PaymentIntent Stripe',
        },
        { status: 502 }
      );
    }

    const res = NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      currency: intent.currency,
      amount: intent.amount,
      status: intent.status,
    });

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
      paymentIntentId: intent.id,
    });

    return res;
  } catch (error: any) {
    const reqId = req.headers.get('x-request-id');
    const log = childLogger({
      requestId: reqId || undefined,
      route: 'payments/create-intent',
    });
    log.error({ err: error, msg: 'Failed to create PaymentIntent' });
    return NextResponse.json(
      { error: error?.message || 'Failed to create PaymentIntent' },
      { status: 500 }
    );
  }
}
