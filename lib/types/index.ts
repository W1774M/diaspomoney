/**
 * Types principaux - DiaspoMoney
 * Centralisation de tous les types du projet
 */

/* -------------------------------------------------
   === TYPES DE BASE ===
-------------------------------------------------- */
export interface BaseEntity {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  status?: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/* -------------------------------------------------
   === TYPES SÉCURITÉ ET MONITORING ===
-------------------------------------------------- */
export interface SecurityEvent {
  type: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  event: string;
  userId?: string;
  system: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface Metrics {
  timestamp: Date;
  value: number;
  labels: Record<string, string>;
}

export interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

/* -------------------------------------------------
   === TYPES CONFIGURATION & ENVIRONNEMENT ===
-------------------------------------------------- */
export interface DatabaseConfig {
  uri: string;
  options?: Record<string, any>;
}

export interface RedisConfig {
  url: string;
  options?: Record<string, any>;
}

export interface EmailConfig {
  apiKey: string;
  from: string;
  replyTo: string;
}

export interface SecurityConfig {
  jwtSecret: string;
  encryptionKey: string;
  sessionSecret: string;
}

// Enums et config d'environnements
export enum Environment {
  DEVELOPMENT = 'development',
  RECETTE = 'recette',
  PRODUCTION = 'production',
}

export interface EnvironmentConfig {
  nodeEnv: Environment;
  appUrl: string;
  apiUrl: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  email: EmailConfig;
  security: SecurityConfig;
}

/* -------------------------------------------------
   === UI, BOUTONS, MODALES, SERVICES ===
-------------------------------------------------- */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// Utiliser directement le type Appointment exporté depuis ./bookings.types
import type { Appointment } from './bookings.types';
export interface ModalPreviewProps {
  appointment: Appointment;
  setModalOpen: (open: boolean) => void;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
}

export interface ServicesButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

/* -------------------------------------------------
   === TYPES API ET CONTEXTE ===
-------------------------------------------------- */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, any>;
}

// Utiliser User correctement depuis user.types
import type { User } from './user.types';
export interface ApiContext {
  user?: User;
  request: ApiRequest;
  environment: Environment;
}

/* -------------------------------------------------
   === WORKFLOW & PROCESSUS ===
-------------------------------------------------- */
export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config?: Record<string, any>;
  dependencies?: string[];
}

export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'active' | 'inactive' | 'error';
}

/* -------------------------------------------------
   === SPÉCIALITÉS / COMMON DOMAIN TYPES ===
-------------------------------------------------- */
export interface ISpeciality extends BaseEntity {
  name: string;
  description: string;
  group: string;
  isActive: boolean;
}

export type SpecialityType = ISpeciality;

/* -------------------------------------------------
   === THEME & STATES ===
-------------------------------------------------- */
export type Theme = 'light' | 'dark' | 'system';

export interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

/* -------------------------------------------------
   === GÉODATA API ===
-------------------------------------------------- */
export interface ApiGeo {
  name: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

/* -------------------------------------------------
   === ATTENDANCE ===
-------------------------------------------------- */
export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  recordedBy: string;
  notes: string;
}

/* -------------------------------------------------
   === UTILITAIRES & AUTRES DOMAIN TYPES ===
-------------------------------------------------- */
export interface SpecialityExtended extends ISpeciality {
  specialityId?: number;
}

/* -------------------------------------------------
   === REEXPORTS REPOSITORY ===
-------------------------------------------------- */
// Réexport également depuis le repository pour cohérence
export type {
  Medication as MedicationRepository,
  PrescriptionFilters,
  Prescription as PrescriptionRepository,
} from '@/repositories/interfaces/IPrescriptionRepository';

/* -------------------------------------------------
   === RÉEXPORT TYPES DOMAINE SPÉCIFIQUE ===
-------------------------------------------------- */
export * from './quotes.types';
export * from './messaging.types';

// Orders - Exporter tout sauf PersonalStatistics (conflit avec statistics.types)
export type {
  OrderStatus,
  ServiceType as OrderServiceType,
  OrderProgress,
  OrderStep,
  ActiveOrder,
  AssignedProvider,
  HistoricalOrder,
  OrderFilters,
  ActiveOrderCardProps,
  HistoricalOrderCardProps,
  OrderProgressBarProps,
  OrderChatProps,
  PersonalStatistics as OrderPersonalStatistics,
} from './orders.types';

// Payments - Exporter en premier (types principaux pour Payment, PaymentMethod, PaymentStatus)
export * from './payments.types';

