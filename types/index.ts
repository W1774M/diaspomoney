// ============================================================================
// TYPES DE BASE
// ============================================================================

export type Theme = "light" | "dark" | "system";
export type NotificationType = "success" | "error" | "info" | "warning";

// Types d'énumération
export type UserRole = "ADMIN" | "PROVIDER" | "CUSTOMER" | "CSM";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "SUSPENDED";
export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type ProviderGroup = "sante" | "edu" | "immo";

// ============================================================================
// CONSTANTES D'ÉNUMÉRATION
// ============================================================================

export const APPOINTMENT_STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "confirmed", label: "Confirmé" },
  { value: "cancelled", label: "Annulé" },
  { value: "completed", label: "Terminé" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "pending", label: "En attente" },
  { value: "paid", label: "Payé" },
  { value: "failed", label: "Échoué" },
  { value: "refunded", label: "Remboursé" },
] as const;

export const SERVICE_TYPES = [
  { id: 1, name: "Consultation médicale" },
  { id: 2, name: "Formation professionnelle" },
  { id: 3, name: "Service immobilier" },
  { id: 4, name: "Conseil juridique" },
  { id: 5, name: "Service informatique" },
] as const;

export const SPECIALITY_TYPES = [
  { id: 1, name: "Médecine", group: "sante" as const },
  { id: 2, name: "Droit", group: "edu" as const },
  { id: 3, name: "Immobilier", group: "immo" as const },
  { id: 4, name: "Éducation", group: "edu" as const },
  { id: 5, name: "Finance", group: "sante" as const },
  { id: 6, name: "Informatique", group: "edu" as const },
  { id: 7, name: "Construction", group: "immo" as const },
  { id: 8, name: "Coaching", group: "edu" as const },
  { id: 9, name: "Consulting", group: "sante" as const },
  { id: 10, name: "Polyvalent", group: "sante" as const },
] as const;

export const INVOICE_STATUSES = [
  { value: "DRAFT", label: "Brouillon" },
  { value: "SENT", label: "Envoyée" },
  { value: "PAID", label: "Payée" },
  { value: "OVERDUE", label: "En retard" },
  { value: "CANCELLED", label: "Annulée" },
] as const;

export const USER_ROLES = [
  { value: "ADMIN", label: "Administrateur" },
  { value: "PROVIDER", label: "Prestataire" },
  { value: "CUSTOMER", label: "Client" },
  { value: "CSM", label: "CSM" },
] as const;

export const USER_STATUSES = [
  { value: "ACTIVE", label: "Actif" },
  { value: "INACTIVE", label: "Inactif" },
  { value: "PENDING", label: "En attente" },
  { value: "SUSPENDED", label: "Suspendu" },
] as const;

// ============================================================================
// INTERFACES DE BASE
// ============================================================================

export interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INTERFACES API
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// INTERFACES STORE (ZUSTAND)
// ============================================================================

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

export interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

export interface AuthState {
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  login: (email: string, password: string) => Promise<boolean>;
}

// ============================================================================
// INTERFACES DOMAINE
// ============================================================================

export interface Service {
  id?: number;
  name: string;
  price: number;
}

export interface ServiceType {
  id?: number;
  name: string;
}

export interface ProviderType {
  id: string | number;
  value: string;
  group: ProviderGroup;
}

export interface ApiGeoLocation {
  country_code: any;
  country: any;
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: string[];
}

// Alias pour compatibilité
export type ApiGeo = ApiGeoLocation;

// ============================================================================
// INTERFACE USER UNIFIÉE
// ============================================================================

export interface IUser extends BaseDocument {
  price: number;
  id: string;
  email: string;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
  roles: UserRole[];
  status: UserStatus;
  // Champs spécifiques aux prestataires
  specialty?: string;
  recommended?: boolean;
  apiGeo?: ApiGeoLocation[];
  // Champs spécifiques aux clients
  clientNotes?: string;
  // Champs communs
  avatar?: {
    image: string;
    name: string;
  };
  preferences?: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
  // Champs d'authentification
  password?: string;
  emailVerified?: boolean;
  image?: string;
  // Champs hérités de l'ancienne interface User
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  countryOfResidence?: string;
  targetCountry?: string;
  targetCity?: string;
  selectedServices?: string;
  monthlyBudget?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  marketingConsent?: boolean;
  kycConsent?: boolean;
  isEmailVerified?: boolean;
  lastLogin?: Date;
  oauth?: {
    google?: {
      linked: boolean;
      providerAccountId?: string;
    };
    facebook?: {
      linked: boolean;
      providerAccountId?: string;
    };
  };
  // Champs pour les prestataires (alias pour compatibilité)
  services?: Service[];
  availability?: Availability[];
  rating?: number;
  reviewCount?: number;
  isVerified?: boolean;
  isRecommended?: boolean;
  location?: ApiGeoLocation;
  contactInfo?: {
    phone: string;
    email: string;
    website?: string;
  };
  type?: ProviderType;
  images?: string[];
  reviews?: number;
  distance?: string;
  availabilities?: string[];
  comparePassword?(candidatePassword: string): Promise<boolean>;
  appointmentsAsProvider?: IAppointment[];
}

