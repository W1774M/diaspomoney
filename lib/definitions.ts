// ============================================================================
// TYPES DE BASE
// ============================================================================

export type Theme = "light" | "dark" | "system";

export type NotificationType = "success" | "error" | "info" | "warning";

export type UserRole = "user" | "admin";

export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type ProviderGroup = "sante" | "edu" | "immo";

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
// INTERFACES DOMAINE (MONGODB/MONGOOSE)
// ============================================================================

export interface Service {
  id?: number;
  name: string;
  price: number;
}

export interface ProviderType {
  id: string | number;
  value: string;
  group: ProviderGroup;
}

export interface ApiGeo {
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

export interface Provider {
  id: string | number;
  name: string;
  type: ProviderType;
  specialty: string;
  recommended: boolean;
  apiGeo: ApiGeo[];
  images: string[];
  rating: number;
  reviews?: number;
  distance?: string;
  services: Service[];
  description: string;
  phone: string;
  email: string;
  website: string;
  availabilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface Appointment {
  reservationNumber: string;
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
  provider: {
    id: string | number;
    name: string;
    services: Service[];
    type: ProviderType;
    specialty: string;
    recommended: boolean;
    apiGeo: ApiGeo[];
    images: string[];
    rating: number;
    reviews?: number;
    distance?: string;
  };
  selectedService: Service | null;
  timeslot: string;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailVerificationToken {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface PasswordResetToken {
  email: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface RetryToken {
  token: string;
  appointmentId: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

// ============================================================================
// INTERFACES FRONTEND
// ============================================================================

export interface ProviderCardProps {
  provider: Provider;
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
  provider: Provider;
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
  providers: Provider[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UseProviderReturn {
  provider: Provider | null;
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
  provider: Provider;
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

export interface ServicesButtonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export interface GoogleLoginButtonProps {
  onSuccess?: (response: unknown) => void;
  onError?: (error: unknown) => void;
}
