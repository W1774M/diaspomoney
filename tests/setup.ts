/**
 * Configuration globale pour les tests
 * Ce fichier est exécuté avant chaque test
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// S'assurer que document.body existe pour les tests React
if (typeof document !== 'undefined') {
  if (!document.body) {
    const body = document.createElement('body');
    if (document.documentElement) {
      document.documentElement.appendChild(body);
    } else {
      // Créer un document minimal si nécessaire
      const html = document.createElement('html');
      html.appendChild(body);
      Object.defineProperty(document, 'documentElement', {
        value: html,
        writable: false,
        configurable: false,
      });
    }
  }
  // S'assurer qu'il y a un élément racine pour React
  if (!document.getElementById('root')) {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
  }
}

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});

// Mock des variables d'environnement
(process.env as any).NODE_ENV = 'test';
// En tests, on force la DB de test (Mongo réel via Docker sur localhost:27018)
// Important: ne pas hériter de MONGO_HOST=mongodb (hostname Docker) qui casse hors réseau Docker.
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

// Extend Vitest's expect with jest-dom matchers
expect.extend({
  // Add custom matchers here if needed
});

