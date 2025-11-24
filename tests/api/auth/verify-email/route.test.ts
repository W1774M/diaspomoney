/**
 * Tests unitaires pour /api/auth/verify-email
 * 
 * Implémente les tests pour :
 * - POST /api/auth/verify-email
 * - Validation du token JWT
 * - Vérification du type de token
 * - Recherche utilisateur
 * - Vérification si email déjà vérifié
 * - Mise à jour isEmailVerified
 * - Monitoring
 * - Gestion d'erreurs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/verify-email/route';
import { NextRequest } from 'next/server';

// Mock de dbConnect
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}));

// Mock de User model
vi.mock('@/models/User', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

// Mock de jwt
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
  },
}));

// Mock de monitoringManager
vi.mock('@/lib/monitoring/advanced-monitoring', () => ({
  monitoringManager: {
    recordMetric: vi.fn(),
  },
}));

describe('POST /api/auth/verify-email', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env['JWT_SECRET'] = 'test-secret';
  });

  it('devrait vérifier l\'email avec succès', async () => {
    const mockDecoded = {
      userId: 'user123',
      type: 'email_verification',
    };

    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      isEmailVerified: false,
    };

    const { default: User } = await import('@/models/User');
    const { default: jwt } = await import('jsonwebtoken');
    
    vi.mocked(jwt.verify).mockReturnValueOnce(mockDecoded as any);
    vi.mocked(User.findById).mockResolvedValueOnce(mockUser as any);
    vi.mocked(User.findByIdAndUpdate).mockResolvedValueOnce(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-jwt-token',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Email vérifié avec succès');
    expect(data.email).toBe('test@example.com');
    expect(vi.mocked(jwt.verify)).toHaveBeenCalledWith('valid-jwt-token', 'test-secret');
    expect(vi.mocked(User.findById)).toHaveBeenCalledWith('user123');
    expect(vi.mocked(User.findByIdAndUpdate)).toHaveBeenCalledWith('user123', {
      isEmailVerified: true,
      emailVerified: true,
    });
    const { monitoringManager } = await import('@/lib/monitoring/advanced-monitoring');
    expect(vi.mocked(monitoringManager.recordMetric)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'auth_email_verifications_successful',
        value: 1,
      }),
    );
  });

  it('devrait retourner 400 si le token est manquant', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token de vérification requis');
    const { default: jwt } = await import('jsonwebtoken');
    expect(vi.mocked(jwt.verify)).not.toHaveBeenCalled();
  });

  it('devrait retourner 400 si le token JWT est invalide', async () => {
    const { default: jwt } = await import('jsonwebtoken');
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid-jwt-token',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Token invalide ou expiré');
    expect(data.reason).toBe('expired');
  });

  it('devrait retourner 400 si le type de token est incorrect', async () => {
    const mockDecoded = {
      userId: 'user123',
      type: 'wrong_type',
    };

    const { default: User } = await import('@/models/User');
    const { default: jwt } = await import('jsonwebtoken');
    
    vi.mocked(jwt.verify).mockReturnValueOnce(mockDecoded as any);

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-jwt-token',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Type de token invalide');
    expect(vi.mocked(User.findById)).not.toHaveBeenCalled();
  });

  it('devrait retourner 404 si l\'utilisateur n\'existe pas', async () => {
    const mockDecoded = {
      userId: 'nonexistent-user',
      type: 'email_verification',
    };

    const { default: User } = await import('@/models/User');
    const { default: jwt } = await import('jsonwebtoken');
    
    vi.mocked(jwt.verify).mockReturnValueOnce(mockDecoded as any);
    vi.mocked(User.findById).mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-jwt-token',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Utilisateur non trouvé');
  });

  it('devrait retourner 200 si l\'email est déjà vérifié', async () => {
    const mockDecoded = {
      userId: 'user123',
      type: 'email_verification',
    };

    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      isEmailVerified: true,
    };

    const { default: User } = await import('@/models/User');
    const { default: jwt } = await import('jsonwebtoken');
    
    vi.mocked(jwt.verify).mockReturnValueOnce(mockDecoded as any);
    vi.mocked(User.findById).mockResolvedValueOnce(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-jwt-token',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Email déjà vérifié');
    expect(data.email).toBe('test@example.com');
    expect(vi.mocked(User.findByIdAndUpdate)).not.toHaveBeenCalled();
  });

  it('devrait appeler dbConnect avant de traiter', async () => {
    const mockDecoded = {
      userId: 'user123',
      type: 'email_verification',
    };

    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      isEmailVerified: false,
    };

    const { default: User } = await import('@/models/User');
    const { default: jwt } = await import('jsonwebtoken');
    
    vi.mocked(jwt.verify).mockReturnValueOnce(mockDecoded as any);
    vi.mocked(User.findById).mockResolvedValueOnce(mockUser as any);
    vi.mocked(User.findByIdAndUpdate).mockResolvedValueOnce(mockUser as any);

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-jwt-token',
      }),
    });

    await POST(request);

    const dbConnect = (await import('@/lib/mongodb')).default;
    expect(dbConnect).toHaveBeenCalled();
  });

  it('devrait enregistrer une métrique d\'échec en cas d\'erreur', async () => {
    const { default: jwt } = await import('jsonwebtoken');
    vi.mocked(jwt.verify).mockImplementationOnce(() => {
      throw new Error('Unexpected error');
    });

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid-token',
      }),
    });

    await POST(request);

    const { monitoringManager } = await import('@/lib/monitoring/advanced-monitoring');
    expect(vi.mocked(monitoringManager.recordMetric)).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'auth_email_verifications_failed',
        value: 1,
      }),
    );
  });

  it('devrait gérer les erreurs génériques', async () => {
    const { default: User } = await import('@/models/User');
    const { default: jwt } = await import('jsonwebtoken');
    
    // Simuler une erreur lors de la mise à jour de l'utilisateur
    vi.mocked(jwt.verify).mockReturnValueOnce({
      userId: 'user123',
      type: 'email_verification',
    } as any);
    vi.mocked(User.findById).mockResolvedValueOnce({
      _id: 'user123',
      email: 'test@example.com',
      isEmailVerified: false,
    } as any);
    vi.mocked(User.findByIdAndUpdate).mockRejectedValueOnce(new Error('Database connection error'));

    const request = new NextRequest('http://localhost:3000/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'valid-jwt-token',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBeDefined();
  });
});

