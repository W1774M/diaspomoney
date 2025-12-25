/**
 * API Route - Public Packs (read-only)
 * GET /api/public/packs?category=HEALTH|EDUCATION|BTP
 *
 * Objectif: exposer les packs disponibles au site public (sans auth),
 * en ne retournant que les packs actifs.
 */

import { handleApiRoute } from '@/lib/api/error-handler';
import dbConnect from '@/lib/mongodb';
import Pack from '@/models/Pack';
import { NextRequest, NextResponse } from 'next/server';
import { SPECIALITY_TYPES } from '@/lib/constants';

export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const query: any = { isActive: true };
    if (
      category &&
      (category === SPECIALITY_TYPES.HEALTH ||
        category === SPECIALITY_TYPES.EDUCATION ||
        category === SPECIALITY_TYPES.BTP)
    ) {
      query.category = category;
    }

    const packs = await (Pack as any)
      .find(query)
      .sort({ createdAt: -1 })
      .select({ _id: 1, id: 1, label: 1, description: 1, category: 1, serviceIds: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: packs,
      count: packs.length,
    });
  }, 'api/public/packs');
}


