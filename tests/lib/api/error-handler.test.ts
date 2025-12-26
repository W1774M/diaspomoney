import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import {
  handleApiRoute,
  ApiError,
  ApiErrors,
  validateBody,
  validateQuery,
} from '@/lib/api/error-handler';
import * as Sentry from '@sentry/nextjs';
import { z } from 'zod';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  childLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

describe('lib/api/error-handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ApiError', () => {
    it('devrait créer une ApiError avec tous les paramètres', () => {
      const error = new ApiError(404, 'Not found', 'NOT_FOUND', { id: '123' });
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.details).toEqual({ id: '123' });
      expect(error.name).toBe('ApiError');
      expect(error).toBeInstanceOf(Error);
    });

    it('devrait créer une ApiError sans code ni details', () => {
      const error = new ApiError(500, 'Internal error');
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal error');
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });

  describe('ApiErrors', () => {
    it('devrait avoir les erreurs prédéfinies', () => {
      expect(ApiErrors.UNAUTHORIZED.statusCode).toBe(401);
      expect(ApiErrors.FORBIDDEN.statusCode).toBe(403);
      expect(ApiErrors.NOT_FOUND.statusCode).toBe(404);
      expect(ApiErrors.INTERNAL_ERROR.statusCode).toBe(500);
    });

    it('devrait créer une VALIDATION_ERROR avec details', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const error = ApiErrors.VALIDATION_ERROR(details);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual(details);
    });

    it('devrait créer une VALIDATION_ERROR sans details', () => {
      const error = ApiErrors.VALIDATION_ERROR();
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toBeUndefined();
    });
  });

  describe('handleApiRoute', () => {
    it('devrait retourner le résultat du handler en JSON si ce n\'est pas une NextResponse', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const handler = async () => ({ success: true, data: 'test' });

      const res = await handleApiRoute(req, handler, 'api/test');
      expect(res.status).toBe(200);

      const payload = await res.json();
      expect(payload).toEqual({ success: true, data: 'test' });
    });

    it('devrait retourner une NextResponse telle quelle si le handler en retourne une', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const customResponse = NextResponse.json({ custom: true }, { status: 201 });
      const handler = async () => customResponse;

      const res = await handleApiRoute(req, handler, 'api/test');
      expect(res).toBe(customResponse);
      expect(res.status).toBe(201);

      const payload = await res.json();
      expect(payload).toEqual({ custom: true });
    });

    it('devrait gérer une ApiError et retourner le bon statut', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-request-id': 'test-req-id' },
      });
      const handler = async () => {
        throw new ApiError(404, 'Ressource non trouvée', 'NOT_FOUND', { id: '123' });
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      expect(res.status).toBe(404);

      const payload = await res.json();
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('Ressource non trouvée');
      expect(payload.code).toBe('NOT_FOUND');
      expect(payload.details).toEqual({ id: '123' });
      expect(payload.requestId).toBe('test-req-id');
    });

    it('devrait gérer une ApiError sans details', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const handler = async () => {
        throw new ApiError(401, 'Non autorisé', 'UNAUTHORIZED');
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      expect(res.status).toBe(401);

      const payload = await res.json();
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('Non autorisé');
      expect(payload.code).toBe('UNAUTHORIZED');
      expect(payload.details).toBeUndefined();
    });

    it('devrait gérer une ApiError avec details non-objet', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const handler = async () => {
        throw new ApiError(400, 'Erreur', 'ERROR', 'string details');
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      const payload = await res.json();
      expect(payload.details).toBeUndefined(); // Seuls les objets sont inclus
    });

    it('devrait préserver un statusCode custom (ex: 429) au lieu de renvoyer 500', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-request-id': 'test-req-id' },
      });

      const handler = async () => {
        const err: any = new Error('Trop de requêtes, veuillez réessayer plus tard');
        err.statusCode = 429;
        err.remaining = 0;
        err.resetTime = Date.now() + 60_000;
        throw err;
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      expect(res.status).toBe(429);

      const payload = await res.json();
      expect(payload.success).toBe(false);
      expect(payload.error).toContain('Trop de requêtes');
      expect(payload.requestId).toBe('test-req-id');
      expect(payload.details).toBeDefined();
      expect(payload.details.remaining).toBe(0);
    });

    it('devrait gérer un statusCode custom avec retryAfterSeconds', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const resetTime = Date.now() + 120_000; // 2 minutes
      const handler = async () => {
        const err: any = new Error('Rate limit');
        err.statusCode = 429;
        err.resetTime = resetTime;
        throw err;
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeDefined();
    });

    it('devrait ignorer un statusCode hors de la plage 400-599', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const handler = async () => {
        const err: any = new Error('Invalid status');
        err.statusCode = 200; // Hors plage
        throw err;
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      expect(res.status).toBe(500); // Devrait retourner 500 pour erreur inattendue
      expect(Sentry.captureException).toHaveBeenCalled();
    });

    it('devrait gérer une erreur Zod de validation', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-request-id': 'test-req-id' },
      });
      const handler = async () => {
        const zodError = {
          issues: [
            { path: ['email'], message: 'Invalid email' },
            { path: ['age'], message: 'Must be a number' },
          ],
        };
        throw zodError;
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      expect(res.status).toBe(400);

      const payload = await res.json();
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('Erreur de validation');
      expect(payload.code).toBe('VALIDATION_ERROR');
      expect(payload.details).toEqual([
        { path: 'email', message: 'Invalid email' },
        { path: 'age', message: 'Must be a number' },
      ]);
      expect(payload.requestId).toBe('test-req-id');
    });

    it('devrait gérer une erreur Zod avec path vide', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const handler = async () => {
        throw {
          issues: [{ path: [], message: 'Root level error' }],
        };
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      const payload = await res.json();
      expect(payload.details).toEqual([{ path: '', message: 'Root level error' }]);
    });

    it('devrait gérer une erreur inattendue et appeler Sentry', async () => {
      const req = new NextRequest('http://localhost:3000/api/test', {
        headers: { 'x-request-id': 'test-req-id' },
      });
      const handler = async () => {
        throw new Error('Unexpected error');
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      expect(res.status).toBe(500);

      const payload = await res.json();
      expect(payload.success).toBe(false);
      expect(payload.error).toBe('Erreur interne du serveur');
      expect(payload.code).toBe('INTERNAL_ERROR');
      expect(payload.requestId).toBe('test-req-id');

      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: { component: 'API', route: 'api/test' },
          extra: { requestId: 'test-req-id' },
        }),
      );
    });

    it('devrait gérer une erreur inattendue sans requestId', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const handler = async () => {
        throw new Error('Unexpected error');
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      const payload = await res.json();
      expect(payload.requestId).toBeUndefined();
    });

    it('devrait gérer un statusCode custom avec code et remaining', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const handler = async () => {
        const err: any = new Error('Rate limit exceeded');
        err.statusCode = 429;
        err.code = 'RATE_LIMIT_EXCEEDED';
        err.remaining = 5;
        throw err;
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      const payload = await res.json();
      expect(payload.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(payload.details.remaining).toBe(5);
    });

    it('devrait gérer un statusCode custom avec message non-string', async () => {
      const req = new NextRequest('http://localhost:3000/api/test');
      const handler = async () => {
        const err: any = new Error();
        err.statusCode = 400;
        err.message = null; // Message non-string
        throw err;
      };

      const res = await handleApiRoute(req, handler, 'api/test');
      const payload = await res.json();
      expect(payload.error).toBe('Erreur');
    });
  });

  describe('validateBody', () => {
    it('devrait valider un body avec un schéma Zod valide', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number(),
      });
      const body = { email: 'test@example.com', age: 25 };

      const result = validateBody(body, schema);
      expect(result).toEqual(body);
    });

    it('devrait lancer une ApiError si la validation échoue', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number(),
      });
      const body = { email: 'invalid-email', age: 'not-a-number' };

      expect(() => validateBody(body, schema)).toThrow(ApiError);
      try {
        validateBody(body, schema);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(400);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('devrait lancer une ApiError avec les détails de validation', () => {
      const schema = z.object({
        email: z.string().email(),
      });
      const body = { email: 'invalid' };

      try {
        validateBody(body, schema);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).details).toBeDefined();
      }
    });
  });

  describe('validateQuery', () => {
    it('devrait valider des query params avec un schéma Zod valide', () => {
      const schema = z.object({
        page: z.string().transform(Number),
        limit: z.string().transform(Number),
      });
      const searchParams = new URLSearchParams('page=1&limit=10');

      const result = validateQuery(searchParams, schema);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('devrait convertir URLSearchParams en objet', () => {
      const schema = z.object({
        search: z.string(),
        filter: z.string().optional(),
      });
      const searchParams = new URLSearchParams('search=test&filter=active');

      const result = validateQuery(searchParams, schema);
      expect(result.search).toBe('test');
      expect(result.filter).toBe('active');
    });

    it('devrait lancer une ApiError si la validation échoue', () => {
      const schema = z.object({
        page: z.string().regex(/^\d+$/),
      });
      const searchParams = new URLSearchParams('page=invalid');

      expect(() => validateQuery(searchParams, schema)).toThrow(ApiError);
      try {
        validateQuery(searchParams, schema);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(400);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
      }
    });

    it('devrait gérer des query params vides', () => {
      const schema = z.object({});
      const searchParams = new URLSearchParams();

      const result = validateQuery(searchParams, schema);
      expect(result).toEqual({});
    });

    it('devrait gérer des query params avec valeurs multiples', () => {
      const schema = z.object({
        tags: z.string(),
      });
      const searchParams = new URLSearchParams('tags=tag1&tags=tag2');

      const result = validateQuery(searchParams, schema);
      // URLSearchParams.get() retourne la dernière valeur pour les clés dupliquées
      expect(result.tags).toBe('tag2');
    });
  });
});


