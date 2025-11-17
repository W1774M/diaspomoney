import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { invoiceService } from '@/services/invoice/invoice.service';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour créer et lister les factures
 * Implémente les design patterns :
 * - Service Layer Pattern (via invoiceService)
 * - Repository Pattern (via invoiceService qui utilise les repositories)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Decorator Pattern (@Log, @Cacheable, @Validate, @InvalidateCache dans le service)
 */

/**
 * GET /api/invoices - Récupérer la liste des factures
 */
export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/invoices',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    log.debug({ userId, page, limit, status }, 'Fetching invoices');

    // Utiliser le service pour récupérer les factures
    const filters: any = {};
    if (status) {
      filters.status = status;
    }

    // Vérifier si l'utilisateur est admin
    const isAdmin =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('SUPERADMIN');

    // Si l'utilisateur n'est pas admin, filtrer par userId
    if (!isAdmin) {
      filters.userId = userId;
    }

    const invoices = await invoiceService.getUserInvoices(userId, {
      limit,
      offset: (page - 1) * limit,
      ...filters,
    });

    log.info(
      {
        userId,
        invoicesCount: invoices.data.length,
        total: invoices.total,
      },
      'Invoices fetched successfully',
    );

    return NextResponse.json({
      success: true,
      invoices: invoices.data,
      pagination: {
        page: invoices.page,
        limit: invoices.limit,
        total: invoices.total,
        totalPages: Math.ceil(invoices.total / invoices.limit),
      },
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching invoices' },
      'Error fetching invoices',
    );
    Sentry.captureException(error, {
      tags: {
        component: 'InvoiceAPI',
        action: 'GET',
      },
    });
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des factures' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/invoices - Créer une nouvelle facture
 */
export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/invoices',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;

    // Vérifier que l'utilisateur est admin (seuls les admins peuvent créer des factures)
    const isAdmin =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('SUPERADMIN');

    if (!isAdmin) {
      log.warn({
        userId,
        msg: 'Unauthorized invoice creation attempt (non-admin)',
      });
      return NextResponse.json(
        { error: 'Accès non autorisé - Admin uniquement' },
        { status: 403 },
      );
    }

    const body = await request.json();

    log.debug({ userId, body }, 'Creating invoice');

    // Validation des données requises
    if (!body.customerId || !body.items || body.items.length === 0) {
      log.warn({ userId, body }, 'Invalid invoice data');
      return NextResponse.json(
        { error: 'Données de facture incomplètes' },
        { status: 400 },
      );
    }

    // Calculer le montant total depuis les items
    const amount = body.items.reduce(
      (sum: number, item: any) =>
        sum + (item.total || item.quantity * item.unitPrice),
      0,
    );

    // Préparer les données pour le service
    const invoiceData: any = {
      userId: body.customerId, // Le customerId devient le userId dans le service
      transactionId: body.transactionId,
      bookingId: body.bookingId,
      amount,
      currency: body.currency || 'EUR',
      tax: body.tax || 0,
      items: body.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total || item.quantity * item.unitPrice,
      })),
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      billingAddress: body.billingAddress,
      metadata: {
        ...body.metadata,
        providerId: body.providerId,
        issueDate: body.issueDate ? new Date(body.issueDate) : new Date(),
        notes: body.notes,
        createdBy: userId, // L'admin qui crée la facture
      },
    };

    // Utiliser le Service Layer Pattern (InvoiceService utilise déjà Repository Pattern)
    // Le service a déjà les decorators @Log, @InvalidateCache, @Validate
    const invoice = await invoiceService.createInvoice(
      invoiceData as unknown as any,
    );
    log.info(
      {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        userId,
        customerId: body.customerId,
      },
      'Invoice created successfully',
    );

    return NextResponse.json({
      success: true,
      invoice: invoice,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error creating invoice' },
      'Error creating invoice',
    );
    Sentry.captureException(error, {
      tags: {
        component: 'InvoiceAPI',
        action: 'POST',
      },
    });

    if (error instanceof Error) {
      if (error.message.includes('incomplet')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      if (error.message.includes('positif')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Erreur lors de la création de la facture' },
      { status: 500 },
    );
  }
}
