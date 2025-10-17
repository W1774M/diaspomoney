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

// === TYPES UTILISATEUR ===
export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  PROVIDER = 'PROVIDER',
  CUSTOMER = 'CUSTOMER',
  BENEFICIARY = 'BENEFICIARY',
  CSM = 'CSM',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
}

export enum ProviderType {
  INDIVIDUAL = 'INDIVIDUAL',
  INSTITUTION = 'INSTITUTION',
}

export enum ProviderCategory {
  HEALTH = 'HEALTH',
  BTP = 'BTP',
  EDUCATION = 'EDUCATION',
}

export interface User extends BaseEntity {
  clientNotes?: string;
  avatar?: any;
  preferences?: { language: string; timezone: string; notifications: boolean };
  email: string;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
  roles: UserRole[];
  status: UserStatus;
  specialty?: string;
  recommended?: boolean;
  providerInfo?: ProviderInfo;
  apiGeo?: ApiGeo[];
  selectedServices?: string[];
  availabilities?: Availability[];
  category?: string;
  type?: string;
  acceptsFirstConsultation?: boolean;
  acceptsVideoConsultation?: boolean;
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
  type: string;
  id: any;
  isActive: any;
  name: string;
  timeSlots: any;
  startDate: any;
  endDate: any;
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
  dayOfWeek: number;
  id: string | null | undefined;
  startTime: string;
  endTime: string;
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
  CUSTOM = 'CUSTOM',
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
  OTHER = 'OTHER',
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
  REFUNDED = 'REFUNDED',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  TRANSFER = 'TRANSFER',
  FEE = 'FEE',
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
  REFUNDED = 'REFUNDED',
}

export const PaymentMethod = {
  CARD: 'CARD',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MOBILE_MONEY: 'MOBILE_MONEY',
  PAYPAL: 'PAYPAL',
} as const;

export type PaymentMethodType =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

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
  NO_SHOW = 'NO_SHOW',
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
  timeslot?: string;
  selectedService?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  requester?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  provider?: {
    id: string;
    name: string;
    specialty: string;
  };
}

// === TYPES NOTIFICATION ===
export const NotificationType = {
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH',
  WHATSAPP: 'WHATSAPP',
} as const;

export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationStatus = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
} as const;

export type NotificationStatus =
  (typeof NotificationStatus)[keyof typeof NotificationStatus];

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
  scheduledAt: Date;
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

// === TYPES BOOKING ===
export interface BookingListItem {
  id: string;
  serviceName: string;
  providerName: string;
  date: Date;
  status: string;
  price: number;
  currency: string;
}

