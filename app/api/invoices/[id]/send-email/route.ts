import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { invoiceService } from '@/services/invoice/invoice.service';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour envoyer une facture par email
 * Implémente les design patterns :
 * - Service Layer Pattern (via invoiceService)
 * - Logger Pattern (structured logging avec childLogger)
 * - Error Handling Pattern (Sentry)
 */

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/invoices/[id]/send-email',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const invoiceId = params.id;
    const userId = session.user.id;

    log.debug({ invoiceId, userId }, 'Sending invoice by email');

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
        msg: 'Unauthorized access to invoice email',
      });
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 },
      );
    }

    // TODO: Envoyer la facture par email
    // Il faudra utiliser le service d'email (Resend) pour envoyer la facture
    log.warn({ invoiceId }, 'Email sending not yet implemented');

    return NextResponse.json(
      { error: 'Envoi par email non implémenté' },
      { status: 501 },
    );

    // Une fois implémenté, le code ressemblera à :
    // await emailService.sendInvoiceEmail(invoice);
    // log.info({ invoiceId, userId }, 'Invoice sent by email successfully');
    // return NextResponse.json({ success: true });
  } catch (error) {
    log.error({ error, invoiceId: params.id }, 'Error sending invoice email');
    Sentry.captureException(error, {
      tags: {
        component: 'InvoiceEmailAPI',
        action: 'send-email',
      },
      extra: { invoiceId: params.id },
    });
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la facture par email" },
      { status: 500 },
    );
  }
}