// Types d'entrée pour User
export interface CreateUserInput {
  email: string;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
  roles: UserRole[];
  status?: UserStatus;
  specialty?: string;
  recommended?: boolean;
  apiGeo?: ApiGeoLocation[];
  clientNotes?: string;
  avatar?: string;
  preferences?: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
  password?: string;
  // Champs hérités
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  countryOfResidence?: string;
  targetCountry?: string;
  targetCity?: string;
  selectedServices?: string;
  monthlyBudget?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  marketingConsent?: boolean;
  kycConsent?: boolean;
}

export type UpdateUserInput = Partial<CreateUserInput>;

// ============================================================================
// INTERFACES APPOINTMENT
// ============================================================================

export interface IAppointment extends BaseDocument {
  userId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string;
  status: AppointmentStatus;
  notes?: string;
  price: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentId?: string;
  cancellationReason?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  // Champs hérités de l'ancienne interface Appointment
  reservationNumber?: string;
  requester?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  provider?: {
    id: string | number;
    name: string;
    services: Service[];
    type: ProviderType;
    specialty: string;
    recommended: boolean;
    apiGeo: ApiGeoLocation[];
    images: string[];
    rating: number;
    reviews?: number;
    distance?: string;
  };
  selectedService?: Service | null;
  timeslot?: string;
  totalAmount?: number;
}

export interface CreateAppointmentInput {
  userId: string;
  providerId: string;
  serviceId: string;
  date: Date;
  time: string;
  notes?: string;
  price: number;
  // Champs hérités
  reservationNumber?: string;
  requester?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  recipient?: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  selectedService?: Service | null;
  timeslot?: string;
  totalAmount?: number;
}

export type UpdateAppointmentInput = Partial<CreateAppointmentInput>;

// ============================================================================
// INTERFACES AVAILABILITY
// ============================================================================

