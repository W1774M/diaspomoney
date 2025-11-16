/**
 * Types et interfaces pour l'authentification
 */

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country: string;
  dateOfBirth?: string;
  targetCountry?: string;
  targetCity?: string;
  monthlyBudget?: string;
  securityQuestion?: string;
  securityAnswer?: string;
  termsAccepted: boolean;
  marketingConsent?: boolean;
  selectedServices?: string;
  oauth?: {
    provider: string;
    providerAccountId: string;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  kycStatus: string;
}

/**
 * Utilisateur authentifié (pour le middleware)
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TwoFactorData {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}
