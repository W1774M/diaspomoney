/**
 * API Route - CSM Portfolio Providers
 * Permet à un CSM de gérer son portefeuille de prestataires.
 *
 * - GET: retourne la liste des providerIds du portefeuille
 * - POST: ajoute un providerId au portefeuille
 * - DELETE: retire un providerId du portefeuille
 *
 * Sécurité: rôle CSM obligatoire (session NextAuth).
 */

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

import { auth } from '@/auth';
import { DATABASE, ROLES } from '@/lib/constants';
import { getMongoClient } from '@/lib/database/mongodb';
import { handleApiRoute, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { z } from 'zod';

const BodySchema = z.object({
  providerId: z.string().regex(/^[a-f\\d]{24}$/i, 'Invalid provider ID format (must be MongoDB ObjectId)'),
});

export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    const roles = session?.user?.roles || [];
    if (!session?.user?.id) throw ApiErrors.UNAUTHORIZED;
    if (!roles.includes(ROLES.CSM)) throw ApiErrors.FORBIDDEN;

    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection(DATABASE.COLLECTIONS.USERS);

    const userDoc = await users.findOne(
      { _id: new ObjectId(session.user.id) },
      { projection: { csmPortfolioProviderIds: 1 } },
    );

    return {
      success: true,
      providerIds: (userDoc?.['csmPortfolioProviderIds'] as string[] | undefined) || [],
    };
  }, 'api/csm/portfolio/providers');
}

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    const roles = session?.user?.roles || [];
    if (!session?.user?.id) throw ApiErrors.UNAUTHORIZED;
    if (!roles.includes(ROLES.CSM)) throw ApiErrors.FORBIDDEN;

    const body = await request.json();
    const { providerId } = validateBody(body, BodySchema);

    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection(DATABASE.COLLECTIONS.USERS);

    await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $addToSet: { csmPortfolioProviderIds: providerId } },
    );

    return { success: true };
  }, 'api/csm/portfolio/providers:add');
}

export async function DELETE(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    const roles = session?.user?.roles || [];
    if (!session?.user?.id) throw ApiErrors.UNAUTHORIZED;
    if (!roles.includes(ROLES.CSM)) throw ApiErrors.FORBIDDEN;

    const body = await request.json();
    const { providerId } = validateBody(body, BodySchema);

    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection(DATABASE.COLLECTIONS.USERS);

    await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $pull: { csmPortfolioProviderIds: providerId } as any },
    );

    return { success: true };
  }, 'api/csm/portfolio/providers:remove');
}


