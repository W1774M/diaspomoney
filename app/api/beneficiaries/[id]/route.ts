/**
 * API Route - Beneficiary by ID
 * Endpoints pour modifier et supprimer un bénéficiaire spécifique
 * Utilise BeneficiaryFacade (Facade Pattern) et handleApiRoute (Error Handling Pattern)
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { beneficiaryFacade } from '@/facades';
import { getUserRepository } from '@/repositories';
import {
  UpdateBeneficiaryApiSchema,
  type UpdateBeneficiaryApiInput,
} from '@/lib/validations/beneficiary.schema';
import { NextRequest } from 'next/server';

/**
 * PUT /api/beneficiaries/[id] - Modifier un bénéficiaire
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        throw ApiErrors.UNAUTHORIZED;
      }

      const beneficiaryId = params.id;

      if (!beneficiaryId) {
        throw ApiErrors.VALIDATION_ERROR('ID de bénéficiaire requis');
      }

      // Valider le body avec Zod
      const body = await request.json();
      const validatedData = validateBody<UpdateBeneficiaryApiInput>(
        body,
        UpdateBeneficiaryApiSchema,
      );

      // Utiliser UserRepository (Repository Pattern)
      const userRepository = getUserRepository();
      const user = await userRepository.findByEmail(userEmail);

      if (!user) {
        throw ApiErrors.NOT_FOUND;
      }

      const userId = user.id || (user as any)._id?.toString() || '';

      // Préparer les données de mise à jour
      const updateData: any = {};

      if (validatedData.firstName && validatedData.lastName) {
        updateData.firstName = validatedData.firstName.trim();
        updateData.lastName = validatedData.lastName.trim();
      } else if (validatedData.name) {
        const nameParts = validatedData.name.trim().split(' ');
        updateData.firstName = nameParts[0] || '';
        updateData.lastName = nameParts.slice(1).join(' ') || '';
      }

      if (validatedData.email !== undefined) {
        updateData.email = validatedData.email?.trim() || undefined;
      }

      if (validatedData.phone !== undefined) {
        updateData.phone = validatedData.phone?.trim() || undefined;
      }

      if (validatedData.relationship) {
        updateData.relationship = validatedData.relationship;
      }

      if (validatedData.country) {
        updateData.country = validatedData.country;
      }

      // Utiliser BeneficiaryFacade pour mettre à jour le bénéficiaire
      const result = await beneficiaryFacade.updateBeneficiary(
        userId,
        beneficiaryId,
        updateData,
      );

      if (!result.success || !result.beneficiary) {
        throw ApiErrors.VALIDATION_ERROR(
          result.error || 'Erreur lors de la mise à jour du bénéficiaire',
        );
      }

      const beneficiary = result.beneficiary;

      // Mapper vers le format attendu par le frontend (compatibilité)
      const mappedBeneficiary = {
        _id: beneficiary.id || (beneficiary as any)._id?.toString(),
        id: beneficiary.id || (beneficiary as any)._id?.toString(),
        name: `${beneficiary.firstName} ${beneficiary.lastName}`,
        firstName: beneficiary.firstName,
        lastName: beneficiary.lastName,
        email: beneficiary.email || '',
        phone: beneficiary.phone || '',
        relationship: beneficiary.relationship,
        hasAccount: false,
        status: beneficiary.isActive ? 'active' : 'inactive',
        createdAt: beneficiary.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: beneficiary.updatedAt?.toISOString() || new Date().toISOString(),
      };

      return { beneficiary: mappedBeneficiary };
    },
    'api/beneficiaries/[id]',
  );
}

/**
 * DELETE /api/beneficiaries/[id] - Supprimer un bénéficiaire
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        throw ApiErrors.UNAUTHORIZED;
      }

      const beneficiaryId = params.id;

      if (!beneficiaryId) {
        throw ApiErrors.VALIDATION_ERROR('ID de bénéficiaire requis');
      }

      // Utiliser UserRepository (Repository Pattern)
      const userRepository = getUserRepository();
      const user = await userRepository.findByEmail(userEmail);

      if (!user) {
        throw ApiErrors.NOT_FOUND;
      }

      const userId = user.id || (user as any)._id?.toString() || '';

      // Utiliser BeneficiaryFacade pour supprimer le bénéficiaire
      const result = await beneficiaryFacade.deleteBeneficiary(userId, beneficiaryId);

      if (!result.success) {
        throw ApiErrors.VALIDATION_ERROR(
          result.error || 'Erreur lors de la suppression du bénéficiaire',
        );
      }

      return { message: 'Bénéficiaire supprimé avec succès' };
    },
    'api/beneficiaries/[id]',
  );
}
