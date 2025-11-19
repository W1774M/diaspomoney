import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { getInvoiceRepository, getUserRepository } from '@/repositories';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour récupérer les reçus de paiement
 * Implémente les design patterns :
 * - Repository Pattern (via getInvoiceRepository, getUserRepository)
 * - Service Layer Pattern (via invoiceService)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 */
export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/payment-receipts',
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status') || 'all';

    log.debug({ userId, page, limit, status }, 'Fetching payment receipts');

    // Utiliser le repository pour récupérer les factures payées (reçus)
    // Les reçus de paiement sont des factures avec statut PAID
    const invoiceRepository = getInvoiceRepository();

    const invoicesResult = await invoiceRepository.findInvoicesWithFilters(
      {
        userId,
        status: 'PAID', // Seulement les factures payées
      },
      {
        limit,
        offset: (page - 1) * limit,
        sort: { paidAt: -1, createdAt: -1 },
      },
    );

    // Récupérer les informations des prestataires
    const userRepository = getUserRepository();

    const providerIds = Array.from(
      new Set(
        invoicesResult.data
          .map(inv => inv.metadata?.['providerId'])
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const providers = await Promise.all(
      providerIds.map(async id => {
        try {
          const provider = await userRepository.findById(id);
          return provider
            ? {
                id: provider.id || provider._id || id,
                name:
                  provider.name ||
                  `${provider.firstName || ''} ${
                    provider.lastName || ''
                  }`.trim() ||
                  'Prestataire',
              }
            : null;
        } catch {
          return null;
        }
      }),
    );

    const providerMap = new Map(
      providers
        .filter((p): p is { id: string; name: string } => p !== null)
        .map(p => [p.id, p.name]),
    );

    // Transformer les factures en reçus de paiement
    const receipts = invoicesResult.data.map(invoice => {
      const providerId = invoice.metadata?.['providerId'];
      const providerName = providerId
        ? providerMap.get(providerId) || 'Prestataire'
        : 'Prestataire';

      // Déterminer le service depuis les items ou metadata
      const serviceName =
        invoice.items?.[0]?.description ||
        invoice.metadata?.['serviceName'] ||
        'Service';

      // Déterminer la méthode de paiement depuis metadata
      const paymentMethod =
        invoice.metadata?.['paymentMethod'] || 'Carte bancaire';

      return {
        id: invoice.id || invoice._id || '',
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        currency: invoice.currency || 'EUR',
        status: 'paid' as const,
        paymentMethod,
        service: serviceName,
        provider: providerName,
        date: invoice.paidAt
          ? invoice.paidAt.toISOString()
          : invoice.createdAt.toISOString(),
        description:
          invoice.items?.map(item => item.description).join(', ') || '',
        downloadUrl: invoice.id ? `/api/invoices/${invoice.id}/download` : '',
      };
    });

    log.info(
      {
        userId,
        receiptsCount: receipts.length,
        total: invoicesResult.total,
      },
      'Payment receipts fetched successfully',
    );

    return NextResponse.json({
      success: true,
      receipts,
      pagination: {
        page,
        limit,
        total: invoicesResult.total,
        pages: Math.ceil(invoicesResult.total / limit),
      },
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching payment receipts' },
      'Error fetching payment receipts',
    );
    Sentry.captureException(error, {
      tags: {
        component: 'PaymentReceiptsAPI',
        action: 'GET',
      },
    });
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des reçus' },
      { status: 500 },
    );
  }
}
