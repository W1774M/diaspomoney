/**
 * Support d'un compte utilisateur (administrateurs uniquement).
 *
 *   GET  → fiche support : état, volumes, dernières interventions du support
 *   POST → action ciblée { action: 'suspend' | 'reactivate' | 'send-password-reset', reason }
 *
 * Chaque action est journalisée avec son auteur et son motif (voir lib/support/support.service.ts).
 */
import { auth } from '@/auth';
import { handleApiRoute } from '@/lib/api/error-handler';
import { getPublicBaseUrl } from '@/lib/api/public-url';
import { getSupportSummary, requireSupportAgent, runSupportAction } from '@/lib/support/support.service';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      await requireSupportAgent(session?.user?.id);
      const { id } = await params;
      return { success: true, data: await getSupportSummary(id) };
    },
    'api/admin/support/users/[id]',
  );
}

export async function POST(request: NextRequest, { params }: Params) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      const agent = await requireSupportAgent(session?.user?.id);
      const { id } = await params;
      const body = (await request.json().catch(() => ({}))) as { action?: unknown; reason?: unknown };
      const result = await runSupportAction(agent, id, body.action, body.reason, {
        baseUrl: getPublicBaseUrl(request),
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
      return { success: true, ...result };
    },
    'api/admin/support/users/[id]',
  );
}
