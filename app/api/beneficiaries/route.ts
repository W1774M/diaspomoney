/**
// Désactiver le prerendering pour cette route API
;

 * API Route - Beneficiaries
 * Endpoints pour gérer les bénéficiaires
 * Utilise BeneficiaryFacade (Facade Pattern) et handleApiRoute (Error Handling Pattern)
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { beneficiaryFacade } from '@/facades';
import { getUserRepository } from '@/repositories';
import {
  CreateBeneficiaryApiSchema,
  type CreateBeneficiaryApiInput,
} from '@/lib/validations/beneficiary.schema';
import { NextRequest } from 'next/server';

/**
 * GET /api/beneficiaries - Récupérer tous les bénéficiaires de l'utilisateur
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        throw ApiErrors.UNAUTHORIZED;
      }

      // Utiliser UserRepository (Repository Pattern)
      const userRepository = getUserRepository();
      const user = await userRepository.findByEmail(userEmail);

      if (!user) {
        throw ApiErrors.NOT_FOUND;
      }

      const userId = user.id || (user as any)._id?.toString() || '';

      // Utiliser BeneficiaryFacade pour récupérer les bénéficiaires
      const beneficiaries = await beneficiaryFacade.getBeneficiaries(userId);

      // Mapper vers le format attendu par le frontend (compatibilité)
      const mappedBeneficiaries = beneficiaries.map(b => ({
        _id: b.id || (b as any)._id?.toString(),
        id: b.id || (b as any)._id?.toString(),
        name: `${b.firstName} ${b.lastName}`,
        firstName: b.firstName,
        lastName: b.lastName,
        email: b.email || '',
        phone: b.phone || '',
        relationship: b.relationship,
        hasAccount: false, // TODO: Implémenter la vérification
        status: b.isActive ? 'active' : 'inactive',
        createdAt: b.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: b.updatedAt?.toISOString() || new Date().toISOString(),
      }));

      return { beneficiaries: mappedBeneficiaries };
    },
    'api/beneficiaries',
  );
}

/**
 * POST /api/beneficiaries - Créer un nouveau bénéficiaire
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      const session = await auth();
      const userEmail = session?.user?.email;

      if (!userEmail) {
        throw ApiErrors.UNAUTHORIZED;
      }

      // Valider le body avec Zod
      const body = await request.json();
      const validatedData = validateBody<CreateBeneficiaryApiInput>(
        body,
        CreateBeneficiaryApiSchema,
      );

      // Utiliser UserRepository (Repository Pattern)
      const userRepository = getUserRepository();
      const user = await userRepository.findByEmail(userEmail);

      if (!user) {
        throw ApiErrors.NOT_FOUND;
      }

      const userId = user.id || (user as any)._id?.toString() || '';

      // Parser le nom si fourni comme "firstName lastName" ou utiliser firstName/lastName
      let finalFirstName: string;
      let finalLastName: string;

      if (validatedData.firstName && validatedData.lastName) {
        finalFirstName = validatedData.firstName.trim();
        finalLastName = validatedData.lastName.trim();
      } else if (validatedData.name) {
        const nameParts = validatedData.name.trim().split(' ');
        finalFirstName = nameParts[0] || '';
        finalLastName = nameParts.slice(1).join(' ') || '';
      } else {
        throw ApiErrors.VALIDATION_ERROR('Le nom (ou prénom et nom) est obligatoire');
      }

      if (!finalFirstName || !finalLastName) {
        throw ApiErrors.VALIDATION_ERROR('Le prénom et le nom sont obligatoires');
      }

      // Utiliser BeneficiaryFacade pour créer le bénéficiaire
      const facadeData: any = {
        firstName: finalFirstName,
        lastName: finalLastName,
        relationship: validatedData.relationship as any,
        country: validatedData.country || (user as any)['countryOfResidence'] || 'FR', // Utiliser le pays de l'utilisateur par défaut
        sendNotification: true,
        sendEmail: !!validatedData.email,
      };

      if (validatedData.email?.trim()) {
        facadeData.email = validatedData.email.trim();
      }

      if (validatedData.phone?.trim()) {
        facadeData.phone = validatedData.phone.trim();
      }

      const result = await beneficiaryFacade.createBeneficiary(userId, facadeData);

      if (!result.success || !result.beneficiary) {
        throw ApiErrors.VALIDATION_ERROR(
          result.error || 'Erreur lors de la création du bénéficiaire',
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
    'api/beneficiaries',
  );
}
