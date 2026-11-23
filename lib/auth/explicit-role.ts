/**
 * Rôle explicite d'un utilisateur.
 *
 * useAuthorization considère qu'un ADMIN / SUPERADMIN a tous les rôles (accès
 * à tout). Certaines fonctions sont pourtant propres à un rôle et à ses
 * données : le portefeuille d'un CSM (csmPortfolioProviderIds), dont l'API
 * exige le rôle CSM. Pour celles-là, il faut le rôle porté par le compte.
 */
export function hasExplicitRole(
  user: { roles?: ReadonlyArray<string | null | undefined> | null } | null | undefined,
  role: string,
): boolean {
  const roles = user?.roles;
  if (!Array.isArray(roles)) return false;
  const wanted = role.toUpperCase();
  return roles.some(r => typeof r === 'string' && r.toUpperCase() === wanted);
}
