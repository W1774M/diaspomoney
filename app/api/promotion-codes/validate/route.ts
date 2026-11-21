/**
 * API Route - Validate Promotion Code
 * Endpoint pour valider un code promotionnel
 * Accessible à tous (invités et utilisateurs connectés) pour permettre
 * l'application d'un code lors du tunnel de réservation.
 */

import { handleApiRoute } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PromotionCode from '@/models/PromotionCode';
import { z } from 'zod';

const log = childLogger({ route: 'api/promotion-codes/validate' });


/**
 * POST /api/promotion-codes/validate
 * Valider un code promotionnel (invités et utilisateurs connectés)
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    const userId = session?.user?.id ?? 'guest';

    const body = await request.json();
    const { label, amount = 0 } = z
      .object({
        label: z.string().min(3).max(50),
        amount: z.number().min(0).optional(),
      })
      .parse(body);

    await dbConnect();

    const code = await PromotionCode.findOne({
      label: label.toUpperCase().trim(),
    });

    if (!code) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'Code promotionnel non trouvé',
      });
    }

    const now = new Date();
    const validFrom = new Date(code.validFrom);
    const validUntil = new Date(code.validUntil);

    // Vérifier le statut
    if (code.status !== 'valid') {
      return NextResponse.json({
        success: true,
        valid: false,
        error: 'Ce code promotionnel n\'est plus valide',
        code: {
          label: code.label,
          status: code.status,
        },
      });
    }

    // Vérifier les dates
    if (now < validFrom) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: 'Ce code promotionnel n\'est pas encore actif',
        code: {
          label: code.label,
          validFrom: validFrom,
        },
      });
    }

    if (now > validUntil) {
      // Marquer comme expiré
      code.status = 'expired';
      await code.save();

      return NextResponse.json({
        success: true,
        valid: false,
        error: 'Ce code promotionnel a expiré',
        code: {
          label: code.label,
          status: 'expired',
        },
      });
    }

    // Vérifier l'usage maximum
    if (code.maxUsage && code.usageCount >= code.maxUsage) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: 'Ce code promotionnel a atteint son nombre maximum d\'utilisations',
        code: {
          label: code.label,
          usageCount: code.usageCount,
          maxUsage: code.maxUsage,
        },
      });
    }

    // Code valide
    const discountAmount = amount > 0 
      ? ((amount * code.percentage) / 100)
      : 0;
    const finalAmount = amount > 0 
      ? (amount - discountAmount)
      : 0;

    log.info(
      { 
        codeId: code._id, 
        label: code.label,
        userId,
      },
      'Promotion code validated',
    );

    return NextResponse.json({
      success: true,
      valid: true,
      code: {
        _id: code._id,
        id: code._id.toString(),
        label: code.label,
        percentage: code.percentage,
        validFrom: validFrom,
        validUntil: validUntil,
        usageCount: code.usageCount,
        maxUsage: code.maxUsage,
      },
      discount: {
        percentage: code.percentage,
        amount: discountAmount,
        finalAmount: finalAmount,
      },
    });
  }, 'api/promotion-codes/validate');
}