// Transactions - Exporter avec alias pour éviter conflits avec Payment
// Exporter les enums comme valeurs (pas export type)
export {
  TransactionStatus,
  TransactionType,
} from './transaction.types';
// Exporter les types et interfaces
export type {
  Transaction,
  SimpleTransaction,
  PaymentTransaction,
  CreateTransactionRequest,
  CreatePaymentRequest,
  RefundRequest,
  TransactionFilters,
  TransactionResponse,
  TransactionsResponse,
  RefundResponse,
  StripeWebhookEvent,
  PaymentIntentWebhook,
  FeeCalculation,
  CurrencyConversion,
  TransactionData,
  TransactionStats,
  // Renommer Payment, PaymentMethod, PaymentStatus de transaction.types
  Payment as TransactionPayment,
  PaymentStatus as TransactionPaymentStatus,
  PaymentMethod as TransactionPaymentMethod,
} from './transaction.types';

// Invoices - Exporter avec alias IInvoice pour compatibilité
// Exporter InvoiceStatus comme valeur (enum), pas comme type
export { InvoiceStatus, INVOICE_STATUSES } from './invoices.types';
export type {
  Invoice,
  Invoice as IInvoice,
  InvoiceExtended,
  InvoiceFilters,
  InvoiceStatusExtended,
  InvoiceCardProps,
  InvoicesFiltersProps,
  InvoicesTableProps,
  InvoicesHeaderProps,
  InvoicesTabsProps,
} from './invoices.types';
export * from './statistics.types';
export * from './hooks.types';

// Settings - Exporter avec alias pour NotificationSettingsProps (conflit avec notifications.types)
export type {
  ProfileData,
  PreferencesData,
  SecurityData,
  BillingData,
  PrivacyData,
  SettingsTab,
  SettingsHeaderProps,
  SettingsTabsProps,
  ProfileSettingsProps,
  SecuritySettingsProps,
  NotificationSettingsProps as SettingsNotificationProps,
  BillingSettingsProps,
  PrivacySettingsProps,
} from './settings.types';

// Notifications - Exporter (NotificationSettingsProps principal ici)
export * from './notifications.types';

// Bookings - Exporter (Appointment principal ici)
export * from './bookings.types';

// Export complaints types with explicit exports to avoid conflicts
export type {
  Complaint,
  CreateComplaintData,
  UpdateComplaintData,
  ComplaintServiceFilters,
  ComplaintFilters,
  ComplaintStats,
  ComplaintCardProps,
  ComplaintFormProps,
  ComplaintFormData,
  ComplaintsHeaderProps,
  ComplaintsSearchProps,
  ComplaintsFiltersProps,
  ComplaintsTableProps,
  ComplaintsPageProps,
  // Types de base pour les réclamations
  ComplaintType,
  ComplaintPriority,
  ComplaintStatus,
} from './complaints.types';
export * from './dashboard.types';
export * from './dashboard-services.types';
// Users - Exporter avec alias pour UserFilters (conflit avec user.types et user-document.types)
export type {
  UserCardProps,
  UsersFiltersProps,
  UsersTableProps,
  UsersHeaderProps,
  UserFilters as UsersUserFilters,
} from './users.types';
export * from './auth.types';
export * from './beneficiaries.types';
export * from './kyc.types';
export * from './availability.types';
export * from './email.types';

// Health - Exporter avec alias pour TimeSlot et Appointment (conflits)
export type {
  HealthProvider,
  ProviderAvailability,
  TimeSlot as HealthTimeSlot,
  Medication,
  Prescription,
  Appointment as HealthAppointment,
  Teleconsultation,
  HealthProviderFilters,
  AppointmentFilters as HealthAppointmentFilters,
  HealthService,
} from './health.types';

export * from './pci.types';
export * from './gdpr.types';

// User - Exporter (inclut RoleColor et StatusColor)
export * from './user.types';

// User-document - Exporter (UserFilters principal ici, mais UserFilters vient de user.types)
export type {
  UserDocument,
  UserUpdateData,
  UserResponse,
} from './user-document.types';

// User - Exporter avec alias pour TimeSlot et UserFilters (conflits)
// Exporter les enums et constantes comme valeurs (pas export type)
export {
  UserRole,
  UserStatus,
  ProviderType,
  ProviderCategory,
  USER_ROLES,
  USER_STATUSES,
  PROVIDER_TYPES,
  PROVIDER_CATEGORIES,
} from './user.types';

