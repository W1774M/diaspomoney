/**
 * Configuration globale pour les tests
 * Ce fichier est exécuté avant chaque test
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// S'assurer que document.body existe pour les tests
if (typeof document !== 'undefined' && !document.body) {
  const body = document.createElement('body');
  document.appendChild(body);
}

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});

// Mock des variables d'environnement
(process.env as any).NODE_ENV = 'test';
process.env['MONGODB_URI'] = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/diaspomoney_test';
process.env['REDIS_URL'] = process.env['REDIS_URL'] || 'redis://localhost:6379';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Mock de Next.js
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock de next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock de auth() pour éviter les erreurs "headers was called outside a request scope"
vi.mock('@/auth', () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

// Mock de Sentry
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// Mock de fetch global
global.fetch = vi.fn();

// Mock de la configuration de l'application pour éviter les erreurs dans les tests
vi.mock('@/config/app.config', () => ({
  config: {
    database: {
      uri: process.env['MONGODB_URI'] || 'mongodb://localhost:27017/diaspomoney_test',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      },
    },
  },
}));

// Extend Vitest's expect with jest-dom matchers
expect.extend({
  // Add custom matchers here if needed
});

