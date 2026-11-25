/**
 * Nettoyage ponctuel des réservations au prestataire fictif (voir services/booking/clear-fake-provider-ids.ts).
 *
 * - `POST /api/maintenance/clear-fake-provider-ids` : dry-run, rien n'est écrit ;
 * - `POST /api/maintenance/clear-fake-provider-ids?apply=1` : passe ces réservations en « non attribuées ».
 *
 * Lancée depuis le conteneur par docker/cron/clear-fake-provider-ids.sh.
 * Protégée par `Authorization: Bearer <MAINTENANCE_CRON_SECRET>`.
 */
import { NextRequest, NextResponse } from 'next/server';

import { assertCronSecret } from '@/lib/api/cron-auth';
import { handleApiRoute } from '@/lib/api/error-handler';
import { clearFakeProviderIds } from '@/services/booking/clear-fake-provider-ids';

export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      assertCronSecret(request, 'MAINTENANCE_CRON_SECRET');
      const apply = new URL(request.url).searchParams.get('apply') === '1';
      const report = await clearFakeProviderIds({ apply });
      return NextResponse.json({ success: true, report });
    },
    'api/maintenance/clear-fake-provider-ids',
  );
}