export interface Availability {
  day: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

// Alias pour compatibilité - Provider est maintenant un User avec le rôle PROVIDER
export type IProvider = IUser;
export type CreateProviderInput = CreateUserInput;
export type UpdateProviderInput = UpdateUserInput;

// ============================================================================
// INTERFACES INVOICE
// ============================================================================

export interface IInvoice extends BaseDocument {
  invoiceNumber: string;
  customerId: string;
  providerId?: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  items: InvoiceItem[];
  notes?: string;
  userId: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateInvoiceInput {
  customerId: string;
  providerId?: string;
  amount: number;
  currency: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  notes?: string;
  userId: string;
}

export type UpdateInvoiceInput = Partial<CreateInvoiceInput>;

// ============================================================================
// INTERFACES PROJECT
// ============================================================================

export interface IProject extends BaseDocument {
  name: string;
  description: string;
  customerId: string;
  providerId?: string;
  status: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  budget: number;
  currency: string;
  tasks: string[]; // IDs des tâches
  userId: string;
}

export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED";

export interface CreateProjectInput {
  name: string;
  description: string;
  customerId: string;
  providerId?: string;
  status?: ProjectStatus;
  startDate: Date;
  endDate?: Date;
  budget: number;
  currency: string;
  userId: string;
}

export type UpdateProjectInput = Partial<CreateProjectInput>;

// ============================================================================
// INTERFACES TASK
// ============================================================================

export interface ITask extends BaseDocument {
  title: string;
  description: string;
  projectId: string;
  assignedTo?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedAt?: Date;
  userId: string;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface CreateTaskInput {
  title: string;
  description: string;
  projectId: string;
  assignedTo?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  userId: string;
}

export type UpdateTaskInput = Partial<CreateTaskInput>;

// ============================================================================
// INTERFACES CLIENT
// ============================================================================

export interface IClient extends BaseDocument {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status: ClientStatus;
  notes?: string;
  userId: string;
}

export type ClientStatus = "ACTIVE" | "INACTIVE" | "PROSPECT";

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status?: ClientStatus;
  notes?: string;
  userId: string;
}

export type UpdateClientInput = Partial<CreateClientInput>;

// ============================================================================
// INTERFACES TOKENS
// ============================================================================

export interface IEmailVerificationToken extends BaseDocument {
  email: string;
  token: string;
  expires: Date;
  used?: boolean;
}

export interface IPasswordResetToken extends BaseDocument {
  email: string;
  token: string;
  expires: Date;
  used?: boolean;
}

export interface IRetryToken extends BaseDocument {
  email: string;
  token: string;
  type: "email_verification" | "password_reset";
  expires: Date;
  used?: boolean;
  appointmentId?: string;
}

// ============================================================================
// INTERFACES SPECIALITY
// ============================================================================

export interface ISpeciality extends BaseDocument {
  name: string;
  description: string;
  group: ProviderGroup;
  isActive: boolean;
}

export interface SpecialityType {
  id?: number;
  name: string;
  type: ServiceType;
}

// ============================================================================
// INTERFACES REVIEW
// ============================================================================

export interface IReview extends BaseDocument {
  author: string;
  text: string;
}

// ============================================================================
// INTERFACES FRONTEND
// ============================================================================

export interface ServicesButtonProps {
  setActiveView?: (view: string, serviceType?: string) => void;
  label?: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  serviceType?: string;
  onClick?: () => void;
}

export interface ProviderCardProps {
  provider: IUser;
  onDetails: () => void;
}

export interface FiltersProps {
  specialties: string[];
  filterSpecialty: string;
  setFilterSpecialty: (value: string) => void;
  providerTypes: { id: string | number; value: string }[];
  selectedTypes: string[];
  setSelectedTypes: (value: string[]) => void;
  filters: { priceMin: number; priceMax: number };
  setFilters: (filters: { priceMin: number; priceMax: number }) => void;
  resetFilters: () => void;
}

export interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export interface SearchBarProps {
  availableServices: string[];
  selectedService: string;
  setSelectedService: (value: string) => void;
  countries: string[];
  selectedCountry: string;
  setSelectedCountry: (value: string) => void;
  selectedCity: string;
  setSelectedCity: (value: string) => void;
}

export interface AppointmentData {
  requester: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  recipient: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  provider: IUser;
  selectedService: Service | null;
  timeslot: string;
}

export interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

// ============================================================================
// INTERFACES HOOKS
// ============================================================================

export interface UseProvidersOptions {
  type?: string;
  group?: string;
  specialty?: string;
  service?: string;
  country?: string;
  city?: string;
  priceMax?: number;
  recommended?: boolean;
  sortBy?: string;
}

export interface UseProvidersReturn {
  providers: IUser[];
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

export interface AppointmentListItem {
  id: string;
  reservationNumber: string;
  provider: {
    name: string;
    specialty: string;
    location: string;
  };
  service: {
    name: string;
    price: number;
  } | null;
  timeslot: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UseAppointmentsReturn {
  appointments: AppointmentListItem[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// ============================================================================
// INTERFACES NEXT-AUTH
// ============================================================================

export interface NextAuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    isEmailVerified: boolean;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export interface NextAuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isEmailVerified: boolean;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface NextAuthJWT {
  id: string;
  role: string;
  isEmailVerified: boolean;
  firstName: string;
  lastName: string;
  phone?: string;
}

// ============================================================================
// INTERFACES CONFIGURATION
// ============================================================================

export interface Config {
  database: {
    uri: string;
  };
  auth: {
    secret: string;
    jwtSecret: string;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  app: {
    url: string;
  };
}

// ============================================================================
// INTERFACES COMPOSANTS
// ============================================================================

export interface ModalPaymentProps {
  appointment: AppointmentData;
  setModalOpen?: (open: boolean) => void;
  setSteps?: (step: number) => void;
}

export interface ThemeProviderProps {
  children: React.ReactNode;
}

export interface ModalSelectServiceProps {
  provider: IUser;
  onServiceSelect: (service: Service) => void;
  onClose: () => void;
}

export interface ModalPreviewProps {
  appointment: AppointmentData;
  paymentData: PaymentData;
  onFinalValidation?: () => void;
  setSteps?: (step: number) => void;
}

export interface ModalIndicatorProps {
  isVisible: boolean;
  onClose: () => void;
}

export interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export interface ModalImageProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface AppointmentProviderProps {
  children: React.ReactNode;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export interface FormProps extends React.ComponentPropsWithoutRef<"form"> {
  onSubmit: (e: React.FormEvent) => void;
}

export interface FormFieldProps extends React.ComponentPropsWithoutRef<"div"> {
  error?: string;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  isLoading?: boolean;
}

export interface GoogleLoginButtonProps {
  onSuccess?: (response: unknown) => void;
  onError?: (error: unknown) => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function isAdmin(user: IUser | null): boolean {
  return user?.roles.includes("ADMIN") || false;
}

export function isProvider(user: IUser | null): boolean {
  return user?.roles.includes("PROVIDER") || false;
}

export function isCustomer(user: IUser | null): boolean {
  return user?.roles.includes("CUSTOMER") || false;
}

export function isCSM(user: IUser | null): boolean {
  return user?.roles.includes("CSM") || false;
}

export function hasRole(user: IUser | null, role: UserRole): boolean {
  return user?.roles.includes(role) || false;
}

export function hasAnyRole(user: IUser | null, roles: UserRole[]): boolean {
  return user?.roles.some(role => roles.includes(role)) || false;
}

// ============================================================================
// TYPES POUR LES DISPONIBILITÉS
// ============================================================================

export interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0 = Dimanche, 1 = Lundi, etc.
  startTime: string; // Format HH:MM
  endTime: string; // Format HH:MM
  isActive: boolean;
}

export interface AvailabilityRule {
  id: string;
  name: string;
  type: "weekly" | "monthly" | "custom";
  isActive: boolean;
  providerId: string;
  createdAt: Date;
  updatedAt: Date;
  startDate?: string; // Pour les règles mensuelles et personnalisées
  endDate?: string; // Pour les règles mensuelles et personnalisées
  timeSlots: TimeSlot[];
}
