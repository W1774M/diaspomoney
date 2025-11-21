/**
 * Application constants for DiaspoMoney
 * Centralizes all magic values for better maintainability
 */

// === GENERAL CONSTANTS ===
export const APP_NAME = 'DiaspoMoney';
export const APP_VERSION = '0.1.2';
export const APP_DESCRIPTION = 'Plateforme Internationale de Services Multi-Secteurs';

// === ENVIRONMENT CONSTANTS ===
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  RECETTE: 'recette',
  PRODUCTION: 'production',
} as const;

// === URL CONSTANTS ===
export const URLS = {
  DEV: 'https://dev.diaspomoney.fr',
  RCT: 'https://rct.diaspomoney.fr',
  PROD: 'https://app.diaspomoney.fr',
} as const;

// === DATABASE CONSTANTS ===
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
  POOL_SIZE: {
    DEFAULT: 10,
    MEDIUM: 20,
    LARGE: 50,
  },
  SOCKET_TIMEOUT: 45000, // 45 seconds
} as const;

// === SECURITY CONSTANTS ===
export const SECURITY = {
  JWT_EXPIRES_IN: '24h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  HASH_ROUNDS: 12,
} as const;

// === PAYMENT CONSTANTS ===
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

// === EMAIL CONSTANTS ===
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

// === MONITORING CONSTANTS ===
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

// === API CONSTANTS ===
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

// === CACHE CONSTANTS ===
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

// === VALIDATION CONSTANTS ===
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  UUID_REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// === FILE CONSTANTS ===
export const FILES = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  UPLOAD_PATH: '/uploads',
  TEMP_PATH: '/tmp',
} as const;

// === NOTIFICATION CONSTANTS ===
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

// === WORKFLOW CONSTANTS ===
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

// === EXPORT CONSTANTS ===
export const EXPORTS = {
  FORMATS: ['csv', 'xlsx', 'pdf', 'json'],
  MAX_RECORDS: 10000,
  CHUNK_SIZE: 1000,
} as const;

// === LOCALE CONSTANTS ===
export const LOCALE = {
  DEFAULT: 'fr' as const,
} as const;

// === PROVIDER CONSTANTS ===
export const PROVIDER = {
  DEFAULT_ROLE: 'PROVIDER',
  DEFAULT_LIMIT: 50,
  DEFAULT_OFFSET: 0,
  CATEGORY_MAPPING: {
    HEALTH: ['Médecine', 'Dentisterie', 'Pharmacie', 'Soins'],
    EDU: ['Éducation', 'Formation', 'Cours', 'Tutorat'],
    IMMO: ['Immobilier', 'Location', 'Achat', 'Vente'],
  },
} as const;

// Unified PROVIDER constants
export const PROVIDER_CONSTANTS = {
  ...PROVIDER,
  ...API,
} as const;

// Unified BTP constants
export const BTP_CONSTANTS = {
  BASE_COST_PER_SQM: 150000,
  FEATURE_MULTIPLIERS: {
    piscine: 1.2,
    jardin: 1.1,
    garage: 1.15,
    terrasse: 1.05,
  },
  CURRENCY: 'XOF',
  ...API,
} as const;

// Unified NOTIFICATION constants
export const NOTIFICATION_CONSTANTS = {
  ...NOTIFICATION,
  ...API,
} as const;

// Unified USER constants
export const USER_CONSTANTS = {
  DEFAULT_ROLE: 'USER',
  DEFAULT_LIMIT: 50,
  DEFAULT_OFFSET: 0,
  ...API,
} as const;

// Unified TRANSACTION constants
export const TRANSACTION_CONSTANTS = {
  CURRENCIES: ['EUR', 'USD', 'XOF', 'XAF'],
  DEFAULT_CURRENCY: 'EUR',
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 10000,
  FEE_RATE: 0.029, // 2.9%
  FEE_MIN: 0.30,
  FEE_MAX: 10.00,
  REFUND_DAYS: 30,
  ...API,
} as const;

// LOG LEVELS
export const LOG_LEVELS = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
} as const;
export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

