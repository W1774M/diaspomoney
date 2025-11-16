/**
 * API Route - Process Payment (avec Facade)
 * Endpoint pour traiter un paiement complet avec orchestration
 */

import { auth } from '@/auth';
import { commandHandler, CreatePaymentCommand } from '@/commands';
import { PaymentFacadeData } from '@/facades/payment.facade';
import { initializeDI } from '@/lib/di/initialize';
import { logger } from '@/lib/logger';
import { UserRole } from '@/types/user';
import { NextRequest, NextResponse } from 'next/server';

// Initialiser le système DI au chargement du module
if (typeof window === 'undefined') {
  initializeDI();
}

export async function POST(req: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier le rôle
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

    // Parser le body
    let body: any;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Le corps de la requête doit être au format JSON valide.' },
        { status: 400 }
      );
    }

    const {
      amount,
      currency = 'EUR',
      paymentMethodId,
      payerId,
      beneficiaryId,
      serviceType,
      serviceId,
      description,
      createInvoice = true,
      sendNotification = true,
      metadata,
    } = body;

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      );
    }

    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return NextResponse.json(
        { error: 'Méthode de paiement requise' },
        { status: 400 }
      );
    }

    if (!serviceType || !['HEALTH', 'BTP', 'EDUCATION'].includes(serviceType)) {
      return NextResponse.json(
        { error: 'Type de service invalide' },
        { status: 400 }
      );
    }

    // Préparer les données pour la commande
    const paymentData: PaymentFacadeData = {
      amount,
      currency: currency.toUpperCase(),
      customerId: session.user.id,
      paymentMethodId,
      payerId: payerId || session.user.id,
      beneficiaryId: beneficiaryId || session.user.id,
      serviceType,
      serviceId: serviceId || 'default',
      description: description || `Payment of ${amount} ${currency}`,
      createInvoice,
      sendNotification,
      metadata: metadata || {},
    };

    // Utiliser le Command Pattern pour exécuter la commande avec historique et undo
    const command = new CreatePaymentCommand(paymentData);
    const commandResult = await commandHandler.execute(command);

    if (!commandResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: commandResult.error || 'Erreur lors du traitement du paiement',
        },
        { status: 400 }
      );
    }

    const result = commandResult.data!;

    // Si le paiement nécessite une action (3D Secure, etc.)
    if (result.requiresAction) {
      return NextResponse.json(
        {
          success: false,
          requiresAction: true,
          nextAction: result.nextAction,
          error: result.error,
        },
        { status: 200 } // 200 car c'est un état valide qui nécessite une action utilisateur
      );
    }

    logger.info({
      paymentIntentId: result.paymentIntentId,
      transactionId: result.transactionId,
      invoiceId: result.invoiceId,
      userId: session.user.id,
    }, 'Payment processed successfully via Command Pattern');

    return NextResponse.json({
      success: true,
      paymentIntentId: result.paymentIntentId,
      transactionId: result.transactionId,
      invoiceId: result.invoiceId,
      message: 'Paiement traité avec succès',
    });
  } catch (error: any) {
    logger.error({ error }, 'Error processing payment via PaymentFacade');
    return NextResponse.json(
      { error: error?.message || 'Erreur lors du traitement du paiement' },
      { status: 500 }
    );
  }
}

