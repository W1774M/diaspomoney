/**
 * Configuration pour les tests d'intégration
 * Ce fichier est exécuté avant chaque test d'intégration
 */

import { beforeAll, afterAll, vi } from 'vitest';

// Mock next/headers: certains decorators (RateLimit) l'utilisent, mais les tests
// appellent les handlers directement (sans request scope Next.js).
vi.mock('next/headers', () => {
  return {
    headers: () => new Headers(),
    cookies: () => ({
      get: () => undefined,
      getAll: () => [],
      has: () => false,
      set: () => undefined,
      delete: () => undefined,
    }),
  };
});

// Mock de auth() global pour les tests d'intégration.
// Important: les decorators (@Audit) l'appellent même hors route, et NextAuth utilise next/headers.
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// Configuration des variables d'environnement pour les tests d'intégration
(process.env as any).NODE_ENV = 'test';
// Forcer l'URI de test (évite MONGO_HOST=mongodb venant de l'env)
process.env['MONGO_HOST'] = '127.0.0.1';
process.env['MONGODB_HOST'] = '127.0.0.1';
process.env['MONGODB_URI'] = 'mongodb://127.0.0.1:27018/diaspomoney_test';
process.env['MONGODB_DB'] = process.env['MONGODB_DB'] || 'diaspomoney_test';
process.env['REDIS_URL'] = process.env['REDIS_URL'] || 'redis://localhost:6379';
process.env.NEXTAUTH_SECRET = process.env['NEXTAUTH_SECRET'] || 'test-secret-key-for-testing-only';
process.env['JWT_SECRET'] = process.env['JWT_SECRET'] || 'test-jwt-secret-key-for-testing-only';
process.env['NEXT_PUBLIC_APP_URL'] = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';
process.env['NEXT_PUBLIC_API_URL'] = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:3000/api';
process.env.NEXTAUTH_URL = process.env['NEXT_PUBLIC_APP_URL'];

// Setup avant tous les tests d'intégration
beforeAll(async () => {
  // Ici vous pouvez initialiser une base de données de test, etc.
  console.log('Setup des tests d\'intégration...');
});

// Cleanup après tous les tests d'intégration
afterAll(async () => {
  // Ici vous pouvez nettoyer la base de données de test, etc.
  console.log('Cleanup des tests d\'intégration...');
});

