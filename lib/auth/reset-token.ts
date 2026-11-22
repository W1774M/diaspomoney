import { createHash } from 'crypto';

/**
 * Empreinte d'un jeton de réinitialisation du mot de passe.
 * Le jeton en clair ne vit que dans l'e-mail : la base n'en garde que l'empreinte,
 * pour qu'une fuite de la base ne permette pas de réinitialiser un compte.
 */
export function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
