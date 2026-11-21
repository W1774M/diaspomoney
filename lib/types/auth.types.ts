/**
 * Types et interfaces pour l'authentification
 */

import { User } from ".";

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
  // Champs optionnels utiles côté UI/tests (ex: retour de /api/auth/register)
  firstName?: string;
  lastName?: string;
  name?: string;
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