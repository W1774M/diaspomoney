/**
 * Configuration centralisée - DiaspoMoney
 * Utilise les constantes et types centralisés
 */

import type { Environment, EnvironmentConfig } from '@/lib/types';
import { API, DATABASE, ENVIRONMENTS } from '@/lib/constants';

// === CONFIGURATION PAR ENVIRONNEMENT ===
const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    nodeEnv: ENVIRONMENTS.DEVELOPMENT as Environment,
    appUrl: 'https://dev.diaspomoney.fr',
    apiUrl: 'https://dev.diaspomoney.fr/api',
    database: {
      uri:
        process.env['MONGODB_URI'] ||
        'mongodb://localhost:27017/diaspomoney_dev',
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
    nodeEnv: ENVIRONMENTS.RECETTE as Environment,
    appUrl: 'https://rct.diaspomoney.fr',
    apiUrl: 'https://rct.diaspomoney.fr/api',
    database: {
      uri:
        process.env['MONGODB_URI'] ||
        'mongodb://localhost:27017/diaspomoney_rct',
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
    nodeEnv: ENVIRONMENTS.PRODUCTION as Environment,
    appUrl: 'https://app.diaspomoney.fr',
    apiUrl: 'https://app.diaspomoney.fr/api',
    database: {
      uri:
        process.env['MONGODB_URI'] ||
        'mongodb://localhost:27017/diaspomoney_prod',
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
  const env = (process.env.NODE_ENV as Environment) || 'development';
  return environments[env];
}

// === CONFIGURATION ACTUELLE ===
export const config = getConfig();

// === EXPORTS ===
export { environments };
export type { EnvironmentConfig };
