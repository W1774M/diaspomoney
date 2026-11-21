/**
 * Client fetch JSON unifié pour les hooks UI.
 * Pas de logique domaine — parsing + erreurs HTTP uniquement.
 */

export class FetchJsonError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = 'FetchJsonError';
    this.status = status;
    this.body = body;
  }
}

export type FetchJsonOptions = RequestInit & {
  /** Si false, ne parse pas JSON sur 204 / body vide */
  parseJson?: boolean;
};

export async function fetchJson<T = unknown>(
  url: string,
  init?: FetchJsonOptions,
): Promise<T> {
  const { parseJson = true, headers, ...rest } = init || {};
  const response = await fetch(url, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  });

  let body: unknown = undefined;
  if (parseJson) {
    // Prefer text()+JSON.parse; fall back to .json() for test doubles
    if (typeof response.text === 'function') {
      const text = await response.text();
      if (text) {
        try {
          body = JSON.parse(text) as unknown;
        } catch {
          body = text;
        }
      }
    } else if (typeof response.json === 'function') {
      body = await response.json();
    }
  }

  if (!response.ok) {
    const message =
      (body &&
        typeof body === 'object' &&
        'error' in body &&
        typeof (body as { error: unknown }).error === 'string' &&
        (body as { error: string }).error) ||
      (body &&
        typeof body === 'object' &&
        'message' in body &&
        typeof (body as { message: unknown }).message === 'string' &&
        (body as { message: string }).message) ||
      `HTTP ${response.status}`;
    throw new FetchJsonError(message, response.status, body);
  }

  return (body === undefined ? ({} as T) : (body as T));
}
