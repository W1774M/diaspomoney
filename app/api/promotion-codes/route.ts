/**
 * API Route - Promotion Codes
 * Endpoint pour gérer les codes promotionnels (CRUD)
 * 
 * Implémente les design patterns :
 * - Service Layer Pattern
 * - Repository Pattern
 * - Error Handling Pattern
 * - Authorization Pattern
 */

import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { auth } from '@/auth';
import { ROLES } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PromotionCode from '@/models/PromotionCode';
import { z } from 'zod';

const log = childLogger({ route: 'api/promotion-codes' });

// Schéma de validation pour créer un code promotionnel
const CreatePromotionCodeSchema = z.object({
  label: z.string().min(3).max(50).optional(), // Optionnel, peut être généré automatiquement
  percentage: z.number().min(0).max(100),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime(),
  maxUsage: z.number().min(1).nullable().optional(),
});

// Fonction pour générer un label automatique
function generatePromotionCodeLabel(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclut les caractères ambigus
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * GET /api/promotion-codes
 * Récupérer tous les codes promotionnels
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 },
      );
    }

    // Vérifier que l'utilisateur est admin
    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes(ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Accès refusé. Admin uniquement.' },
        { status: 403 },
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const query: any = {};

    if (status) {
      query.status = status;
    }

    const codes = await (PromotionCode as any).find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Calculer le statut réel basé sur les dates
    const now = new Date();
    const codesWithCalculatedStatus = codes.map((code: any) => {
      let calculatedStatus = code.status;
      
      if (code.status === 'valid') {
        if (new Date(code.validUntil) < now) {
          calculatedStatus = 'expired';
        } else if (code.maxUsage && code.usageCount >= code.maxUsage) {
          calculatedStatus = 'expired';
        }
      }

      return {
        ...code,
        calculatedStatus,
        isValid: calculatedStatus === 'valid' && 
                 new Date(code.validFrom) <= now && 
                 new Date(code.validUntil) >= now &&
                 (!code.maxUsage || code.usageCount < code.maxUsage),
      };
    });

    return NextResponse.json({
      success: true,
      codes: codesWithCalculatedStatus,
    });
  }, 'api/promotion-codes');
}

/**
 * POST /api/promotion-codes
 * Créer un nouveau code promotionnel
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

    // Vérifier que l'utilisateur est admin
    const userRoles = (session.user as any).roles || [];
    if (!userRoles.includes(ROLES.ADMIN)) {
      return NextResponse.json(
        { error: 'Accès refusé. Admin uniquement.' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const data = validateBody(body, CreatePromotionCodeSchema);

    await dbConnect();

    // Générer un label si non fourni
    let label = data.label?.toUpperCase().trim();
    if (!label) {
      // Générer un label unique
      let attempts = 0;
      do {
        label = generatePromotionCodeLabel();
        const existing = await (PromotionCode as any).findOne({ label });
        if (!existing) break;
        attempts++;
        if (attempts > 10) {
          throw new Error('Impossible de générer un code unique');
        }
      } while (true);
    } else {
      // Vérifier que le label n'existe pas déjà
      const existing = await (PromotionCode as any).findOne({ label });
      if (existing) {
        return NextResponse.json(
          { error: 'Un code avec ce label existe déjà' },
          { status: 409 },
        );
      }
    }

    const validFrom = data.validFrom ? new Date(data.validFrom) : new Date();
    const validUntil = new Date(data.validUntil);

    if (validUntil <= validFrom) {
      return NextResponse.json(
        { error: 'La date de fin doit être postérieure à la date de début' },
        { status: 400 },
      );
    }

    const code = await (PromotionCode as any).create({
      label,
      percentage: data.percentage,
      validFrom,
      validUntil,
      maxUsage: data.maxUsage || null,
      status: 'valid',
      createdBy: session.user.id,
    });

    log.info({ codeId: code._id, label }, 'Promotion code created');

    return NextResponse.json(
      {
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
      },
      { status: 201 },
    );
  }, 'api/promotion-codes');
}

