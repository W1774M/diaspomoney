/**
 * API Route - Promotion Code by ID
 * Endpoint pour gérer un code promotionnel spécifique (UPDATE, DELETE)
 */

import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { auth } from '@/auth';
import { ROLES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PromotionCode from '@/models/PromotionCode';
import { z } from 'zod';

const log = childLogger({ route: 'api/promotion-codes/[id]' });

const UpdatePromotionCodeSchema = z.object({
  label: z.string().min(3).max(50).optional(),
  percentage: z.number().min(0).max(100).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  status: z.enum(['valid', 'expired', 'invalid']).optional(),
  maxUsage: z.number().min(1).nullable().optional(),
});

/**
 * PATCH /api/promotion-codes/[id]
 * Mettre à jour un code promotionnel
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 },
      );
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes(ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Accès refusé. Admin uniquement.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = validateBody(body, UpdatePromotionCodeSchema);

    await dbConnect();

    const PromotionCodeModel = PromotionCode as any;
    const code = await PromotionCodeModel.findById(params.id);
    if (!code) {
      return NextResponse.json(
        { error: 'Code promotionnel non trouvé' },
        { status: 404 },
      );
    }

    // Vérifier l'unicité du label si modifié
    if (data.label) {
      const label = data.label.toUpperCase().trim();
      const existing = await PromotionCodeModel.findOne({
        label,
        _id: { $ne: params.id },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Un code avec ce label existe déjà' },
          { status: 409 },
        );
      }
      (code as any).label = label;
    }

    if (data.percentage !== undefined) {
      (code as any).percentage = data.percentage;
    }

    if (data.validFrom) {
      (code as any).validFrom = new Date(data.validFrom);
    }

    if (data.validUntil) {
      (code as any).validUntil = new Date(data.validUntil);
    }

    if (data.status) {
      (code as any).status = data.status;
    }

    if (data.maxUsage !== undefined) {
      (code as any).maxUsage = data.maxUsage;
    }

    // Validation des dates
    const validFrom = (code as any).validFrom;
    const validUntil = (code as any).validUntil;
    if (validUntil <= validFrom) {
      return NextResponse.json(
        { error: 'La date de fin doit être postérieure à la date de début' },
        { status: 400 },
      );
    }

    await code.save();

    log.info({ codeId: code._id }, 'Promotion code updated');

    return NextResponse.json({
      success: true,
      code: {
        _id: code._id,
        id: code._id.toString(),
        label: (code as any).label,
        percentage: (code as any).percentage,
        validFrom: (code as any).validFrom,
        validUntil: (code as any).validUntil,
        status: (code as any).status,
        usageCount: (code as any).usageCount,
        maxUsage: (code as any).maxUsage,
        createdAt: (code as any).createdAt,
        updatedAt: (code as any).updatedAt,
      },
    });
  }, 'api/promotion-codes/[id]');
}

/**
 * DELETE /api/promotion-codes/[id]
 * Supprimer un code promotionnel
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 },
      );
    }

    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes(ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Accès refusé. Admin uniquement.' },
        { status: 403 },
      );
    }

    await dbConnect();

    const PromotionCodeModel = PromotionCode as any;
    const code = await PromotionCodeModel.findByIdAndDelete(params.id);
    if (!code) {
      return NextResponse.json(
        { error: 'Code promotionnel non trouvé' },
        { status: 404 },
      );
    }

    log.info({ codeId: params.id }, 'Promotion code deleted');

    return NextResponse.json({
      success: true,
      message: 'Code promotionnel supprimé avec succès',
    });
  }, 'api/promotion-codes/[id]');
}

