/**
 * Prestataire d'une réservation.
 *
 * `providerId` ne désigne un prestataire que s'il est l'identifiant (ObjectId) d'un utilisateur.
 * Vide : non attribuée. Les anciennes réservations de l'assistant de services contiennent un
 * identifiant de service (« consultation-medical », voir #102) et les brouillons d'admin le
 * marqueur « admin-draft » : ce ne sont pas des prestataires.
 */
export const PROVIDER_USER_ID_PATTERN = /^[a-f\d]{24}$/i;

export function isProviderUserId(value: unknown): value is string {
  return typeof value === 'string' && PROVIDER_USER_ID_PATTERN.test(value);
}
