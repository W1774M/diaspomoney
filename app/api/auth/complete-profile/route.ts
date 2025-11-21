import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { logger } from '@/lib/logger';
import { CompleteProfileSchema, type CompleteProfileInput } from '@/lib/validations/auth.schema';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    // Validation avec Zod
    const body = await request.json();
    const data: CompleteProfileInput = validateBody(body, CompleteProfileSchema);
    
    const {
      phone,
      countryOfResidence,
      targetCountry,
      targetCity,
      monthlyBudget,
    } = data;

    // TODO: Implement the profile completion logic
    logger.info({
      phone,
      countryOfResidence,
      targetCountry,
      targetCity,
      monthlyBudget,
    }, 'Profile completed successfully');

    return NextResponse.json({ success: true });
  }, 'api/auth/complete-profile');
}
