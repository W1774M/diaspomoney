/**
 * PATCH  /api/presence-countries/[id] — admin : modifie un pays (statut, nom, ordre…)
 * DELETE /api/presence-countries/[id] — admin : retire un pays
 */
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { ROLES } from '@/lib/constants';
import { childLogger } from '@/lib/logger';
import dbConnect from '@/lib/mongodb';
import { PresenceCountryUpdateSchema } from '@/lib/presence-countries';
import { toPresenceCountry } from '@/lib/presence-countries.server';
import PresenceCountry from '@/models/PresenceCountry';
import { isValidObjectId } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

const log = childLogger({ route: 'api/presence-countries/[id]' });

type Params = { params: Promise<{ id: string }> | { id: string } };

const notFound = () => NextResponse.json({ error: 'Pays non trouvé' }, { status: 404 });

export async function PATCH(request: NextRequest, { params }: Params) {
  return handleApiRoute(request, async () => {
    const { id } = await Promise.resolve(params);
    const session = await requireApiRoles([ROLES.ADMIN, ROLES.SUPERADMIN]);
    if (!isValidObjectId(id)) return notFound();

    const data = validateBody(await request.json(), PresenceCountryUpdateSchema);
    await dbConnect();

    if (data.iso) {
      const duplicate = await PresenceCountry.exists({ iso: data.iso, _id: { $ne: id } });
      if (duplicate) {
        return NextResponse.json({ error: 'Ce pays est déjà dans la liste' }, { status: 409 });
      }
    }

    const updated = await PresenceCountry.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    }).lean();
    if (!updated) return notFound();

    log.info({ id, changes: Object.keys(data), userId: session.user.id }, 'Presence country updated');
    return NextResponse.json({ success: true, country: toPresenceCountry(updated as never) });
  }, 'api/presence-countries/[id]');
}

export async function DELETE(request: NextRequest, { params }: Params) {
  return handleApiRoute(request, async () => {
    const { id } = await Promise.resolve(params);
    const session = await requireApiRoles([ROLES.ADMIN, ROLES.SUPERADMIN]);
    if (!isValidObjectId(id)) return notFound();

    await dbConnect();
    const deleted = await PresenceCountry.findByIdAndDelete(id);
    if (!deleted) return notFound();

    log.info({ id, iso: deleted.iso, userId: session.user.id }, 'Presence country deleted');
    return NextResponse.json({ success: true });
  }, 'api/presence-countries/[id]');
}
