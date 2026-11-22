/**
 * PATCH  /api/home-banner-messages/[id] — admin : modifie un message (texte, lien, activation, ordre…)
 * DELETE /api/home-banner-messages/[id] — admin : supprime un message
 */
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { ROLES } from '@/lib/constants';
import { BannerMessageUpdateSchema } from '@/lib/home-content';
import { invalidateHomeContent, toBannerMessage } from '@/lib/home-content.server';
import { childLogger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { HomeBannerMessageModel } from '@/models/HomeContent';
import { isValidObjectId } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

const log = childLogger({ route: 'api/home-banner-messages/[id]' });
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.SUPERADMIN];

type Params = { params: Promise<{ id: string }> | { id: string } };

const notFound = () => NextResponse.json({ error: 'Message non trouvé' }, { status: 404 });

export async function PATCH(request: NextRequest, { params }: Params) {
  return handleApiRoute(request, async () => {
    const { id } = await Promise.resolve(params);
    const session = await requireApiRoles(ADMIN_ROLES);
    if (!isValidObjectId(id)) return notFound();

    const data = validateBody(await request.json(), BannerMessageUpdateSchema);
    await dbConnect();
    const updated = await HomeBannerMessageModel.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return notFound();

    invalidateHomeContent();
    log.info({ id, changes: Object.keys(data), userId: session.user.id }, 'Banner message updated');
    return NextResponse.json({ success: true, message: toBannerMessage(updated) });
  }, 'api/home-banner-messages/[id]');
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return handleApiRoute(request, async () => {
    const { id } = await Promise.resolve(params);
    const session = await requireApiRoles(ADMIN_ROLES);
    if (!isValidObjectId(id)) return notFound();

    await dbConnect();
    const deleted = await HomeBannerMessageModel.findByIdAndDelete(id);
    if (!deleted) return notFound();

    invalidateHomeContent();
    log.info({ id, userId: session.user.id }, 'Banner message deleted');
    return NextResponse.json({ success: true });
  }, 'api/home-banner-messages/[id]');
}
