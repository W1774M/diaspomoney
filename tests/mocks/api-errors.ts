/**
 * Helpers communs pour les mocks de "@/lib/api/error-handler" dans Vitest.
 * Objectif: des erreurs typées avec status/statusCode pour que handleApiRoute mocké
 * retourne les bons codes (401/403/404/400) au lieu de 500.
 */

export class ApiError extends Error {
  status: number;
  statusCode: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusCode = status;
  }
}

function make(status: number, message: string) {
  return new ApiError(status, message) as any;
}

export const ApiErrors = {
  UNAUTHORIZED: make(401, 'Non autorisé'),
  FORBIDDEN: make(403, 'Accès non autorisé'),
  NOT_FOUND: make(404, 'Ressource non trouvée'),
  VALIDATION_ERROR: (msg: string) => make(400, msg || 'Erreur de validation'),
};


