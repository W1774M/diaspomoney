import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { invoiceService } from '@/services/invoice/invoice.service';
import { pdfGeneratorService } from '@/services/invoice/pdf-generator.service';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour télécharger une facture en PDF
 * Implémente les design patterns :
 * - Repository Pattern (via getInvoiceRepository)
 * - Service Layer Pattern (via invoiceService)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/invoices/[id]/download',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const invoiceId = params.id;
    const userId = session.user.id;

    log.debug({ invoiceId, userId }, 'Downloading invoice PDF');

    // Utiliser le service pour récupérer la facture
    const invoice = await invoiceService.getInvoiceById(invoiceId);

    // Vérifier les permissions
    const isOwner = invoice.userId === userId;
    const isAdmin =
      session.user.roles?.includes('ADMIN') ||
      session.user.roles?.includes('SUPERADMIN');

    if (!isOwner && !isAdmin) {
      log.warn({
        userId,
        invoiceId,
        msg: 'Unauthorized access to invoice download',
      });
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 },
      );
    }

    // Générer le PDF de la facture via le service
    log.debug({ invoiceId }, 'Generating invoice PDF');
    const pdfBuffer = await pdfGeneratorService.generateInvoicePDF(invoice);

    log.info(
      {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        pdfSize: pdfBuffer.length,
      },
      'Invoice PDF generated successfully',
    );

    // Retourner le PDF avec les headers appropriés
    // Convertir Buffer en Uint8Array pour NextResponse
    const pdfArray = new Uint8Array(pdfBuffer);
    return new NextResponse(pdfArray, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfArray.length.toString(),
      },
    });
  } catch (error) {
    log.error({ error, invoiceId: params.id }, 'Error downloading invoice');
    Sentry.captureException(error, {
      tags: {
        component: 'InvoiceDownloadAPI',
        action: 'download',
      },
      extra: { invoiceId: params.id },
    });
    return NextResponse.json(
      { error: 'Erreur lors du téléchargement de la facture' },
      { status: 500 },
    );
  }
}
