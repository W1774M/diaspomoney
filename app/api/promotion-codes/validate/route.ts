/**
 * API Route - Validate Promotion Code
 * Endpoint pour valider un code promotionnel
 * Accessible à tous les utilisateurs authentifiés
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
 * Valider un code promotionnel
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { label, amount = 0 } = z
      .object({
        label: z.string().min(3).max(50),
        amount: z.number().min(0).optional(),
      })
      .parse(body);

    await dbConnect();

    const PromotionCodeModel = PromotionCode as any;
    const code = await PromotionCodeModel.findOne({
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
    const validFrom = new Date((code as any).validFrom);
    const validUntil = new Date((code as any).validUntil);

    // Vérifier le statut
    if ((code as any).status !== 'valid') {
      return NextResponse.json({
        success: true,
        valid: false,
        error: 'Ce code promotionnel n\'est plus valide',
        code: {
          label: (code as any).label,
          status: (code as any).status,
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
          label: (code as any).label,
          validFrom: validFrom,
        },
      });
    }

    if (now > validUntil) {
      // Marquer comme expiré
      (code as any).status = 'expired';
      await code.save();

      return NextResponse.json({
        success: true,
        valid: false,
        error: 'Ce code promotionnel a expiré',
        code: {
          label: (code as any).label,
          status: 'expired',
        },
      });
    }

    // Vérifier l'usage maximum
    if ((code as any).maxUsage && (code as any).usageCount >= (code as any).maxUsage) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: 'Ce code promotionnel a atteint son nombre maximum d\'utilisations',
        code: {
          label: (code as any).label,
          usageCount: (code as any).usageCount,
          maxUsage: (code as any).maxUsage,
        },
      });
    }

    // Code valide
    const discountAmount = amount > 0 
      ? ((amount * (code as any).percentage) / 100)
      : 0;
    const finalAmount = amount > 0 
      ? (amount - discountAmount)
      : 0;

    log.info(
      { 
        codeId: (code as any)._id, 
        label: (code as any).label,
        userId: session.user.id,
      },
      'Promotion code validated',
    );

    return NextResponse.json({
      success: true,
      valid: true,
      code: {
        _id: (code as any)._id,
        id: (code as any)._id.toString(),
        label: (code as any).label,
        percentage: (code as any).percentage,
        validFrom: validFrom,
        validUntil: validUntil,
        usageCount: (code as any).usageCount,
        maxUsage: (code as any).maxUsage,
      },
      discount: {
        percentage: (code as any).percentage,
        amount: discountAmount,
        finalAmount: finalAmount,
      },
    });
  }, 'api/promotion-codes/validate');
}