// HTTP STATUS CODES
export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ERROR CODES
export const ERROR_CODES = {
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
} as const;
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// DATE FORMATS
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  DATE_ONLY: 'YYYY-MM-DD',
  TIME_ONLY: 'HH:mm:ss',
  DATETIME: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE: 'DD/MM/YYYY',
  DISPLAY_DATETIME: 'DD/MM/YYYY HH:mm',
  TIMESTAMP: 'YYYY-MM-DDTHH:mm:ssZ',
} as const;

// TIMEZONE CONSTANTS
export const TIMEZONES = {
  PARIS: 'Europe/Paris',
  LONDON: 'Europe/London',
  NEW_YORK: 'America/New_York',
  LOS_ANGELES: 'America/Los_Angeles',
  TOKYO: 'Asia/Tokyo',
  DAKAR: 'Africa/Dakar',
  ABIDJAN: 'Africa/Abidjan',
  DOUALA: 'Africa/Douala',
  UTC: 'UTC',
} as const;
export type Timezone = typeof TIMEZONES[keyof typeof TIMEZONES];

// CURRENCY CONSTANTS
export const CURRENCIES = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  XOF: { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
  XAF: { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
} as const;
export type CurrencyCode = keyof typeof CURRENCIES;

// LANGUAGE CONSTANTS
export const LANGUAGES = {
  FR: { code: 'fr', name: 'Français', nativeName: 'Français' },
  EN: { code: 'en', name: 'English', nativeName: 'English' },
  ES: { code: 'es', name: 'Spanish', nativeName: 'Español' },
  DE: { code: 'de', name: 'German', nativeName: 'Deutsch' },
  IT: { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  PT: { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  AR: { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
} as const;
export type LanguageCode = keyof typeof LANGUAGES;

// ROLE CONSTANTS
export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  PROVIDER: 'PROVIDER',
  CUSTOMER: 'CUSTOMER',
  BENEFICIARY: 'BENEFICIARY',
  CSM: 'CSM',
} as const;
export type Role = typeof ROLES[keyof typeof ROLES];

// USER STATUS CONSTANTS
export const USER_STATUSES = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING: 'PENDING',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = typeof USER_STATUSES[keyof typeof USER_STATUSES];

// BOOKING STATUS CONSTANTS
export const BOOKING_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
} as const;
export type BookingStatus = typeof BOOKING_STATUSES[keyof typeof BOOKING_STATUSES];

// TRANSACTION STATUS CONSTANTS
export const TRANSACTION_STATUSES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
} as const;
export type TransactionStatus = typeof TRANSACTION_STATUSES[keyof typeof TRANSACTION_STATUSES];

// PAYMENT METHOD CONSTANTS
export const PAYMENT_METHODS = {
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOBILE_MONEY: 'MOBILE_MONEY',
  PAYPAL: 'PAYPAL',
  STRIPE: 'STRIPE',
} as const;
export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];

// NOTIFICATION TYPE CONSTANTS
export const NOTIFICATION_TYPES = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  WHATSAPP: 'WHATSAPP',
  IN_APP: 'IN_APP',
} as const;
export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// MESSAGE TYPE CONSTANTS
export const MESSAGE_TYPES = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
  SYSTEM: 'SYSTEM',
} as const;
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];

// SPECIALITY TYPE CONSTANTS
export const SPECIALITY_TYPES = {
  HEALTH: 'HEALTH',
  BTP: 'BTP',
  EDUCATION: 'EDUCATION',
  LEGAL: 'LEGAL',
  FINANCE: 'FINANCE',
  TECHNOLOGY: 'TECHNOLOGY',
} as const;
export type SpecialityType = typeof SPECIALITY_TYPES[keyof typeof SPECIALITY_TYPES];

// EDUCATION LEVEL CONSTANTS
export const EDUCATION_LEVELS = {
  PRIMARY: 'PRIMARY',
  SECONDARY: 'SECONDARY',
  HIGH_SCHOOL: 'HIGH_SCHOOL',
  BACHELOR: 'BACHELOR',
  MASTER: 'MASTER',
  DOCTORATE: 'DOCTORATE',
  PROFESSIONAL: 'PROFESSIONAL',
} as const;
export type EducationLevel = typeof EDUCATION_LEVELS[keyof typeof EDUCATION_LEVELS];

