import type { Document, WithId } from 'mongodb';

/**
 * Résultat de findOneAndUpdate / findOneAndDelete / findOneAndReplace.
 *
 * Depuis le pilote MongoDB 6, ces méthodes renvoient directement le document (ou null).
 * Avant, elles renvoyaient { value, ok, lastErrorObject } : lire `.value` avec un pilote
 * récent donne toujours undefined, et l'appelant croit que le document n'existe pas.
 * Accepte les deux formats.
 */
export function unwrapFindOne<T extends Document = Document>(result: unknown): WithId<T> | null {
  if (!result || typeof result !== 'object') return null;
  const legacy = result as { value?: unknown; ok?: unknown; lastErrorObject?: unknown };
  if ('lastErrorObject' in legacy || ('ok' in legacy && 'value' in legacy)) {
    return (legacy.value as WithId<T> | null | undefined) ?? null;
  }
  return result as WithId<T>;
}
