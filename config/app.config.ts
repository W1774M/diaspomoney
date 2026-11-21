/**
 * Configuration centralisée - DiaspoMoney
 * Utilise les constantes et types centralisés
 */

import type { EnvironmentConfig } from '@/lib/types';
import { API, DATABASE } from '@/lib/constants';

// === CONFIGURATION PAR ENVIRONNEMENT ===
const environments: Record<'development' | 'recette' | 'production', EnvironmentConfig> = {
  development: {
    nodeEnv: 'development' as any,
    appUrl: 'https://dev.diaspomoney.fr',
    apiUrl: 'https://dev.diaspomoney.fr/api',
    database: {
      uri:
        process.env['MONGODB_URI'] ||
        'mongodb://217.154.22.202:27017/diaspomoney-dev',
      options: {
        maxPoolSize: DATABASE.POOL_SIZE.DEFAULT,
        serverSelectionTimeoutMS: API.TIMEOUT.DATABASE,
        socketTimeoutMS: DATABASE.SOCKET_TIMEOUT,
        connectTimeoutMS: API.TIMEOUT.DATABASE,
      },
    },
    redis: {
      url: process.env['REDIS_URL'] || 'redis://localhost:6379',
      options: {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      },
    },
    email: {
      apiKey: process.env['RESEND_API_KEY'] || '',
      from: 'DiaspoMoney <noreply@dev.diaspomoney.fr>',
      replyTo: 'support@dev.diaspomoney.fr',
    },
    security: {
      jwtSecret: process.env['JWT_SECRET'] || 'dev-jwt-secret',
      encryptionKey: process.env['ENCRYPTION_KEY'] || 'dev-encryption-key',
      sessionSecret: process.env['SESSION_SECRET'] || 'dev-session-secret',
    },
  },
  recette: {
    nodeEnv: 'recette' as any,
    appUrl: 'https://rct.diaspomoney.fr',
    apiUrl: 'https://rct.diaspomoney.fr/api',
    database: {
      uri:
        process.env['MONGODB_URI'] ||
        'mongodb://217.154.22.202:27017/diaspomoney-rct',
      options: {
        maxPoolSize: DATABASE.POOL_SIZE.MEDIUM,
        serverSelectionTimeoutMS: API.TIMEOUT.DATABASE,
        socketTimeoutMS: DATABASE.SOCKET_TIMEOUT,
        connectTimeoutMS: API.TIMEOUT.DATABASE,
      },
    },
    redis: {
      url: process.env['REDIS_URL'] || 'redis://localhost:6379',
      options: {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      },
    },
    email: {
      apiKey: process.env['RESEND_API_KEY'] || '',
      from: 'DiaspoMoney <noreply@rct.diaspomoney.fr>',
      replyTo: 'support@rct.diaspomoney.fr',
    },
    security: {
      jwtSecret: process.env['JWT_SECRET'] || 'rct-jwt-secret',
      encryptionKey: process.env['ENCRYPTION_KEY'] || 'rct-encryption-key',
      sessionSecret: process.env['SESSION_SECRET'] || 'rct-session-secret',
    },
  },
  production: {
    nodeEnv: 'production' as any,
    appUrl: 'https://diaspomoney.fr',
    apiUrl: 'https://diaspomoney.fr/api',
    database: {
      uri:
        process.env['MONGODB_URI'] ||
        'mongodb://217.154.22.202:27017/diaspomoney',
      options: {
        maxPoolSize: DATABASE.POOL_SIZE.LARGE,
        serverSelectionTimeoutMS: API.TIMEOUT.DATABASE,
        socketTimeoutMS: DATABASE.SOCKET_TIMEOUT,
        connectTimeoutMS: API.TIMEOUT.DATABASE,
      },
    },
    redis: {
      url: process.env['REDIS_URL'] || 'redis://localhost:6379',
      options: {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      },
    },
    email: {
      apiKey: process.env['RESEND_API_KEY'] || '',
      from: 'DiaspoMoney <noreply@diaspomoney.fr>',
      replyTo: 'support@diaspomoney.fr',
    },
    security: {
      jwtSecret: process.env['JWT_SECRET'] || 'prod-jwt-secret',
      encryptionKey: process.env['ENCRYPTION_KEY'] || 'prod-encryption-key',
      sessionSecret: process.env['SESSION_SECRET'] || 'prod-session-secret',
    },
  },
};

// === FONCTION DE CONFIGURATION ===
export function getConfig(): EnvironmentConfig {
  // `process.env.NODE_ENV` est typé côté Node comme "development" | "production" | "test" (et n'inclut pas "recette").
  // On valide donc l'env **au runtime** via les clés de `environments` pour éviter les comparaisons impossibles au type-check.
  const envRaw = process.env.NODE_ENV;
  const env: keyof typeof environments =
    envRaw && Object.prototype.hasOwnProperty.call(environments, envRaw)
      ? (envRaw as keyof typeof environments)
      : 'development';
  return environments[env];
}

// === CONFIGURATION ACTUELLE ===
export const config = getConfig();

// === EXPORTS ===
export { environments };
export type { EnvironmentConfig };
