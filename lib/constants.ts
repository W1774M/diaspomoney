/**
 * Constantes - DiaspoMoney
 */

// === CONSTANTES GÉNÉRALES ===
export const APP_NAME = 'DiaspoMoney';
export const APP_VERSION = '2.0.0';
export const APP_DESCRIPTION = 'Plateforme Internationale de Services Multi-Secteurs';

// === CONSTANTES D'ENVIRONNEMENT ===
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  RECETTE: 'recette',
  PRODUCTION: 'production',
} as const;

// === CONSTANTES D'URLS ===
export const URLS = {
  DEV: 'https://dev.diaspomoney.fr',
  RCT: 'https://rct.diaspomoney.fr',
  PROD: 'https://app.diaspomoney.fr',
} as const;

// === CONSTANTES DE BASE DE DONNÉES ===
export const DATABASE = {
  COLLECTIONS: {
    USERS: 'users',
    TRANSACTIONS: 'transactions',
    PAYMENTS: 'payments',
    APPOINTMENTS: 'appointments',
    NOTIFICATIONS: 'notifications',
    AUDIT_LOGS: 'audit_logs',
  },
  INDEXES: {
    USER_EMAIL: 'email_1',
    USER_ROLES: 'roles_1',
    TRANSACTION_USER: 'userId_1',
    TRANSACTION_STATUS: 'status_1',
    APPOINTMENT_USER: 'userId_1',
    APPOINTMENT_PROVIDER: 'providerId_1',
  },
} as const;

// === CONSTANTES DE SÉCURITÉ ===
export const SECURITY = {
  JWT_EXPIRES_IN: '24h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 heures
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  HASH_ROUNDS: 12,
} as const;

// === CONSTANTES DE PAIEMENT ===
export const PAYMENT = {
  CURRENCIES: ['EUR', 'USD', 'XOF', 'XAF'],
  DEFAULT_CURRENCY: 'EUR',
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 10000,
  FEE_RATE: 0.029, // 2.9%
  FEE_MIN: 0.30,
  FEE_MAX: 10.00,
  REFUND_DAYS: 30,
} as const;

// === CONSTANTES D'EMAIL ===
export const EMAIL = {
  RATE_LIMIT: 100, // emails per minute
  MAX_QUEUE_SIZE: 1000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds
  TTL: 7 * 24 * 60 * 60 * 1000, // 7 days
  TEMPLATES: {
    WELCOME: 'welcome',
    PASSWORD_RESET: 'password_reset',
    PAYMENT_CONFIRMATION: 'payment_confirmation',
    APPOINTMENT_NOTIFICATION: 'appointment_notification',
    CUSTOM: 'custom',
  },
} as const;

// === CONSTANTES DE MONITORING ===
export const MONITORING = {
  METRICS_INTERVAL: 60000, // 1 minute
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  ALERT_THRESHOLDS: {
    ERROR_RATE: 0.05, // 5%
    RESPONSE_TIME: 2000, // 2 seconds
    MEMORY_USAGE: 0.8, // 80%
    CPU_USAGE: 0.8, // 80%
  },
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
  },
} as const;

// === CONSTANTES D'API ===
export const API = {
  VERSION: 'v1',
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 100,
  },
  TIMEOUT: {
    REQUEST: 30000, // 30 seconds
    DATABASE: 10000, // 10 seconds
    EXTERNAL: 15000, // 15 seconds
  },
  PAGINATION: {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
} as const;

// === CONSTANTES DE CACHE ===
export const CACHE = {
  TTL: {
    USER: 15 * 60 * 1000, // 15 minutes
    TRANSACTION: 5 * 60 * 1000, // 5 minutes
    APPOINTMENT: 10 * 60 * 1000, // 10 minutes
    EMAIL: 30 * 60 * 1000, // 30 minutes
  },
  KEYS: {
    USER: 'user',
    TRANSACTION: 'transaction',
    APPOINTMENT: 'appointment',
    EMAIL: 'email',
    SESSION: 'session',
  },
} as const;

// === CONSTANTES DE VALIDATION ===
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// === CONSTANTES DE FICHIERS ===
export const FILES = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  UPLOAD_PATH: '/uploads',
  TEMP_PATH: '/tmp',
} as const;

// === CONSTANTES DE NOTIFICATION ===
export const NOTIFICATION = {
  TYPES: {
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
    WHATSAPP: 'whatsapp',
  },
  PRIORITIES: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
  },
  CHANNELS: {
    SLACK: 'slack',
    EMAIL: 'email',
    WEBHOOK: 'webhook',
  },
} as const;

// === CONSTANTES DE WORKFLOW ===
export const WORKFLOW = {
  STATUS: {
    PENDING: 'pending',
    RUNNING: 'running',
    COMPLETED: 'completed',
    FAILED: 'failed',
    CANCELLED: 'cancelled',
  },
  TRIGGERS: {
    MANUAL: 'manual',
    SCHEDULED: 'scheduled',
    EVENT: 'event',
    WEBHOOK: 'webhook',
  },
} as const;

// === CONSTANTES D'EXPORT ===
export const EXPORTS = {
  FORMATS: ['csv', 'xlsx', 'pdf', 'json'],
  MAX_RECORDS: 10000,
  CHUNK_SIZE: 1000,
} as const;
