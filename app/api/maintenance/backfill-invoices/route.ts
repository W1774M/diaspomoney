/**
 * Rattrapage ponctuel des factures des réservations payées avant que le chemin
 * canonique (confirm-booking-payment) ne facture.
 *
 * - `POST /api/maintenance/backfill-invoices` : dry-run, rien n'est écrit ;
 * - `POST /api/maintenance/backfill-invoices?apply=1` : crée les factures.
 *
 * Idempotent (une facture par paymentIntentId), relançable sans risque.
 * Lancée depuis le conteneur par docker/cron/backfill-invoices.sh.
 * Protégée par `Authorization: Bearer <MAINTENANCE_CRON_SECRET>`.
 */
import { NextRequest, NextResponse } from 'next/server';

import { assertCronSecret } from '@/lib/api/cron-auth';
import { handleApiRoute } from '@/lib/api/error-handler';
import { backfillBookingInvoices } from '@/services/booking/backfill-booking-invoices';

export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      assertCronSecret(request, 'MAINTENANCE_CRON_SECRET');

      const { searchParams } = new URL(request.url);
      const apply = searchParams.get('apply') === '1';
      const limitRaw = parseInt(searchParams.get('limit') || '', 10);

      const report = await backfillBookingInvoices({
        apply,
        ...(Number.isFinite(limitRaw) ? { limit: limitRaw } : {}),
      });
      return NextResponse.json({ success: report.failed.length === 0, report });
    },
    'api/maintenance/backfill-invoices',
  );
}
