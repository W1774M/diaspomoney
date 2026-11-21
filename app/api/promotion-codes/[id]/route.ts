/**
 * API Route - Promotion Code by ID
 * Endpoint pour gérer un code promotionnel spécifique (UPDATE, DELETE)
 */

import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { childLogger } from '@/lib/logger';
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
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  return handleApiRoute(request, async () => {
    const { id } = await Promise.resolve(params);

    await requireApiRoles([ROLES.ADMIN, ROLES.SUPERADMIN]);

    const body = await request.json();
    const data = validateBody(body, UpdatePromotionCodeSchema);

    await dbConnect();

    const code = await PromotionCode.findById(id);
    if (!code) {
      return NextResponse.json(
        { error: 'Code promotionnel non trouvé' },
        { status: 404 },
      );
    }

    // Vérifier l'unicité du label si modifié
    if (data.label) {
      const label = data.label.toUpperCase().trim();
      const existing = await PromotionCode.findOne({
        label,
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Un code avec ce label existe déjà' },
          { status: 409 },
        );
      }
      code.label = label;
    }

    if (data.percentage !== undefined) {
      code.percentage = data.percentage;
    }

    if (data.validFrom) {
      code.validFrom = new Date(data.validFrom);
    }

    if (data.validUntil) {
      code.validUntil = new Date(data.validUntil);
    }

    if (data.status) {
      code.status = data.status;
    }

    if (data.maxUsage !== undefined) {
      code.maxUsage = data.maxUsage;
    }

    // Validation des dates
    const validFrom = code.validFrom;
    const validUntil = code.validUntil;
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
        label: code.label,
        percentage: code.percentage,
        validFrom: code.validFrom,
        validUntil: code.validUntil,
        status: code.status,
        usageCount: code.usageCount,
        maxUsage: code.maxUsage,
        createdAt: code.createdAt,
        updatedAt: code.updatedAt,
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
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  return handleApiRoute(request, async () => {
    const { id } = await Promise.resolve(params);

    await requireApiRoles([ROLES.ADMIN, ROLES.SUPERADMIN]);

    await dbConnect();

    const code = await PromotionCode.findByIdAndDelete(id);
    if (!code) {
      return NextResponse.json(
        { error: 'Code promotionnel non trouvé' },
        { status: 404 },
      );
    }

    log.info({ codeId: id }, 'Promotion code deleted');

    return NextResponse.json({
      success: true,
      message: 'Code promotionnel supprimé avec succès',
    });
  }, 'api/promotion-codes/[id]');
}

