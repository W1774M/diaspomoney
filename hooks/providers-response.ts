/**
 * Lecture de la réponse de GET /api/providers.
 *
 * L'API renvoie le format paginé commun (`createPaginatedResponse`) :
 * `{ success, data: Provider[], pagination: { total, … } }`.
 * Les hooks lisaient `data.providers` / `data.total`, qui n'existent pas :
 * le tableau de bord affichait « 0 prestataires » alors que l'API en renvoyait.
 * L'ancien format reste accepté pour ne rien casser.
 */
export interface ParsedProvidersResponse<T> {
  providers: T[];
  total: number;
}

export function parseProvidersResponse<T>(body: unknown): ParsedProvidersResponse<T> {
  if (!body || typeof body !== 'object') {
    return { providers: [], total: 0 };
  }
  const raw = body as {
    data?: unknown;
    providers?: unknown;
    total?: unknown;
    pagination?: { total?: unknown };
  };

  const providers = (
    Array.isArray(raw.data)
      ? raw.data
      : Array.isArray(raw.providers)
        ? raw.providers
        : []
  ) as T[];

  const totalCandidate =
    typeof raw.pagination?.total === 'number'
      ? raw.pagination.total
      : typeof raw.total === 'number'
        ? raw.total
        : providers.length;

  return { providers, total: totalCandidate };
}
