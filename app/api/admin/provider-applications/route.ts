/**
 * GET /api/admin/provider-applications — admin : liste des candidatures « Devenir prestataire »
 * (les plus récentes d'abord).
 */
import { handleApiRoute } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { ROLES } from '@/lib/constants';
import { getMongoClient } from '@/lib/mongodb';
import {
  PROVIDER_APPLICATIONS_COLLECTION,
  toProviderApplication,
} from '@/lib/provider-applications';
import { NextRequest, NextResponse } from 'next/server';

const MAX_RESULTS = 1000;

export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    await requireApiRoles([ROLES.ADMIN, ROLES.SUPERADMIN]);

    const client = await getMongoClient();
    const docs = await client
      .db()
      .collection(PROVIDER_APPLICATIONS_COLLECTION)
      .find({})
      .sort({ submittedAt: -1 })
      .limit(MAX_RESULTS)
      .toArray();

    return NextResponse.json(
      { success: true, applications: docs.map((doc) => toProviderApplication(doc)) },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }, 'api/admin/provider-applications');
}
