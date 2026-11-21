/**
 * API Route - Pack by ID
 * PATCH /api/packs/[id] - Mise à jour
 * DELETE /api/packs/[id] - Suppression
 */

import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { auth } from '@/auth';
import { ROLES } from '@/lib/constants';
import dbConnect from '@/lib/mongodb';
import Pack from '@/models/Pack';
import { UpdatePackSchema } from '@/lib/validations/pack.schema';
import { NextRequest, NextResponse } from 'next/server';
import { childLogger } from '@/lib/logger';
import mongoose from 'mongoose';

const log = childLogger({ route: 'api/packs/[id]' });

async function findPackByIdOrCustomId(id: string): Promise<any | null> {
  const PackModel = Pack as any;
  const custom = await PackModel.findOne({ id });
  if (custom) return custom;

  if (mongoose.Types.ObjectId.isValid(id)) {
    return await PackModel.findById(id);
  }
  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes(ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Accès refusé. Admin uniquement.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = validateBody(body, UpdatePackSchema);

    await dbConnect();

    const pack = await findPackByIdOrCustomId(params.id);
    if (!pack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 });
    }

    if (data.label !== undefined) pack.label = data.label;
    if (data.description !== undefined) pack.description = data.description;
    if (data.category !== undefined) pack.category = data.category;
    if (data.serviceIds !== undefined) pack.serviceIds = data.serviceIds;
    if (data.isActive !== undefined) pack.isActive = data.isActive;

    await pack.save();

    log.info({ _id: pack._id, id: pack.id }, 'Pack updated');

    return NextResponse.json({ success: true, data: pack });
  }, 'api/packs/[id]');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes(ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Accès refusé. Admin uniquement.' },
        { status: 403 },
      );
    }

    await dbConnect();

    const pack = await findPackByIdOrCustomId(params.id);
    if (!pack) {
      return NextResponse.json({ error: 'Pack non trouvé' }, { status: 404 });
    }

    await (Pack as any).deleteOne({ _id: pack._id });

    log.info({ _id: pack._id, id: pack.id }, 'Pack deleted');

    return NextResponse.json({
      success: true,
      message: 'Pack supprimé avec succès',
    });
  }, 'api/packs/[id]');
}


