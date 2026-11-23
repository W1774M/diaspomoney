/**
 * API Route - CSM Portfolio Providers
 * Permet à un CSM de gérer son portefeuille de prestataires.
 *
 * - GET: retourne la liste des providerIds du portefeuille
 * - POST: ajoute un prestataire au portefeuille, soit par son providerId,
 *   soit par ses coordonnées ({ provider: { nom, e-mail ou téléphone… } }) :
 *   le CSM ne connaît pas toujours l'identifiant, et le prestataire n'a pas
 *   forcément de compte (création PENDING à valider par un admin, voir
 *   services/csm/propose-provider.use-case.ts)
 * - DELETE: retire un providerId du portefeuille
 *
 * Sécurité: rôle CSM obligatoire (session NextAuth).
 */

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

import { auth } from '@/auth';
import { DATABASE, ROLES } from '@/lib/constants';
import { getMongoClient } from '@/lib/database/mongodb';
import { handleApiRoute, ApiError, ApiErrors, validateBody } from '@/lib/api/error-handler';
import { getPublicBaseUrl } from '@/lib/api/public-url';
import { ProviderProposalSchema } from '@/lib/csm/provider-proposal';
import { proposeProviderForCsm } from '@/services/csm/propose-provider.use-case';
import { z } from 'zod';
import { invalidateAppCache } from '@/lib/cache/redis';

const BodySchema = z.object({
  // NB : [a-f\d] et non [a-f\\d] (qui refusait tout identifiant contenant un chiffre)
  providerId: z.string().regex(/^[a-f\d]{24}$/i, 'Identifiant de prestataire invalide (ObjectId MongoDB attendu)'),
});

const ProposalBodySchema = z.object({ provider: ProviderProposalSchema });

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

    // Ajout par coordonnées (prestataire existant retrouvé, ou compte à valider)
    if (body && typeof body === 'object' && 'provider' in body) {
      const { provider } = validateBody(body, ProposalBodySchema);
      const outcome = await proposeProviderForCsm(provider, {
        csmId: session.user.id,
        ...(session.user.name ? { csmName: session.user.name } : {}),
        baseUrl: getPublicBaseUrl(request),
      });

      if (outcome.status === 'conflict') {
        throw new ApiError(409, outcome.message, 'PROVIDER_EMAIL_CONFLICT');
      }

      return { success: true, ...outcome };
    }

    const { providerId } = validateBody(body, BodySchema);

    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection(DATABASE.COLLECTIONS.USERS);

    // Ne rattacher qu'un vrai prestataire
    const provider = await users.findOne(
      { _id: new ObjectId(providerId), roles: ROLES.PROVIDER },
      { projection: { _id: 1 } },
    );
    if (!provider) {
      throw new ApiError(404, 'Prestataire introuvable', 'PROVIDER_NOT_FOUND');
    }

    await users.updateOne(
      { _id: new ObjectId(session.user.id) },
      { $addToSet: { csmPortfolioProviderIds: providerId } },
    );
    await invalidateAppCache('UserRepository'); // écriture hors dépôt : vider le cache

    return { success: true, status: 'linked', providerId };
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
    await invalidateAppCache('UserRepository'); // écriture hors dépôt : vider le cache

    return { success: true };
  }, 'api/csm/portfolio/providers:remove');
}


