/**
 * POST /api/admin/support/users/[id]/impersonation { reason }
 *
 * Prépare une consultation du compte en lecture seule (« voir en tant que ») et renvoie un
 * ticket à usage unique. Le navigateur de l'admin l'échange ensuite contre la consultation
 * via la mise à jour de session NextAuth : update({ impersonationTicket }).
 */
import { auth } from '@/auth';
import { handleApiRoute } from '@/lib/api/error-handler';
import { createImpersonationTicket, requireSupportAgent } from '@/lib/support/support.service';
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      const agent = await requireSupportAgent(session?.user?.id);
      const { id } = await params;
      const body = (await request.json().catch(() => ({}))) as { reason?: unknown };
      const ticket = await createImpersonationTicket(agent, id, body.reason, {
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim(),
        userAgent: request.headers.get('user-agent') ?? undefined,
      });
      return { success: true, data: ticket };
    },
    'api/admin/support/users/[id]/impersonation',
  );
}
