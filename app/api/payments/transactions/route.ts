import { auth } from '@/auth';
import { getTransactionRepository } from '@/repositories';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour récupérer l'historique des transactions
 * Implémente le Service Layer Pattern via les repositories
 */

// Désactiver le prerendering pour cette route API
// Elle nécessite une connexion MongoDB qui n'est pas disponible pendant le build
;

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;

    // Utiliser le repository (Repository Pattern)
    const transactionRepository = getTransactionRepository();

    // Récupérer toutes les transactions de l'utilisateur (payerId = userId)
    const result = await transactionRepository.findTransactionsWithFilters(
      {
        payerId: userId,
      },
      {
        limit: 100,
        page: 1,
        offset: 0,
        sort: { createdAt: -1 },
      },
    );

    const transactions = result.data;

    // Transformer en PaymentTransaction (format attendu par le frontend)
    const paymentTransactions = transactions.map(transaction => ({
      _id: transaction._id || transaction.id,
      transactionId: transaction.id || transaction._id,
      orderId: transaction.metadata?.['orderId'],
      bookingId: transaction.metadata?.['bookingId'],
      invoiceId: transaction.metadata?.['invoiceId'],
      amount: transaction.amount || 0,
      currency: transaction.currency || 'EUR',
      paymentMethod: transaction.paymentMethod?.toLowerCase() || 'card',
      paymentMethodId: transaction.paymentIntentId,
      status: transaction.status?.toLowerCase() || 'pending',
      description: transaction.description,
      metadata: transaction.metadata,
      processedAt: transaction.completedAt,
      refundedAt:
        transaction.status === 'REFUNDED' ? transaction.updatedAt : undefined,
      refundAmount:
        transaction.status === 'REFUNDED' ? transaction.amount : undefined,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      transactions: paymentTransactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des transactions' },
      { status: 500 },
    );
  }
}
