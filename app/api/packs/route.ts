/**
 * API Route - Packs
 * GET /api/packs - Liste des packs
 * POST /api/packs - Création d'un pack
 */

import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { auth } from '@/auth';
import { ROLES } from '@/lib/constants';
import dbConnect from '@/lib/mongodb';
import Pack from '@/models/Pack';
import { CreatePackSchema } from '@/lib/validations/pack.schema';
import { NextRequest, NextResponse } from 'next/server';
import { childLogger } from '@/lib/logger';

const log = childLogger({ route: 'api/packs' });

function slugify(value: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const isActiveRaw = searchParams.get('isActive');

    const query: any = {};
    if (category) query.category = category;
    if (isActiveRaw !== null) query.isActive = isActiveRaw === 'true';

    const packs = await (Pack as any).find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: packs,
      count: packs.length,
    });
  }, 'api/packs');
}

export async function POST(request: NextRequest) {
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
    const data = validateBody(body, CreatePackSchema);

    await dbConnect();

    // Générer un id si absent
    let packId = (data.id || '').trim();
    if (!packId) {
      packId = slugify(data.label);
    }
    if (!packId) {
      return NextResponse.json(
        { error: "Impossible de générer l'ID du pack" },
        { status: 400 },
      );
    }

    // Unicité
    const existing = await (Pack as any).findOne({ id: packId });
    if (existing) {
      return NextResponse.json(
        { error: 'Un pack avec cet ID existe déjà' },
        { status: 409 },
      );
    }

    const created = await (Pack as any).create({
      id: packId,
      label: data.label,
      description: data.description,
      category: data.category,
      serviceIds: data.serviceIds,
      isActive: data.isActive ?? true,
      createdBy: session.user.id,
    });

    log.info({ packId: created.id, _id: created._id }, 'Pack created');

    return NextResponse.json(
      {
        success: true,
        data: created,
        message: 'Pack créé avec succès',
      },
      { status: 201 },
    );
  }, 'api/packs');
}


