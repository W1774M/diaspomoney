/**
 * Annonces mises en avant dans la fenêtre d'accueil (admin).
 * GET  /api/home-announcements — liste complète
 * POST /api/home-announcements — crée une annonce
 */
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { ROLES } from '@/lib/constants';
import { AnnouncementCreateSchema } from '@/lib/home-content';
import {
  invalidateHomeContent,
  listAnnouncements,
  toAnnouncement,
} from '@/lib/home-content.server';
import { childLogger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { HomeAnnouncementModel } from '@/models/HomeContent';
import { NextRequest, NextResponse } from 'next/server';

const log = childLogger({ route: 'api/home-announcements' });
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN];

export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    await requireApiRoles(ADMIN_ROLES);
    const announcements = await listAnnouncements();
    return NextResponse.json({ success: true, announcements });
  }, 'api/home-announcements');
}

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await requireApiRoles(ADMIN_ROLES);
    const data = validateBody(await request.json(), AnnouncementCreateSchema);

    await dbConnect();
    const created = await HomeAnnouncementModel.create(data);

    invalidateHomeContent();
    log.info({ id: created.id, userId: session.user.id }, 'Announcement created');
    return NextResponse.json(
      { success: true, announcement: toAnnouncement(created.toObject()) },
      { status: 201 },
    );
  }, 'api/home-announcements');
}
