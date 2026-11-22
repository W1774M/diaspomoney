/**
 * Purge des journaux d'audit arrivés au terme de leur durée de conservation.
 * - audit général : retentionPeriod (jours) de chaque journal, 2 555 jours par défaut ;
 * - PCI-DSS : un an.
 *
 * Appelée chaque nuit par le cron du serveur (docker/cron/purge-audit-logs.sh), depuis le
 * conteneur lui-même. Protégée par `Authorization: Bearer <MAINTENANCE_CRON_SECRET>`.
 */
import { NextRequest, NextResponse } from 'next/server';

import { assertCronSecret } from '@/lib/api/cron-auth';
import { handleApiRoute } from '@/lib/api/error-handler';
import { invalidateAppCache } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';
import { getAuditLogRepository, getPCIAuditLogRepository } from '@/repositories';

export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      assertCronSecret(request, 'MAINTENANCE_CRON_SECRET');

      const auditLogs = await getAuditLogRepository().deleteExpiredLogs();
      const pciAuditLogs = await getPCIAuditLogRepository().deleteExpiredLogs();
      await invalidateAppCache('AuditLog');

      logger.info({ auditLogs, pciAuditLogs }, 'Purge des journaux d’audit expirés');
      return NextResponse.json({ success: true, deleted: { auditLogs, pciAuditLogs } });
    },
    'api/maintenance/purge-audit-logs',
  );
}
