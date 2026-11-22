/**
 * PATCH  /api/home-announcements/[id] — admin : modifie une annonce
 * DELETE /api/home-announcements/[id] — admin : supprime une annonce (et son image si orpheline)
 */
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { ROLES } from '@/lib/constants';
import { AnnouncementUpdateSchema } from '@/lib/home-content';
import {
  deleteAnnouncementImageIfUnused,
  invalidateHomeContent,
  toAnnouncement,
} from '@/lib/home-content.server';
import { childLogger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { HomeAnnouncementModel } from '@/models/HomeContent';
import { isValidObjectId } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

const log = childLogger({ route: 'api/home-announcements/[id]' });
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN];

type Params = { params: Promise<{ id: string }> | { id: string } };

const notFound = () => NextResponse.json({ error: 'Annonce non trouvée' }, { status: 404 });

export async function PATCH(request: NextRequest, { params }: Params) {
  return handleApiRoute(request, async () => {
    const { id } = await Promise.resolve(params);
    const session = await requireApiRoles(ADMIN_ROLES);
    if (!isValidObjectId(id)) return notFound();

    const data = validateBody(await request.json(), AnnouncementUpdateSchema);
    await dbConnect();

    const previous = await HomeAnnouncementModel.findById(id).lean();
    if (!previous) return notFound();

    const updated = await HomeAnnouncementModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return notFound();

    if (data.imageUrl && data.imageUrl !== previous.imageUrl) {
      await deleteAnnouncementImageIfUnused(previous.imageUrl);
    }

    invalidateHomeContent();
    log.info({ id, changes: Object.keys(data), userId: session.user.id }, 'Announcement updated');
    return NextResponse.json({ success: true, announcement: toAnnouncement(updated) });
  }, 'api/home-announcements/[id]');
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return handleApiRoute(request, async () => {
    const { id } = await Promise.resolve(params);
    const session = await requireApiRoles(ADMIN_ROLES);
    if (!isValidObjectId(id)) return notFound();

    await dbConnect();
    const deleted = await HomeAnnouncementModel.findByIdAndDelete(id).lean();
    if (!deleted) return notFound();

    await deleteAnnouncementImageIfUnused(deleted.imageUrl);
    invalidateHomeContent();
    log.info({ id, userId: session.user.id }, 'Announcement deleted');
    return NextResponse.json({ success: true });
  }, 'api/home-announcements/[id]');
}
