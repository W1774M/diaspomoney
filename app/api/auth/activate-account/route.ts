/**
 * API Route - Activate Account
 * Endpoint pour activer un compte et définir le mot de passe
 */

import { handleApiRoute, validateBody, ApiError } from '@/lib/api/error-handler';
import { NextRequest, NextResponse } from 'next/server';
import { getUserRepository } from '@/repositories';
import { USER_STATUSES } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const ActivateAccountSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
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
      throw new ApiError(400, 'Token invalide ou expiré', 'INVALID_TOKEN');
    }

    if (decoded.type !== 'account_activation') {
      throw new ApiError(400, 'Type de token invalide', 'INVALID_TOKEN_TYPE');
    }

    // Récupérer l'utilisateur
    const userRepository = getUserRepository();
    const user = await userRepository.findById(decoded.userId);

    if (!user) {
      throw new ApiError(404, 'Utilisateur non trouvé', 'USER_NOT_FOUND');
    }

    // Vérifier que le compte n'est pas déjà activé
    if (user.status === USER_STATUSES.ACTIVE && (user as any)['password']) {
      throw new ApiError(400, 'Ce compte est déjà activé', 'ALREADY_ACTIVATED');
    }

    // Hacher le mot de passe
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Activer le compte : définir le mot de passe et changer le statut
    await userRepository.update(decoded.userId, {
      password: hashedPassword,
      status: USER_STATUSES.ACTIVE,
      isEmailVerified: true,
      emailVerified: true,
    } as any);

    return NextResponse.json({
      success: true,
      message: 'Compte activé avec succès. Vous pouvez maintenant vous connecter.',
    });
  }, 'api/auth/activate-account');
}

