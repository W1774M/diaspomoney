/**
 * PATCH /api/admin/provider-applications/[id] — admin : met à jour le statut ou la note
 * d'une candidature « Devenir prestataire ».
 */
import { ApiErrors, handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { ROLES } from '@/lib/constants';
import { childLogger } from '@/lib/logger';
import { getMongoClient } from '@/lib/mongodb';
import {
  PROVIDER_APPLICATIONS_COLLECTION,
  ProviderApplicationUpdateSchema,
  toProviderApplication,
} from '@/lib/provider-applications';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

const log = childLogger({ route: 'api/admin/provider-applications/[id]' });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleApiRoute(request, async () => {
    const session = await requireApiRoles([ROLES.ADMIN, ROLES.SUPERADMIN]);
    const { id } = await params;
    if (!ObjectId.isValid(id)) throw ApiErrors.NOT_FOUND;

    const data = validateBody(await request.json(), ProviderApplicationUpdateSchema);

    const client = await getMongoClient();
    const updated = await client
      .db()
      .collection(PROVIDER_APPLICATIONS_COLLECTION)
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...(data.status !== undefined && { status: data.status }),
            ...(data.note !== undefined && { note: data.note }),
            updatedAt: new Date(),
            updatedBy: session.user.id,
          },
        },
        { returnDocument: 'after' },
      );

    if (!updated) throw ApiErrors.NOT_FOUND;

    log.info({ id, status: data.status, userId: session.user.id }, 'Provider application updated');
    return NextResponse.json({ success: true, application: toProviderApplication(updated) });
  }, 'api/admin/provider-applications/[id]');
}
