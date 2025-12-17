/**
 * Configuration pour les tests d'intégration
 * Ce fichier est exécuté avant chaque test d'intégration
 */

import { beforeAll, afterAll } from 'vitest';

// Configuration des variables d'environnement pour les tests d'intégration
(process.env as any).NODE_ENV = 'test';
process.env['MONGODB_URI'] = process.env['MONGODB_URI'] || 'mongodb://217.154.22.202:27017/diaspomoney_test';
process.env['REDIS_URL'] = process.env['REDIS_URL'] || 'redis://localhost:6379';
process.env.NEXTAUTH_SECRET = process.env['NEXTAUTH_SECRET'] || 'test-secret-key-for-testing-only';
process.env.NEXTAUTH_URL = process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';

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