// Exporter les types et interfaces
export type {
  IUser,
  User,
  UserStatusExtended,
  ProviderInfo,
  InstitutionInfo,
  ProfessionalAddress,
  Availability,
  TimeSlot as UserTimeSlot,
  CreateUserRequest,
  UpdateUserRequest,
  UserFilters as UserFiltersFromUserTypes,
  UseProviderReturn,
  UserStatistics,
  UserExtended,
  CreateUserInput,
  UserEditFormData,
  ProviderService,
} from './user.types';

export * from './services.types';

// BTP - Exporter les types BTP
export * from './btp.types';

// Components - Exporter les types de composants
export * from './components.types';

// Stripe - Exporter les types Stripe (sans StripePaymentMethod et StripeWebhookEvent qui sont déjà exportés)
export type {
  StripePaymentIntent,
  StripeDispute,
  StripeRefundCreateParams,
  StripeCharge,
  StripePaymentIntentCreateParams,
  StripePaymentIntentConfirmParams,
  StripePaymentMethodAttachParams,
  StripeCustomerUpdateParams,
  StripePaymentMethodListParams,
  StripeWebhookEventType,
  StripeWebhookEventData,
  StripePaymentError,
  StripeConfig,
  StripeClientOptions,
  StripePaymentMethodRaw,
} from './stripe.types';

// === TYPES ARCHITECTURAUX ===
export * from './mappers.types';
export * from './builders.types';
// Export decorators types with explicit exports to avoid conflicts
export type {
  BaseDecoratorOptions,
  LogDecoratorOptions,
  CacheableDecoratorOptions,
  InvalidateCacheDecoratorOptions,
  RetryDecoratorOptions,
  ValidateDecoratorOptions,
  ValidationRule as DecoratorValidationRule,
  RateLimitDecoratorOptions,
  AuthorizeDecoratorOptions,
  AuditDecoratorOptions,
  DeprecatedDecoratorOptions,
  PerformanceDecoratorOptions,
  TransactionDecoratorOptions,
  CircuitBreakerDecoratorOptions,
  DecoratorMetadata,
  DecoratorOptions,
} from './decorators.types';
// Export constants types with explicit exports to avoid conflicts
// Note: Environment is already defined in this file (line 104), so we skip it
export type {
  ConstantValue,
  ConstantKey,
  WorkflowStatus,
  WorkflowTrigger,
  NotificationPriority as ConstantsNotificationPriority,
  NotificationChannel as ConstantsNotificationChannel,
  ExportFormat,
  ServiceType,
  ComplaintType as ConstantsComplaintType,
  ComplaintPriority as ConstantsComplaintPriority,
  InvoiceStatus as ConstantsInvoiceStatus,
  ComplaintStatus as ConstantsComplaintStatus,
  DatabaseCollection,
  DatabaseIndex,
  EmailTemplate as ConstantsEmailTemplate,
  LogLevelType,
  HttpStatusCode,
  DateFormat,
  AllowedFileType,
  ValidationRuleType,
  ApiEndpoint,
  ConstantsConfig,
} from './constants.types';
// Export errors types with explicit exports to avoid conflicts
// Note: ApiError is already defined in this file (line 158), so we skip it
export type {
  ValidationError as ErrorValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TransactionError,
  ServiceUnavailableError,
  RateLimitError,
  UnknownError,
  AppError,
  CreateErrorOptions,
  Result,
  ResultError,
  ResultData,
} from './errors.types';
export * from './events.types';
export * from './cache.types';
// Export validation types with explicit exports to avoid conflicts
export type {
  ValidationResult,
  ValidationError as ValidationValidationError,
  ValidationOptions,
  ValidatorFunction,
  ValidationRule as ValidationValidationRule,
  ValidationSchema,
  FormValidationResult,
  FieldValidator,
  CustomValidator,
  AsyncValidationOptions,
  AsyncValidationResult,
  ValidatedType,
  InputType,
} from './validation.types';
export * from './repositories.types';
export * from './layout.types';
export * from './mongodb.types';
// Export facades types with explicit exports to avoid conflicts
export type {
  FacadeData,
  FacadeResult,
  FacadeOptions,
  IFacade,
  BookingFacadeData,
  BookingFacadeResult,
  PaymentFacadeData,
  PaymentFacadeResult,
  InvoiceFacadeData,
  InvoiceFacadeResult,
  ComplaintFacadeData,
  ComplaintFacadeResult,
  BeneficiaryFacadeData,
  BeneficiaryFacadeResult,
  FacadeConfig,
  FacadeError,
} from './facades.types';