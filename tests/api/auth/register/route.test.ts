/**
 * Tests unitaires pour /api/auth/register
 * 
 * Implémente les tests pour :
 * - POST /api/auth/register
 * - Validation avec RegisterSchema
 * - Utilisation de authService.register
 * - Sanitisation des données
 * - Gestion d'erreurs
 * - Monitoring
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { NextRequest } from 'next/server';

// Mock de authService
vi.mock('@/services/auth/auth.service', () => ({
  authService: {
    register: vi.fn(),
  },
}));

// Mock de handleApiRoute
vi.mock('@/lib/api/error-handler', () => ({
  handleApiRoute: vi.fn(async (_request, handler) => {
    try {
      const result = await handler();
      // Si le résultat a déjà une méthode json(), le retourner tel quel
      if (result && typeof result === 'object' && 'json' in result) {
        return result;
      }
      // Sinon, envelopper dans un objet avec json()
      return {
        json: async () => result,
        status: 200,
      };
    } catch (error: any) {
      // Gérer les erreurs ApiError
      if (error.status || error.statusCode) {
        return {
          json: async () => ({ error: error.message || 'Erreur', success: false }),
          status: error.status || error.statusCode,
        };
      }
      // Autres erreurs (Error standard)
      return {
        json: async () => ({ error: error.message || 'Erreur interne du serveur', success: false }),
        status: 500,
      };
    }
  }),
  validateBody: vi.fn((body) => body),
}));

// Mock de childLogger
vi.mock('@/lib/logger', () => ({
  childLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock de monitoringManager
vi.mock('@/lib/monitoring/advanced-monitoring', () => ({
  monitoringManager: {
    recordMetric: vi.fn(),
  },
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait créer un compte utilisateur avec succès', async () => {
    const mockUser = {
      id: 'user123',
      email: 'test@example.com',
      role: 'CUSTOMER',
      isVerified: false,
      kycStatus: 'PENDING',
    };

    const mockAuthResponse = {
      user: mockUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
    };

    const { authService } = await import('@/services/auth/auth.service');
    vi.mocked(authService.register).mockResolvedValueOnce(mockAuthResponse);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1',
        'user-agent': 'Mozilla/5.0',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        targetCountry: 'CA',
        targetCity: 'Montreal',
        securityQuestion: 'What is your favorite color?',
        securityAnswer: 'Blue',
        termsAccepted: true,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.user).toEqual(mockUser);
    expect(data.accessToken).toBe('access-token');
    expect(data.refreshToken).toBe('refresh-token');
    expect(vi.mocked(authService.register)).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        country: 'FR',
      }),
      expect.objectContaining({
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      }),
    );
    const { monitoringManager } = await import('@/lib/monitoring/advanced-monitoring');
    expect(vi.mocked(monitoringManager.recordMetric)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'auth_registrations_successful',
        value: 1,
      }),
    );
  });

  it('devrait sanitiser les données (email en minuscules, trim)', async () => {
    const mockAuthResponse = {
      user: { 
        id: 'user123', 
        email: 'test@example.com',
        role: 'CUSTOMER',
        isVerified: false,
        kycStatus: 'PENDING',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 3600,
    };

    const { authService } = await import('@/services/auth/auth.service');
    vi.mocked(authService.register).mockResolvedValueOnce(mockAuthResponse);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Password123!',
        firstName: '  John  ',
        lastName: '  Doe  ',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
        termsAccepted: true,
      }),
    });

    await POST(request);

    expect(vi.mocked(authService.register)).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      }),
      expect.any(Object),
    );
  });

  it('devrait valider le body avec RegisterSchema', async () => {
    const { validateBody } = await import('@/lib/api/error-handler');
    const mockAuthResponse = {
      user: { 
        id: 'user123',
        email: 'test@example.com',
        role: 'CUSTOMER',
        isVerified: false,
        kycStatus: 'PENDING',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 3600,
    };

    const { authService } = await import('@/services/auth/auth.service');
    vi.mocked(authService.register).mockResolvedValueOnce(mockAuthResponse);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
        termsAccepted: true,
      }),
    });

    await POST(request);

    expect(validateBody).toHaveBeenCalled();
  });

  it('devrait gérer les erreurs du service', async () => {
    const { authService } = await import('@/services/auth/auth.service');
    vi.mocked(authService.register).mockRejectedValueOnce(new Error('Email déjà utilisé'));

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
        termsAccepted: true,
      }),
    });

    // handleApiRoute devrait retourner une réponse HTTP avec erreur
    const response = await POST(request);
    const data = await response.json();

    expect([400, 500]).toContain(response.status);
    expect(data.success).toBe(false);
  });

  it('devrait extraire IP depuis x-forwarded-for', async () => {
    const mockAuthResponse = {
      user: { 
        id: 'user123',
        email: 'test@example.com',
        role: 'CUSTOMER',
        isVerified: false,
        kycStatus: 'PENDING',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 3600,
    };

    const { authService } = await import('@/services/auth/auth.service');
    vi.mocked(authService.register).mockResolvedValueOnce(mockAuthResponse);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1, 10.0.0.1',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
        termsAccepted: true,
      }),
    });

    await POST(request);

    expect(vi.mocked(authService.register)).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        ipAddress: '192.168.1.1',
      }),
    );
  });

  it('devrait utiliser x-real-ip si x-forwarded-for est absent', async () => {
    const mockAuthResponse = {
      user: { 
        id: 'user123',
        email: 'test@example.com',
        role: 'CUSTOMER',
        isVerified: false,
        kycStatus: 'PENDING',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 3600,
    };

    const { authService } = await import('@/services/auth/auth.service');
    vi.mocked(authService.register).mockResolvedValueOnce(mockAuthResponse);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': '10.0.0.1',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
        termsAccepted: true,
      }),
    });

    await POST(request);

    expect(vi.mocked(authService.register)).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        ipAddress: '10.0.0.1',
      }),
    );
  });

  it('devrait utiliser "unknown" si aucune IP n\'est disponible', async () => {
    const mockAuthResponse = {
      user: { 
        id: 'user123',
        email: 'test@example.com',
        role: 'CUSTOMER',
        isVerified: false,
        kycStatus: 'PENDING',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 3600,
    };

    const { authService } = await import('@/services/auth/auth.service');
    vi.mocked(authService.register).mockResolvedValueOnce(mockAuthResponse);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
        termsAccepted: true,
      }),
    });

    await POST(request);

    expect(vi.mocked(authService.register)).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        ipAddress: 'unknown',
      }),
    );
  });

  it('devrait gérer marketingConsent par défaut à false', async () => {
    const mockAuthResponse = {
      user: { 
        id: 'user123',
        email: 'test@example.com',
        role: 'CUSTOMER',
        isVerified: false,
        kycStatus: 'PENDING',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresIn: 3600,
    };

    const { authService } = await import('@/services/auth/auth.service');
    vi.mocked(authService.register).mockResolvedValueOnce(mockAuthResponse);

    const request = new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        countryOfResidence: 'FR',
        dateOfBirth: '1990-01-01',
        securityQuestion: 'Question?',
        securityAnswer: 'Answer',
        termsAccepted: true,
        // marketingConsent non fourni
      }),
    });

    await POST(request);

    expect(vi.mocked(authService.register)).toHaveBeenCalledWith(
      expect.objectContaining({
        marketingConsent: false,
      }),
      expect.any(Object),
    );
  });
});