export interface UseBookingsReturn {
  bookings: BookingListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseProviderReturn {
  provider: IUser | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// === TYPES INVOICE ===
export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export const INVOICE_STATUSES = Object.values(InvoiceStatus);

// === TYPES USER ===
export const USER_ROLES = Object.values(UserRole);
export const USER_STATUSES = Object.values(UserStatus);

// === TYPES USER ROLE EXTENDED ===
export interface UserRoleExtended {
  value: string;
  label: string;
}

// === TYPES USER STATUS EXTENDED ===
export interface UserStatusExtended {
  value: string;
  label: string;
}

// === TYPES INVOICE STATUS EXTENDED ===
export interface InvoiceStatusExtended {
  value: string;
  label: string;
}

// === TYPES BUTTON ===
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// === TYPES MODAL ===
export interface ModalPaymentProps {
  appointment: Appointment;
  setModalOpen: (open: boolean) => void;
  setSteps: (step: number) => void;
}

export interface ModalPreviewProps {
  appointment: Appointment;
  setModalOpen: (open: boolean) => void;
}

export interface PaymentData {
  amount: number;
  currency: string;
  paymentMethod: string;
}

// === TYPES PROVIDER ===
export interface ProviderService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
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

// === TYPES APPOINTMENT ===
export interface AppointmentData {
  id: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string;
  duration: number;
  status: string;
  notes?: string;
  timeslot?: string;
  selectedService?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  requester?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  provider?: {
    id: string;
    name: string;
    specialty: string;
  };
}

// === TYPES USER EXTENDED ===
export interface UserExtended extends IUser {
  clientNotes?: string;
  avatar?: any;
  preferences?: { language: string; timezone: string; notifications: boolean };
  availabilities?: Availability[];
  selectedServices?: string[];
  category?: string;
  type?: string;
  acceptsFirstConsultation?: boolean;
  acceptsVideoConsultation?: boolean;
}

// === TYPES INVOICE EXTENDED ===
export interface InvoiceExtended extends IInvoice {
  notes?: string;
  paymentDate?: Date;
  paidDate?: Date;
}

// === TYPES BOOKING EXTENDED ===
export interface BookingExtended extends IBooking {
  totalAmount?: number;
  requesterInfo?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  recipientInfo?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  selectedService?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  timeslot?: {
    start: string;
    end: string;
    date: string;
  };
  beneficiary?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
}

// === TYPES SPECIALITY EXTENDED ===
export interface SpecialityExtended extends ISpeciality {
  specialityId?: number;
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
  paymentDate?: Date;
  paidDate?: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  notes?: string;
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

// === TYPES PAYMENT DATA ===
export interface PaymentData {
  amount: number;
  currency: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

// === TYPES APPOINTMENT EXTENDED ===
export interface AppointmentExtended extends AppointmentData {
  selectedService?: {
    id: string;
    name: string;
    price: number;
    duration: number;
  };
  provider?: {
    id: string;
    name: string;
    specialty: string;
  };
}

// === TYPES MODAL PREVIEW PROPS ===
export interface ModalPreviewPropsExtended {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentExtended;
  paymentData?: PaymentData;
  setSteps?: (steps: number) => void;
}

// === TYPES CREATE USER INPUT ===
export interface CreateUserInput {
  [x: string]: any;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  phone?: string;
  avatar?: string;
  preferences?: Record<string, any>;
  clientNotes?: string;
  selectedServices?: string[];
  category?: string;
  availabilities?: Availability[];
  // Optional extras used by forms
  company?: string;
  address?: string;
  specialty?: string;
  roles?: UserRole[];
}

// === TYPES TRANSACTION FILTERS ===
export interface TransactionFilters {
  status?: string;
  serviceType?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
}

// === TYPES NOTIFICATION TYPE ===
export type NotificationUIType = 'info' | 'success' | 'warning' | 'error';

// === TYPES THEME ===
export type Theme = 'light' | 'dark' | 'system';

// === TYPES API GEO ===
export interface ApiGeo {
  name: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
}

// === TYPES HEALTH SERVICE ===
export interface HealthService {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  currency: string;
  category: 'CONSULTATION' | 'TREATMENT' | 'EMERGENCY';
  isActive: boolean;
  searchProviders: () => Promise<any[]>;
  getProvider: (id: string) => Promise<any>;
  checkAvailability: (providerId: string, date: Date) => Promise<boolean>;
  bookAppointment: (data: any) => Promise<any>;
  cancelAppointment: (id: string) => Promise<void>;
  rescheduleAppointment: (id: string, newDate: Date) => Promise<void>;
  getAppointmentHistory: (patientId: string) => Promise<any[]>;
  getProviderSchedule: (providerId: string) => Promise<any[]>;
  sendReminder: (appointmentId: string) => Promise<void>;
}

// === TYPES ATTENDANCE ===
export interface Attendance {
  id: string;
  studentId: string;
  courseId: string;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  recordedBy: string;
  notes: string;
}

// === TYPES EMAIL QUEUE ITEM ===
export interface EmailQueueItem {
  id: string;
  type: string;
  to: string;
  data: any;
  priority: 'high' | 'normal' | 'low';
  scheduledAt: Date;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'sent' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

// === TYPES PAYMENT METHOD ===
export interface PaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  sepa_debit?: {
    last4: string;
    bank_code: string;
  };
  isDefault: boolean;
  createdAt: Date;
}

// === TYPES DATA SUBJECT REQUEST ===
export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'ACCESS' | 'PORTABILITY' | 'ERASURE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';
  requestedAt: Date;
  reason: string;
}

// === TYPES PCI AUDIT LOG ===
export interface PCIAuditLog {
  id: string;
  timestamp: Date;
  event: string;
  userId: string;
  transactionId?: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details: Record<string, any>;
  complianceStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'REVIEW_REQUIRED';
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

// Réexport groupé supprimé: tous les symboles sont déjà exportés ci-dessus
