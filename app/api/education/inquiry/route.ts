/**
 * API Route - Education Inquiry
 * Endpoint pour les demandes de renseignements éducation
 * Implémente les design patterns :
 * - Facade Pattern (via quoteFacade / CRM Quote)
 * - Service Layer Pattern (via educationService, délégué par la facade)
 * - Repository Pattern (via educationService qui utilise le repository)
 * - Logger Pattern (structured logging avec childLogger)
 * - Middleware Pattern (authentification optionnelle)
 * - Singleton Pattern (quoteFacade)
 */

import { auth } from '@/auth';
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { CreateQuoteSchema, type CreateQuoteInput } from '@/lib/validations/quote.schema';
import { quoteFacade } from '@/facades';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/education/inquiry' });

  return handleApiRoute(request, async () => {
    // Authentification optionnelle (pour les utilisateurs connectés)
    const session = await auth();
    const userId = session?.user?.id;

    const body = await request.json();

    // Validation avec Zod - S'assurer que le type est EDUCATION
    const validatedBody = { ...body, type: 'EDUCATION' as const };
    const data: CreateQuoteInput = validateBody(validatedBody, CreateQuoteSchema);

    log.debug(
      {
        userId,
        studentType: data.studentType,
        studentName: `${data.studentInfo?.firstName || ''} ${
          data.studentInfo?.lastName || ''
        }`,
        hasSchool: !!data.schoolId,
      },
      'Creating education inquiry request',
    );

    if (!data.studentInfo) {
      throw new Error('Student info is required for education inquiry');
    }

    // Construire studentInfo avec seulement les propriétés définies
    const studentInfo: {
      firstName: string;
      lastName: string;
      dateOfBirth?: string;
      gender?: 'MALE' | 'FEMALE' | 'OTHER';
      nationality?: string;
    } = {
      firstName: data.studentInfo.firstName,
      lastName: data.studentInfo.lastName,
    };
    if (data.studentInfo.dateOfBirth) {
      studentInfo.dateOfBirth =
        typeof data.studentInfo.dateOfBirth === 'string'
          ? data.studentInfo.dateOfBirth
          : data.studentInfo.dateOfBirth.toISOString();
    }
    if (data.studentInfo.gender)
      studentInfo.gender = data.studentInfo.gender as 'MALE' | 'FEMALE' | 'OTHER';
    if (data.studentInfo.nationality)
      studentInfo.nationality = data.studentInfo.nationality;

    // Construire contact avec seulement les propriétés définies
    const contact: { name: string; email: string; phone?: string } = {
      name: data.contact.name,
      email: data.contact.email,
    };
    if (data.contact.phone) contact.phone = data.contact.phone;

    // Construire l'objet inquiry avec seulement les propriétés définies
    const inquiryData: Record<string, unknown> = {
      studentType: data.studentType || 'SELF',
      studentInfo,
      contact,
    };

    if (data.academicInfo) {
      inquiryData.academicInfo = {
        ...(data.academicInfo.currentLevel
          ? { currentLevel: data.academicInfo.currentLevel }
          : {}),
        ...(data.academicInfo.desiredProgram
          ? { desiredProgram: data.academicInfo.desiredProgram }
          : {}),
        ...(data.academicInfo.academicYear
          ? { academicYear: data.academicInfo.academicYear }
          : {}),
        ...(data.academicInfo.previousEducation
          ? { previousEducation: data.academicInfo.previousEducation }
          : {}),
      };
    }
    if (data.preferences) {
      inquiryData.preferences = {
        ...(data.preferences.language
          ? { language: data.preferences.language }
          : {}),
        ...(data.preferences.schedule
          ? { schedule: data.preferences.schedule }
          : {}),
        ...(data.preferences.budget !== undefined
          ? { budget: data.preferences.budget }
          : {}),
        ...(data.preferences.urgency
          ? { urgency: data.preferences.urgency }
          : {}),
      };
    }
    if (data.questions) inquiryData.questions = data.questions;
    if (data.schoolId) inquiryData.schoolId = data.schoolId;

    // CRM Quote — invariants domaine via quoteFacade (délègue ensuite à educationService)
    const result = await quoteFacade.createQuote({
      sector: 'EDUCATION',
      ...(userId ? { clientId: userId } : {}),
      ...inquiryData,
    });

    if (!result.success || !result.quote) {
      throw new Error(
        result.error || 'Erreur lors de la création de la demande éducation',
      );
    }

    const quote = result.quote as { id?: string };

    log.info(
      {
        userId,
        quoteId: quote.id,
        studentType: data.studentType,
        program: data.academicInfo?.desiredProgram,
      },
      'Education inquiry request created successfully',
    );

    return NextResponse.json(
      {
        success: true,
        inquiryRequest: result.quote,
        message: 'Demande de renseignements envoyée avec succès',
      },
      { status: 201 },
    );
  }, 'api/education/inquiry');
}
