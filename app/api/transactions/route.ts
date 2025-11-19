/**
 * API Route - Transactions
 * Endpoint de gestion des transactions
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { CreateTransactionSchema } from '@/lib/validations/transaction.schema';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import {
  TransactionService,
} from '@/services/transaction/transaction.service';
import type { TransactionData, TransactionFilters } from '@/lib/types';
import { NextRequest } from 'next/server';

/**
 * GET /api/transactions - Récupérer les transactions
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Authentification via NextAuth
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);

    // Utiliser TransactionQueryBuilder pour construire la requête
    const { TransactionQueryBuilder } = await import('@/builders');
    const queryBuilder = new TransactionQueryBuilder().byUser(session.user.id);

    // Appliquer les filtres
    if (searchParams.get('status')) {
      queryBuilder.byStatus(searchParams.get('status') as any);
    }
    if (searchParams.get('serviceType')) {
      queryBuilder.byServiceType(searchParams.get('serviceType') as any);
    }
    if (searchParams.get('dateFrom') && searchParams.get('dateTo')) {
      queryBuilder.createdBetween(
        new Date(searchParams.get('dateFrom')!),
        new Date(searchParams.get('dateTo')!),
      );
    } else if (searchParams.get('dateFrom')) {
      queryBuilder.createdAfter(new Date(searchParams.get('dateFrom')!));
    } else if (searchParams.get('dateTo')) {
      queryBuilder.createdBefore(new Date(searchParams.get('dateTo')!));
    }
    if (searchParams.get('minAmount') && searchParams.get('maxAmount')) {
      queryBuilder.amountBetween(
        parseFloat(searchParams.get('minAmount')!),
        parseFloat(searchParams.get('maxAmount')!),
      );
    } else if (searchParams.get('minAmount')) {
      queryBuilder.minAmount(parseFloat(searchParams.get('minAmount')!));
    } else if (searchParams.get('maxAmount')) {
      queryBuilder.maxAmount(parseFloat(searchParams.get('maxAmount')!));
    }
    if (searchParams.get('currency')) {
      queryBuilder.byCurrency(searchParams.get('currency')!);
    }

    // Pagination
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 50;
    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1;
    queryBuilder.page(page, limit);

    // Construire les filtres pour le service à partir du builder
    const builtFilters = queryBuilder.build();
    const filters = builtFilters.filters;

    // Récupérer les transactions
    const transactions = await TransactionService.getInstance().getTransactions(
      session.user.id,
      filters as TransactionFilters,
    );

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'api_transactions_retrieved',
      value: transactions.length,
      timestamp: new Date(),
      labels: {
        user_role: String(session.user.roles?.[0] || 'UNKNOWN'),
        filter_count: String(
          Object.values(filters).filter(v => v !== undefined).length,
        ),
      },
      type: 'counter',
    });

    return {
      success: true,
      transactions,
      count: transactions.length,
    };
  }, 'api/transactions');
}

/**
 * POST /api/transactions - Créer une nouvelle transaction
 * 
 * Implémente les design patterns :
 * - Service Layer Pattern (via TransactionService)
 * - Repository Pattern (via TransactionService qui utilise les repositories)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateTransactionSchema)
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Authentification via NextAuth
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Validation avec Zod
    const body = await request.json();
    const data = validateBody(body, CreateTransactionSchema);

    // Préparer les données pour le service avec types stricts
    const transactionData: TransactionData = {
      payerId: session.user.id,
      beneficiaryId: data.beneficiaryId,
      serviceType: data.serviceType as 'HEALTH' | 'BTP' | 'EDUCATION',
      serviceId: data.serviceId,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      metadata: data.metadata as Record<string, any>,
    };

    // Créer la transaction
    const transaction = await TransactionService.getInstance().createTransaction(transactionData);

    // Enregistrer les métriques
    const amountRange = transactionData.amount < 50 ? 'low' : transactionData.amount < 500 ? 'medium' : 'high';
    monitoringManager.recordMetric({
      name: 'api_transactions_created',
      value: 1,
      timestamp: new Date(),
      labels: {
        user_role: String(session.user.roles?.[0] || 'UNKNOWN'),
        service_type: transactionData.serviceType,
        currency: transactionData.currency,
        amount_range: amountRange,
      },
      type: 'counter',
    });

    return {
      success: true,
      transaction,
      message: 'Transaction créée avec succès',
    };
  }, 'api/transactions');
}