// BTP CATEGORY CONSTANTS
export const BTP_CATEGORIES = {
  CONSTRUCTION: 'CONSTRUCTION',
  RENOVATION: 'RENOVATION',
  PLUMBING: 'PLUMBING',
  ELECTRICITY: 'ELECTRICITY',
  PAINTING: 'PAINTING',
  ROOFING: 'ROOFING',
  FLOORING: 'FLOORING',
  CARPENTRY: 'CARPENTRY',
  MASONRY: 'MASONRY',
  LANDSCAPING: 'LANDSCAPING',
} as const;
export type BTPCategory = typeof BTP_CATEGORIES[keyof typeof BTP_CATEGORIES];

// HEALTH SPECIALTY CONSTANTS
export const HEALTH_SPECIALTIES = {
  GENERAL_MEDICINE: 'GENERAL_MEDICINE',
  CARDIOLOGY: 'CARDIOLOGY',
  DERMATOLOGY: 'DERMATOLOGY',
  PEDIATRICS: 'PEDIATRICS',
  GYNECOLOGY: 'GYNECOLOGY',
  ORTHOPEDICS: 'ORTHOPEDICS',
  PSYCHIATRY: 'PSYCHIATRY',
  DENTISTRY: 'DENTISTRY',
  OPHTHALMOLOGY: 'OPHTHALMOLOGY',
  NEUROLOGY: 'NEUROLOGY',
  ONCOLOGY: 'ONCOLOGY',
  RADIOLOGY: 'RADIOLOGY',
  SURGERY: 'SURGERY',
  UROLOGY: 'UROLOGY',
  PHARMACY: 'PHARMACY',
  NURSING: 'NURSING',
} as const;
export type HealthSpecialty = typeof HEALTH_SPECIALTIES[keyof typeof HEALTH_SPECIALTIES];

// API ENDPOINTS
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/user-profile',
  },
  USERS: {
    BASE: '/api/users',
    ME: '/api/users/me',
    BY_ID: (id: string) => `/api/users/${id}`,
  },
  TRANSACTIONS: {
    BASE: '/api/transactions',
    BY_ID: (id: string) => `/api/transactions/${id}`,
  },
  PAYMENTS: {
    BASE: '/api/payments',
    CREATE_INTENT: '/api/payments/create-intent',
    PROCESS: '/api/payments/process',
    RECEIPTS: '/api/payments/receipts',
  },
  BOOKINGS: {
    BASE: '/api/bookings',
    CONFIRM_PAYMENT: '/api/bookings/confirm-payment',
    BY_ID: (id: string) => `/api/bookings/${id}`,
  },
  INVOICES: {
    BASE: '/api/invoices',
    BY_ID: (id: string) => `/api/invoices/${id}`,
  },
  BENEFICIARIES: {
    BASE: '/api/beneficiaries',
    BY_ID: (id: string) => `/api/beneficiaries/${id}`,
  },
  COMPLAINTS: {
    BASE: '/api/complaints',
    BY_ID: (id: string) => `/api/complaints/${id}`,
  },
  NOTIFICATIONS: {
    BASE: '/api/notifications',
    BY_ID: (id: string) => `/api/notifications/${id}`,
  },
  MESSAGING: {
    BASE: '/api/messaging',
    CONVERSATIONS: '/api/messaging/conversations',
    MESSAGES: '/api/messaging/messages',
  },
  STATISTICS: {
    BASE: '/api/statistics',
    PERSONAL: '/api/statistics/personal',
  },
  HEALTH: {
    BASE: '/api/health',
    PROVIDERS: '/api/health/providers',
  },
  BTP: {
    BASE: '/api/btp',
    QUOTE: '/api/btp/quote',
  },
} as const;

// VALIDATION RULES
export const VALIDATION_RULES = {
  EMAIL: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL_CHAR: true,
    REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PHONE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 15,
    REGEX: /^\+?[1-9]\d{1,14}$/,
  },
  ADDRESS: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 255,
  },
  POSTAL_CODE: {
    MIN_LENGTH: 4,
    MAX_LENGTH: 10,
    REGEX: /^[A-Z0-9\s-]+$/i,
  },
  AMOUNT: {
    MIN: 0.01,
    MAX: 1000000,
    DECIMAL_PLACES: 2,
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 5000,
  },
  TITLE: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 200,
  },
  UUID: {
    REGEX: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  },
  URL: {
    REGEX: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/u,
  },
  DATE: {
    MIN_YEAR: 1900,
    MAX_YEAR: 2100,
  },
} as const;
