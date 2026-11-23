/**
 * GET /api/admin/tools — super admin : liens vers les outils d'exploitation
 * (Mongo Express, Portainer, Traefik, Grafana…). Les domaines restent côté serveur.
 */
import { handleApiRoute } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { buildAdminToolLinks } from '@/lib/admin-tools';
import { ROLES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    await requireApiRoles([ROLES.SUPERADMIN]);
    return NextResponse.json(
      { success: true, tools: buildAdminToolLinks(process.env) },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }, 'api/admin/tools');
}
