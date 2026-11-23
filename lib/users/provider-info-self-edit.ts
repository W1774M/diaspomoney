/**
 * Mise à jour self-service de providerInfo (/api/users/me).
 * Les champs de confiance (vérification, note, recommandation) restent
 * sous contrôle admin et ne peuvent pas être écrasés par le prestataire.
 */

const LOCKED_PROVIDER_FIELDS = [
  'isVerified',
  'rating',
  'reviewCount',
  'recommended',
] as const;

export function mergeSelfServiceProviderInfo(
  existing: Record<string, unknown> | null | undefined,
  incoming: Record<string, unknown>,
): Record<string, unknown> {
  const current =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...existing }
      : {};

  const next: Record<string, unknown> = {
    ...current,
    ...incoming,
  };

  for (const key of LOCKED_PROVIDER_FIELDS) {
    if (key in current) {
      next[key] = current[key];
    } else {
      delete next[key];
    }
  }

  // Valeurs par défaut sûres si absentes côté compte
  if (!('isVerified' in next)) next['isVerified'] = false;
  if (!('rating' in next)) next['rating'] = 0;
  if (!('reviewCount' in next)) next['reviewCount'] = 0;

  return next;
}
