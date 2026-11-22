/**
 * API Route - Activate Account
 * Active un compte en attente à partir du lien envoyé par e-mail.
 * - Mot de passe déjà choisi à l'inscription : le lien suffit (il prouve l'adresse e-mail).
 * - Sinon (compte créé par l'admin) : le mot de passe est défini ici.
 */

import { handleApiRoute, validateBody, ApiError } from '@/lib/api/error-handler';
import { invalidateAppCache } from '@/lib/cache/redis';
import { NextRequest, NextResponse } from 'next/server';
import { getUserRepository } from '@/repositories';
import { USER_STATUSES } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const ActivateAccountSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères').optional(),
});

type ActivateAccountInput = z.infer<typeof ActivateAccountSchema>;

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const body = await request.json();
    const data: ActivateAccountInput = validateBody(body, ActivateAccountSchema);

    const { token, password } = data;

    // Vérifier le token JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env['JWT_SECRET']!);
    } catch (error) {
      logger.warn({ error }, 'Error verifying activation token');
      throw new ApiError(400, 'Token invalide ou expiré', 'INVALID_TOKEN');
    }

    if (decoded.type !== 'account_activation') {
      logger.warn({ type: decoded.type }, 'Invalid token type');
      throw new ApiError(400, 'Type de token invalide', 'INVALID_TOKEN_TYPE');
    }

    // Récupérer l'utilisateur
    const userRepository = getUserRepository();
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      logger.warn({ userId: decoded.userId }, 'User not found');
      throw new ApiError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND');
    }

    const hasPassword = Boolean((user as any)['password']);

    // Déjà activé
    if (user.status === USER_STATUSES.ACTIVE && hasPassword) {
      logger.info({ userId: user.id }, 'Account already activated');
      throw new ApiError(400, 'Ce compte est déjà activé', 'ALREADY_ACTIVATED');
    }

    // Un lien d'activation ne réactive jamais un compte suspendu ou désactivé
    if (user.status !== USER_STATUSES.PENDING && user.status !== USER_STATUSES.ACTIVE) {
      logger.warn({ userId: user.id, status: user.status }, 'Activation refused: account disabled');
      throw new ApiError(403, 'Ce compte est suspendu. Contactez le support.', 'ACCOUNT_DISABLED');
    }

    // Pas encore de mot de passe : il doit être défini maintenant
    if (!hasPassword && !password) {
      throw new ApiError(400, 'Choisissez un mot de passe pour activer votre compte', 'PASSWORD_REQUIRED');
    }

    // Le mot de passe choisi à l'inscription est conservé : on ne le remplace pas ici.
    await userRepository.update(user.id, {
      ...(!hasPassword && password && { password: await bcrypt.hash(password, 12) }),
      status: USER_STATUSES.ACTIVE,
      isEmailVerified: true,
      emailVerified: true,
    } as any);
    await invalidateAppCache('UserRepository'); // écriture hors cache : le vider

    logger.info({ userId: user.id, passwordSetNow: !hasPassword }, 'Account activated');

    return NextResponse.json({
      success: true,
      message: 'Compte activé avec succès. Vous pouvez maintenant vous connecter.',
    });
  }, 'api/auth/activate-account');
}
