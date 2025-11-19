import { auth } from '@/auth';
import { InvoiceQueryBuilder } from '@/builders';
import { invoiceFacade, type InvoiceFacadeData } from '@/facades';
import { handleApiRoute, ApiErrors, ApiError, validateBody } from '@/lib/api/error-handler';
import { CreateInvoiceSchema } from '@/lib/validations/invoice.schema';
import { childLogger } from '@/lib/logger';
import { getInvoiceRepository } from '@/repositories';
import { invoiceService } from '@/services/invoice/invoice.service';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

// Constante locale pour éviter le problème d'import
const DEFAULT_CURRENCY = 'EUR';

/**
 * API Route pour créer et lister les factures
 * Implémente les design patterns :
 * - Service Layer Pattern (via invoiceService)
 * - Repository Pattern (via invoiceService qui utilise les repositories)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 * - Decorator Pattern (@Log, @Cacheable, @Validate, @InvalidateCache dans le service)
 * - Builder Pattern (via InvoiceQueryBuilder)
 * - Facade Pattern (via InvoiceFacade pour orchestrer la création complète)
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

    // Utiliser InvoiceQueryBuilder pour construire la requête (Builder Pattern)
    const queryBuilder = new InvoiceQueryBuilder();

    // Vérifier si l'utilisateur est admin
    const isAdmin =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('SUPERADMIN');

    // Si l'utilisateur n'est pas admin, filtrer par userId
    if (!isAdmin) {
      queryBuilder.byUser(userId);
    }

    // Appliquer les filtres
    if (status) {
      queryBuilder.byStatus(status as any);
    }

    // Pagination
    queryBuilder.page(page, limit);

    // Construire la requête
    const query = queryBuilder.build();

    // Utiliser le repository avec les filtres du builder
    const invoiceRepository = getInvoiceRepository();
    const pageNumber = query.pagination?.page || 1;
    const pageLimit = query.pagination?.limit || 20;
    const offset = (pageNumber - 1) * pageLimit;

    const result = await invoiceRepository.findInvoicesWithFilters(
      query.filters,
      {
        limit: pageLimit,
        page: page,
        offset: offset,
        sort: query.sort || { createdAt: -1 },
      },
    );

    // Adapter le résultat au format attendu
    const invoices = {
      data: result.data,
      total: result.total,
      page,
      limit,
    };

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
 * 
 * Implémente les design patterns :
 * - Service Layer Pattern (via invoiceService)
 * - Repository Pattern (via invoiceService qui utilise les repositories)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateInvoiceSchema)
 * - Facade Pattern (via InvoiceFacade pour orchestrer la création complète)
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    const userId = session.user.id;

    // Vérifier que l'utilisateur est admin (seuls les admins peuvent créer des factures)
    const isAdmin =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('SUPERADMIN');

    if (!isAdmin) {
      throw ApiErrors.FORBIDDEN;
    }

    // Validation avec Zod
    const body = await request.json();
    const data = validateBody(body, CreateInvoiceSchema);

    // Calculer le montant total depuis les items
    const amount = data.items.reduce(
      (sum, item) => sum + (item.total || item.quantity * item.unitPrice),
      0,
    );

    // Préparer les données pour la facade avec types stricts
    const invoiceData: InvoiceFacadeData = {
      userId: data.customerId, // Le customerId devient le userId dans le service
      amount,
      currency: data.currency || DEFAULT_CURRENCY,
      tax: data.tax ?? 0,
      items: data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total || item.quantity * item.unitPrice,
      })),
      ...(data.transactionId && { transactionId: data.transactionId }),
      ...(data.bookingId && { bookingId: data.bookingId }),
      ...(data.dueDate && {
        dueDate: typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate,
      }),
      ...(data.billingAddress && { billingAddress: data.billingAddress }),
      metadata: {
        ...(data.metadata || {}),
        ...(data.providerId && { providerId: data.providerId }),
        issueDate: data.issueDate ? new Date(data.issueDate as string) : new Date(),
        ...(data.notes && { notes: data.notes }),
        createdBy: userId, // L'admin qui crée la facture
      },
      // Options de la facade
      sendEmail: data.sendEmail ?? true, // Par défaut, envoyer l'email
      sendNotification: data.sendNotification ?? true, // Par défaut, envoyer la notification
      ...(data.recipientEmail && { recipientEmail: data.recipientEmail }),
    };

    // Utiliser InvoiceFacade pour orchestrer la création complète (Facade Pattern)
    // La facade gère : création de facture + envoi email + notifications
    const result = await invoiceFacade.createInvoice(invoiceData);

    if (!result.success || !result.invoiceId) {
      throw new ApiError(400, result.error || 'Erreur lors de la création de la facture');
    }

    // Récupérer la facture complète pour la réponse
    const invoice = await invoiceService.getInvoiceById(result.invoiceId);
    if (!invoice) {
      throw ApiErrors.NOT_FOUND;
    }

    return {
      success: true,
      invoice,
      emailSent: result.emailSent ?? false,
      notificationSent: result.notificationSent ?? false,
    };
  }, 'api/invoices');
}
