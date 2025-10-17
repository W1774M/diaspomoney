/**
 * Configuration centralisée - DiaspoMoney
 */

import type { Environment, EnvironmentConfig } from '@/types';

// === CONFIGURATION PAR ENVIRONNEMENT ===
const environments: Record<Environment, EnvironmentConfig> = {
  development: {
    nodeEnv: 'development',
    appUrl: 'https://dev.diaspomoney.fr',
    apiUrl: 'https://dev.diaspomoney.fr/api',
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney_dev',
      options: {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      options: {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      }
    },
    email: {
      apiKey: process.env.RESEND_API_KEY || '',
      from: 'DiaspoMoney <noreply@dev.diaspomoney.fr>',
      replyTo: 'support@dev.diaspomoney.fr'
    },
    security: {
      jwtSecret: process.env.JWT_SECRET || 'dev-jwt-secret',
      encryptionKey: process.env.ENCRYPTION_KEY || 'dev-encryption-key',
      sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret'
    }
  },
  recette: {
    nodeEnv: 'recette',
    appUrl: 'https://rct.diaspomoney.fr',
    apiUrl: 'https://rct.diaspomoney.fr/api',
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney_rct',
      options: {
        maxPoolSize: 20,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      options: {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      }
    },
    email: {
      apiKey: process.env.RESEND_API_KEY || '',
      from: 'DiaspoMoney <noreply@rct.diaspomoney.fr>',
      replyTo: 'support@rct.diaspomoney.fr'
    },
    security: {
      jwtSecret: process.env.JWT_SECRET || 'rct-jwt-secret',
      encryptionKey: process.env.ENCRYPTION_KEY || 'rct-encryption-key',
      sessionSecret: process.env.SESSION_SECRET || 'rct-session-secret'
    }
  },
  production: {
    nodeEnv: 'production',
    appUrl: 'https://app.diaspomoney.fr',
    apiUrl: 'https://app.diaspomoney.fr/api',
    database: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/diaspomoney_prod',
      options: {
        maxPoolSize: 50,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      }
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      options: {
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      }
    },
    email: {
      apiKey: process.env.RESEND_API_KEY || '',
      from: 'DiaspoMoney <noreply@diaspomoney.fr>',
      replyTo: 'support@diaspomoney.fr'
    },
    security: {
      jwtSecret: process.env.JWT_SECRET || 'prod-jwt-secret',
      encryptionKey: process.env.ENCRYPTION_KEY || 'prod-encryption-key',
      sessionSecret: process.env.SESSION_SECRET || 'prod-session-secret'
    }
  }
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
