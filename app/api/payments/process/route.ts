/**
 * API Route - Process Payment (avec Facade)
 * Endpoint pour traiter un paiement complet avec orchestration
 */

// Désactiver le prerendering pour cette route API
// Elle nécessite une connexion MongoDB qui n'est pas disponible pendant le build
;

import { auth } from '@/auth';
import { commandHandler, CreatePaymentCommand } from '@/commands';
import { PaymentFacadeData } from '@/facades/payment.facade';
import { handleApiRoute, ApiErrors, ApiError, validateBody } from '@/lib/api/error-handler';
import { CreatePaymentSchema } from '@/lib/validations/payment.schema';
import { initializeDI } from '@/lib/di/initialize';
import { logger } from '@/lib/logger';
import { UserRole } from '@/lib/types';
import { NextRequest } from 'next/server';

// Initialiser le système DI au chargement du module
if (typeof window === 'undefined') {
  initializeDI();
}

/**
 * POST /api/payments/process - Traiter un paiement
 * 
 * Implémente les design patterns :
 * - Service Layer Pattern (via PaymentFacade)
 * - Repository Pattern (via PaymentFacade qui utilise les repositories)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreatePaymentSchema)
 * - Facade Pattern (via PaymentFacade pour orchestrer le processus complet)
 * - Command Pattern (via CreatePaymentCommand)
 */
export async function POST(req: NextRequest) {
  return handleApiRoute(req, async () => {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user || !session.user.id) {
      throw ApiErrors.UNAUTHORIZED;
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
      throw ApiErrors.FORBIDDEN;
    }

    // Validation avec Zod
    const body = await req.json();
    const data = validateBody(body, CreatePaymentSchema);

    // Préparer les données pour la commande avec types stricts
    const paymentData: PaymentFacadeData = {
      amount: data.amount,
      currency: data.currency.toUpperCase(),
      customerId: session.user.id,
      paymentMethodId: data.paymentMethodId,
      payerId: data.payerId || session.user.id,
      beneficiaryId: data.beneficiaryId || session.user.id,
      serviceType: data.serviceType,
      serviceId: data.serviceId || 'default' as const,
      description: data.description || `Payment of ${data.amount} ${data.currency}`,
      createInvoice: data.createInvoice ?? true,
      sendNotification: data.sendNotification ?? true,
      metadata: data.metadata || {},
    };

    // Utiliser le Command Pattern pour exécuter la commande avec historique et undo
    const command = new CreatePaymentCommand(paymentData);
    const commandResult = await commandHandler.execute(command);

    if (!commandResult.success) {
      throw new ApiError(400, commandResult.error || 'Erreur lors du traitement du paiement');
    }

    const result = commandResult.data;
    if (!result) {
      throw ApiErrors.INTERNAL_ERROR;
    }

    // Si le paiement nécessite une action (3D Secure, etc.)
    if (result.requiresAction) {
      return {
        success: false,
        requiresAction: true,
        nextAction: result.nextAction,
        error: result.error,
      };
    }

    logger.info({
      paymentIntentId: result.paymentIntentId,
      transactionId: result.transactionId,
      invoiceId: result.invoiceId,
      userId: session.user.id,
    }, 'Payment processed successfully via Command Pattern');

    return {
      success: true,
      paymentIntentId: result.paymentIntentId,
      transactionId: result.transactionId,
      invoiceId: result.invoiceId,
      message: 'Paiement traité avec succès',
    };
  }, 'api/payments/process');
}

