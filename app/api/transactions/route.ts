/**
 * API Route - Transactions
 * Endpoint de gestion des transactions
 */

import { NextRequest, NextResponse } from 'next/server';
import { transactionService } from '@/services/transaction/transaction.service';
import { authService } from '@/services/auth/auth.service';
import { securityManager } from '@/lib/security/advanced-security';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';

// GET - Récupérer les transactions
export async function GET(request: NextRequest) {
  try {
    // Authentification
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await authService.verifyToken(token);

    // Récupérer les paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      serviceType: searchParams.get('serviceType') || undefined,
      dateFrom: searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : undefined,
      dateTo: searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')!) : undefined,
      minAmount: searchParams.get('minAmount') ? parseFloat(searchParams.get('minAmount')!) : undefined,
      maxAmount: searchParams.get('maxAmount') ? parseFloat(searchParams.get('maxAmount')!) : undefined,
      currency: searchParams.get('currency') || undefined
    };

    // Récupérer les transactions
    const transactions = await transactionService.getTransactions(user.id, filters);

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'api_transactions_retrieved',
      value: transactions.length,
      timestamp: new Date(),
      labels: {
        user_role: user.role,
        filter_count: Object.values(filters).filter(v => v !== undefined).length
      },
      type: 'counter'
    });

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length
    });

  } catch (error) {
    console.error('Erreur GET transactions:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erreur de récupération des transactions',
        success: false 
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
        { error: 'Token d\'authentification requis' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = await authService.verifyToken(token);

    // Vérifier les permissions
    if (!securityManager.hasPermission(user.role, 'transactions', 'create')) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { beneficiaryId, amount, currency, serviceType, serviceId, description, metadata } = body;

    // Validation des entrées
    if (!beneficiaryId || !amount || !currency || !serviceType || !serviceId || !description) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Sanitisation des entrées
    const sanitizedData = {
      payerId: user.id,
      beneficiaryId: securityManager.sanitizeInput(beneficiaryId),
      amount: parseFloat(securityManager.sanitizeInput(amount)),
      currency: securityManager.sanitizeInput(currency),
      serviceType: securityManager.sanitizeInput(serviceType),
      serviceId: securityManager.sanitizeInput(serviceId),
      description: securityManager.sanitizeInput(description),
      metadata: metadata ? securityManager.sanitizeInput(metadata) : undefined
    };

    // Créer la transaction
    const transaction = await transactionService.createTransaction(sanitizedData);

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'api_transactions_created',
      value: 1,
      timestamp: new Date(),
      labels: {
        user_role: user.role,
        service_type: sanitizedData.serviceType,
        currency: sanitizedData.currency,
        amount_range: sanitizedData.amount < 50 ? 'low' : sanitizedData.amount < 500 ? 'medium' : 'high'
      },
      type: 'counter'
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Transaction créée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST transactions:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erreur de création de transaction',
        success: false 
      },
      { status: 400 }
    );
  }
}
