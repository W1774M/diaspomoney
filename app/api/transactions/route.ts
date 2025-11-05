/**
 * API Route - Transactions
 * Endpoint de gestion des transactions
 */

import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';
import { securityManager } from '@/lib/security/advanced-security';
import { authService } from '@/services/auth/auth.service';
import {
  TransactionData,
  transactionService,
} from '@/services/transaction/transaction.service';
import { NextRequest, NextResponse } from 'next/server';

// GET - Récupérer les transactions
export async function GET(request: NextRequest) {
  try {
    // Authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Token d'authentification requis" },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await authService.verifyToken(token);

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);

    // Types fixes pour compatibilité TransactionFilters avec exactOptionalPropertyTypes
    const filters: {
      status?: string;
      serviceType?: string;
      dateFrom?: Date;
      dateTo?: Date;
      minAmount?: number;
      maxAmount?: number;
      currency?: string;
    } = {};

    if (searchParams.get('status') !== null)
      filters.status = searchParams.get('status')!;
    if (searchParams.get('serviceType') !== null)
      filters.serviceType = searchParams.get('serviceType')!;
    if (searchParams.get('dateFrom') !== null)
      filters.dateFrom = new Date(searchParams.get('dateFrom')!);
    if (searchParams.get('dateTo') !== null)
      filters.dateTo = new Date(searchParams.get('dateTo')!);
    if (searchParams.get('minAmount') !== null)
      filters.minAmount = parseFloat(searchParams.get('minAmount')!);
    if (searchParams.get('maxAmount') !== null)
      filters.maxAmount = parseFloat(searchParams.get('maxAmount')!);
    if (searchParams.get('currency') !== null)
      filters.currency = searchParams.get('currency')!;

    // Récupérer les transactions
    const transactions = await transactionService.getTransactions(
      user.id,
      filters
    );

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'api_transactions_retrieved',
      value: transactions.length,
      timestamp: new Date(),
      labels: {
        user_role: String(user.role),
        filter_count: String(
          Object.values(filters).filter(v => v !== undefined).length
        ),
      },
      type: 'counter',
    });

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('Erreur GET transactions:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur de récupération des transactions',
        success: false,
      },
      { status: 500 }
    );
  }
}

// POST - Créer une transaction
export async function POST(request: NextRequest) {
  try {
    // Authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: "Token d'authentification requis" },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await authService.verifyToken(token);

    // Vérifier les permissions
    if (
      typeof securityManager.hasPermission !== 'function' ||
      !securityManager.hasPermission(user.role, 'transactions', 'create')
    ) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      beneficiaryId,
      amount,
      currency,
      serviceType,
      serviceId,
      description,
      metadata,
    } = body;

    // Validation des entrées
    if (
      !beneficiaryId ||
      !amount ||
      !currency ||
      !serviceType ||
      !serviceId ||
      !description
    ) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Sanitisation/remplacement si nécessaire
    function sanitize(val: string) {
      return typeof val === 'string' ? val : '';
    }

    const sanitizedData = {
      payerId: user.id,
      beneficiaryId:
        typeof securityManager.sanitizeInput === 'function'
          ? securityManager.sanitize(beneficiaryId)
          : sanitize(beneficiaryId),
      amount: parseFloat(
        typeof securityManager.sanitize === 'function'
          ? securityManager.sanitize(amount)
          : amount
      ),
      currency:
        typeof securityManager.sanitizeInput === 'function'
          ? securityManager.sanitize(currency)
          : sanitize(currency),
      serviceType:
        typeof securityManager.sanitize === 'function'
          ? securityManager.sanitize(serviceType)
          : sanitize(serviceType),
      serviceId:
        typeof securityManager.sanitizeInput === 'function'
          ? securityManager.sanitize(serviceId)
          : sanitize(serviceId),
      description:
        typeof securityManager.sanitize === 'function'
          ? securityManager.sanitize(description)
          : sanitize(description),
      metadata: metadata
        ? typeof securityManager.sanitize === 'function'
          ? securityManager.sanitize(metadata)
          : metadata
        : undefined,
    };

    // Créer la transaction
    const transaction = await transactionService.createTransaction(
      sanitizedData as TransactionData
    );

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'api_transactions_created',
      value: 1,
      timestamp: new Date(),
      labels: {
        user_role: String(user.role),
        service_type: sanitizedData.serviceType as string,
        currency: sanitizedData.currency ?? '',
        amount_range:
          sanitizedData.amount < 50
            ? 'low'
            : sanitizedData.amount < 500
              ? 'medium'
              : 'high',
      },
      type: 'counter',
    });

    return NextResponse.json(
      {
        success: true,
        transaction,
        message: 'Transaction créée avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur POST transactions:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur de création de transaction',
        success: false,
      },
      { status: 400 }
    );
  }
}
