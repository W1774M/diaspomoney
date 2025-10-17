/**
 * Types principaux - DiaspoMoney
 * Centralisation de tous les types du projet
 */

// === TYPES DE BASE ===
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

// === TYPES UTILISATEUR ===
export enum UserRole {
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
  CUSTOMER = 'CUSTOMER',
  BENEFICIARY = 'BENEFICIARY',
  CSM = 'CSM'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED'
}

export enum ProviderType {
  INDIVIDUAL = 'INDIVIDUAL',
  INSTITUTION = 'INSTITUTION'
}

export enum ProviderCategory {
  HEALTH = 'HEALTH',
  BTP = 'BTP',
  EDUCATION = 'EDUCATION'
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
  roles: UserRole[];
  status: UserStatus;
  specialty?: string;
  recommended: boolean;
  providerInfo?: ProviderInfo;
  apiGeo?: ApiGeo[];
}

export interface ProviderInfo {
  type: ProviderType;
  category: ProviderCategory;
  specialties: string[];
  description?: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  institution?: InstitutionInfo;
  individual?: IndividualInfo;
  professionalContact?: ProfessionalContact;
  professionalAddress?: ProfessionalAddress;
  availability?: Availability;
  pricing?: Pricing;
  documents: Document[];
}

export interface InstitutionInfo {
  legalName: string;
  registrationNumber: string;
  taxId: string;
  establishedYear: number;
  employees: number;
  certifications: string[];
}

export interface IndividualInfo {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  qualifications: string[];
  experience: number;
  languages: string[];
}

export interface ProfessionalContact {
  phone: string;
  email: string;
  website?: string;
}

export interface ProfessionalAddress {
  street: string;
  city: string;
  country: string;
  postalCode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface Availability {
  monday: TimeSlot[];
  tuesday: TimeSlot[];
  wednesday: TimeSlot[];
  thursday: TimeSlot[];
  friday: TimeSlot[];
  saturday: TimeSlot[];
  sunday: TimeSlot[];
  timezone?: string;
}

export interface TimeSlot {
  start: string;
  end: string;
  isAvailable: boolean;
  maxBookings: number;
  currentBookings: number;
}

export interface Pricing {
  basePrice: number;
  currency: string;
  pricingModel: PricingModel;
  discounts: Discount[];
}

export enum PricingModel {
  FIXED = 'FIXED',
  HOURLY = 'HOURLY',
  PER_SQM = 'PER_SQM',
  CUSTOM = 'CUSTOM'
}

export interface Discount {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  conditions?: string;
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  url: string;
  uploadedAt: Date;
  expiresAt?: Date;
}

export enum DocumentType {
  LICENSE = 'LICENSE',
  CERTIFICATE = 'CERTIFICATE',
  INSURANCE = 'INSURANCE',
  PORTFOLIO = 'PORTFOLIO',
  OTHER = 'OTHER'
}

export interface ApiGeo {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
}

// === TYPES TRANSACTION ===
export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  TRANSFER = 'TRANSFER',
  FEE = 'FEE'
}

export interface Transaction extends BaseEntity {
  userId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  metadata?: Record<string, any>;
  paymentIntentId?: string;
  refundId?: string;
}

// === TYPES PAIEMENT ===
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  PAYPAL = 'PAYPAL'
}

export interface Payment extends BaseEntity {
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paymentIntentId: string;
  clientSecret?: string;
  metadata?: Record<string, any>;
}

// === TYPES RENDEZ-VOUS ===
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export interface Appointment extends BaseEntity {
  userId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string;
  duration: number;
  status: AppointmentStatus;
  notes?: string;
  metadata?: Record<string, any>;
}

// === TYPES NOTIFICATION ===
export enum NotificationType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED'
}

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  status: NotificationStatus;
  subject: string;
  content: string;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
  sentAt?: Date;
}

// === TYPES EMAIL ===
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailQueueItem {
  id: string;
  type: string;
  to: string;
  data: any;
  priority: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// === TYPES SÉCURITÉ ===
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

// === TYPES MONITORING ===
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

// === TYPES CONFIGURATION ===
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

// === TYPES ENVIRONNEMENT ===
export enum Environment {
  DEVELOPMENT = 'development',
  RECETTE = 'recette',
  PRODUCTION = 'production'
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

// === TYPES API ===
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

export interface ApiContext {
  user?: User;
  request: ApiRequest;
  environment: Environment;
}

// === TYPES SERVICES ===
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ServiceConfig {
  name: string;
  version: string;
  environment: Environment;
  config?: Record<string, any>;
}

// === TYPES WORKFLOW ===
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

// === TYPES MANQUANTS ===
export interface IBooking extends BaseEntity {
  userId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string;
  status: string;
  price: number;
  reservationNumber: string;
}

export interface IInvoice extends BaseEntity {
  invoiceNumber: string;
  customerId: string;
  providerId: string;
  amount: number;
  currency: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  userId: string;
}

export type IUser = User;

export type IAppointment = Appointment;

export interface ISpeciality extends BaseEntity {
  name: string;
  description: string;
  group: string;
  isActive: boolean;
}

export type SpecialityType = ISpeciality;

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
}

export interface NotificationState {
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

// === TYPES EXPORT ===
// Réexport de tous les types pour faciliter l'import
export {
  export type BaseEntity,
  export type       ApiResponse,
  PaginationParams,
  PaginatedResponse,
  User,
  UserRole,
  UserStatus,
  ProviderType,
  ProviderCategory,
  ProviderInfo,
  Transaction,
  TransactionStatus,
  TransactionType,
  Payment,
  PaymentStatus,
  PaymentMethod,
  Appointment,
  AppointmentStatus,
  Notification,
  NotificationType,
  NotificationStatus,
  EmailOptions,
  EmailTemplate,
  EmailQueueItem,
  SecurityEvent,
  AuditLog,
  Metrics,
  Alert,
  DatabaseConfig,
  RedisConfig,
  EmailConfig,
  SecurityConfig,
  Environment,
  EnvironmentConfig,
  ApiError,
  ApiRequest,
  ApiContext,
  ServiceResponse,
  ServiceConfig,
  WorkflowStep,
  Workflow,
  IBooking,
  IInvoice,
  IUser,
  IAppointment,
  ISpeciality,
  SpecialityType,
  AuthState,
  NotificationState,
  ThemeState
};