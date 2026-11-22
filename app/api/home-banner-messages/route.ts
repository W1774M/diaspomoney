/**
 * Messages du bandeau défilant de la home (admin).
 * GET  /api/home-banner-messages — liste complète, y compris inactifs
 * POST /api/home-banner-messages — ajoute un message
 */
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { ROLES } from '@/lib/constants';
import { BannerMessageCreateSchema } from '@/lib/home-content';
import {
  invalidateHomeContent,
  listBannerMessages,
  toBannerMessage,
} from '@/lib/home-content.server';
import { childLogger } from '@/lib/logger';
import { HomeBannerMessageModel } from '@/models/HomeContent';
import { NextRequest, NextResponse } from 'next/server';

const log = childLogger({ route: 'api/home-banner-messages' });
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN];

export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    await requireApiRoles(ADMIN_ROLES);
    const messages = await listBannerMessages();
    return NextResponse.json({ success: true, messages });
  }, 'api/home-banner-messages');
}

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await requireApiRoles(ADMIN_ROLES);
    const data = validateBody(await request.json(), BannerMessageCreateSchema);

    const existing = await listBannerMessages();
    const order = data.order ?? Math.max(0, ...existing.map((m) => m.order)) + 1;
    const created = await HomeBannerMessageModel.create({ ...data, order });

    invalidateHomeContent();
    log.info({ id: created.id, userId: session.user.id }, 'Banner message created');
    return NextResponse.json(
      { success: true, message: toBannerMessage(created.toObject()) },
      { status: 201 },
    );
  }, 'api/home-banner-messages');
}
