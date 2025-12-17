/**
;

 * API Route - Beneficiaries
 * Endpoints pour gérer les bénéficiaires
 * Utilise BeneficiaryFacade (Facade Pattern) et handleApiRoute (Error Handling Pattern)
 */

import { auth } from '@/auth';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { createListResponse, createResourceResponse } from '@/lib/api/response';
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

      return createListResponse(mappedBeneficiaries);
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

      // Valider et normaliser la localisation
      if (!validatedData.location) {
        throw ApiErrors.VALIDATION_ERROR('La localisation est requise');
      }

      // Utiliser BeneficiaryFacade pour créer le bénéficiaire
      const facadeData: any = {
        firstName: validatedData.firstName.trim(),
        lastName: validatedData.lastName.trim(),
        relationship: validatedData.relationship,
        location: (() => {
          const loc: any = {
            address: validatedData.location.address.trim(),
            city: validatedData.location.city.trim(),
            country: validatedData.location.country.trim(),
          };
          if (validatedData.location.postalCode?.trim()) {
            loc.postalCode = validatedData.location.postalCode.trim();
          }
          return loc;
        })(),
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

      if (!beneficiary) {
        throw ApiErrors.VALIDATION_ERROR('Bénéficiaire non créé');
      }

      // Nettoyer location pour enlever postalCode si undefined
      const cleanLocation: any = {
        address: beneficiary.location?.address || '',
        city: beneficiary.location?.city || '',
        country: beneficiary.location?.country || '',
      };
      if (beneficiary.location?.postalCode) {
        cleanLocation.postalCode = beneficiary.location.postalCode;
      }

      // Convertir les dates en string de manière sécurisée
      const createdAt = beneficiary.createdAt instanceof Date 
        ? beneficiary.createdAt.toISOString() 
        : typeof beneficiary.createdAt === 'string' 
          ? beneficiary.createdAt 
          : new Date().toISOString();
      
      const updatedAt = beneficiary.updatedAt instanceof Date 
        ? beneficiary.updatedAt.toISOString() 
        : typeof beneficiary.updatedAt === 'string' 
          ? beneficiary.updatedAt 
          : new Date().toISOString();

      // Mapper vers le format attendu par le frontend (compatibilité)
      const mappedBeneficiary: any = {
        _id: beneficiary.id || (beneficiary as any)._id?.toString(),
        id: beneficiary.id || (beneficiary as any)._id?.toString(),
        name: `${beneficiary.firstName} ${beneficiary.lastName}`,
        firstName: beneficiary.firstName,
        lastName: beneficiary.lastName,
        email: beneficiary.email || '',
        phone: beneficiary.phone || '',
        relationship: beneficiary.relationship,
        location: cleanLocation,
        hasAccount: false,
        status: beneficiary.isActive ? 'active' : 'inactive',
        createdAt,
        updatedAt,
      };

      return createResourceResponse(
        mappedBeneficiary,
        {
          message: 'Bénéficiaire créé avec succès',
        },
      );
    },
    'api/beneficiaries',
  );
}
