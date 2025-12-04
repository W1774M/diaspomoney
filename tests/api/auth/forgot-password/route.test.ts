/**
 * Tests unitaires pour /api/auth/forgot-password
 * 
 * Implémente les tests pour :
 * - POST /api/auth/forgot-password
 * - Validation avec ForgotPasswordSchema
 * - Utilisation de userService
 * - Génération de token de réinitialisation
 * - Envoi d'email (si RESEND_API_KEY configuré)
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/forgot-password/route';
import { NextRequest } from 'next/server';

// Mock de userService
vi.mock('@/services/user/user.service', () => ({
  userService: {
    getUserProfile: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}));

// Mock de requestPasswordReset
vi.mock('@/services/auth/auth.service', () => ({
  requestPasswordReset: vi.fn(),
}));

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: vi.fn((_request, handler) => handler()),
  validateBody: vi.fn((body) => body),
}));

// Mock de logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock de crypto
vi.mock('crypto', () => ({
  randomBytes: vi.fn(() => ({
    toString: vi.fn(() => 'random-token-hex'),
  })),
}));

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env
    delete process.env['RESEND_API_KEY'];
  });

  it('devrait générer un token de réinitialisation avec succès', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const { userService } = await import('@/services/user/user.service');
    vi.mocked(userService.getUserProfile).mockResolvedValueOnce(mockUser);
    vi.mocked(userService.updateUserProfile).mockResolvedValueOnce(mockUser);

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Si cet email existe, vous recevrez un lien de récupération');
    expect(vi.mocked(userService.getUserProfile)).toHaveBeenCalledWith('test@example.com');
    expect(vi.mocked(userService.updateUserProfile)).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        passwordResetToken: 'random-token-hex',
        passwordResetExpires: expect.any(Date),
      }),
    );
  });

  it('devrait convertir l\'email en minuscules', async () => {
    const mockUser = {
      id: 'user123',
      email: 'TEST@EXAMPLE.COM',
      firstName: 'John',
      lastName: 'Doe',
    };

    const { userService } = await import('@/services/user/user.service');
    vi.mocked(userService.getUserProfile).mockResolvedValueOnce(mockUser);
    vi.mocked(userService.updateUserProfile).mockResolvedValueOnce(mockUser);

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'TEST@EXAMPLE.COM',
      }),
    });

    await POST(request);

    expect(vi.mocked(userService.getUserProfile)).toHaveBeenCalledWith('test@example.com');
  });

  it('devrait envoyer un email si RESEND_API_KEY est configuré', async () => {
    process.env['RESEND_API_KEY'] = 'test-key';

    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const { userService } = await import('@/services/user/user.service');
    const { requestPasswordReset } = await import('@/services/auth/auth.service');
    
    vi.mocked(userService.getUserProfile).mockResolvedValueOnce(mockUser);
    vi.mocked(userService.updateUserProfile).mockResolvedValueOnce(mockUser);
    vi.mocked(requestPasswordReset).mockResolvedValueOnce(true);

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    await POST(request);

    expect(vi.mocked(requestPasswordReset)).toHaveBeenCalledWith('test@example.com');
  });

  it('ne devrait pas envoyer d\'email si RESEND_API_KEY n\'est pas configuré', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const { userService } = await import('@/services/user/user.service');
    vi.mocked(userService.getUserProfile).mockResolvedValueOnce(mockUser);
    vi.mocked(userService.updateUserProfile).mockResolvedValueOnce(mockUser);

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    await POST(request);

    const { requestPasswordReset } = await import('@/services/auth/auth.service');
    expect(vi.mocked(requestPasswordReset)).not.toHaveBeenCalled();
  });

  it('devrait retourner un succès même si l\'utilisateur n\'existe pas (sécurité)', async () => {
    const { userService } = await import('@/services/user/user.service');
    vi.mocked(userService.getUserProfile).mockRejectedValueOnce(new Error('User not found'));

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    // Pour des raisons de sécurité, on retourne toujours un succès
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Si cet email existe, vous recevrez un lien de récupération');
  });

  it('devrait valider le body avec ForgotPasswordSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const { userService } = await import('@/services/user/user.service');
    vi.mocked(userService.getUserProfile).mockResolvedValueOnce(mockUser);
    vi.mocked(userService.updateUserProfile).mockResolvedValueOnce(mockUser);

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    await POST(request);

    expect(validateBody).toHaveBeenCalled();
  });

  it('devrait générer un token avec expiration de 1 heure', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const { userService } = await import('@/services/user/user.service');
    vi.mocked(userService.getUserProfile).mockResolvedValueOnce(mockUser);
    vi.mocked(userService.updateUserProfile).mockResolvedValueOnce(mockUser);

    const beforeTime = Date.now();
    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    await POST(request);
    const afterTime = Date.now();

    expect(vi.mocked(userService.updateUserProfile)).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        passwordResetExpires: expect.any(Date),
      }),
    );

    const expiresDate = (vi.mocked(userService.updateUserProfile).mock.calls[0]?.[1] as any)?.passwordResetExpires;
    const expiresTime = expiresDate.getTime();
    const expectedMinTime = beforeTime + 3600000; // 1 heure
    const expectedMaxTime = afterTime + 3600000;

    expect(expiresTime).toBeGreaterThanOrEqual(expectedMinTime);
    expect(expiresTime).toBeLessThanOrEqual(expectedMaxTime);
  });

  it('devrait retourner 503 pendant le build time', async () => {
    const originalPhase = process.env['NEXT_PHASE'];
    process.env['NEXT_PHASE'] = 'phase-production-build';

    const request = new NextRequest('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.message).toBe('Service temporarily unavailable');

    process.env['NEXT_PHASE'] = originalPhase;
  });
});

