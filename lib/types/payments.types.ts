import { Appointment, BaseEntity } from ".";

/**
 * ================================
 *    TYPES & INTERFACES PAIEMENTS
 * ================================
 */

/** ========== DOMAIN MODELS ========== */

/**
 * Données nécessaires à l'initiation d'un paiement (app générique)
 */
export interface PaymentData {
  amount: number;
  currency: string;
  paymentMethod?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

/**
 * Providers de paiement supportés
 */
export type PaymentProvider = 'STRIPE' | 'PAYPAL' | 'MOBILE_MONEY';

/**
 * Représentation d'une méthode de paiement enregistrée (générique/local)
 */
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

/**
 * Statistiques de paiements pour la vue dashboard/ui
 */
export interface PaymentStatsProps {
  totalPaid: number;
  pendingCount: number;
  receiptsCount: number;
  currency?: string;
}

/** ========== STRIPE-LIKE MODELS & RESPONSES ========== */

/**
 * Intent de paiement (Stripe)
 */
export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'succeeded'
    | 'canceled';
  clientSecret: string;
  paymentMethod?: string;
  metadata: Record<string, string>;
}

/**
 * Méthode de paiement Stripe
 */
export interface StripePaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'sepa_debit';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  billingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

/**
 * Résultat d'un paiement (après tentative, succès ou échec)
 */
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
  requiresAction?: boolean;
  nextAction?: {
    type: string;
    url?: string;
    data?: any;
  };
  metadata?: Record<string, any>;
}

/**
 * Reçu/détail d'une transaction de paiement
 */
export interface PaymentReceipt {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  service: string;
  provider: string;
  date: string;
  description: string;
  downloadUrl: string;
}

/** ========== UI MODELS ========== */

/**
 * Méthode de paiement pour le UI (liste des cartes/paypal en compte, etc.)
 */
export interface UIPaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  expiryDate?: string;
  isDefault: boolean;
  isVerified?: boolean;
  name?: string;
  email?: string;
}

/**
 * Adresse de facturation dans l'UI
 */
export interface UIBillingAddress {
  id: string;
  name?: string;
  address: string;
  street?: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  isVerified: boolean;
}

/**
 * Solde du compte UI
 */
export interface UIAccountBalance {
  available: number;
  currency: string;
  lastUpdated: Date;
}

/** ========== Props des composants UI PAIMENTS ========== */

/**
 * Props pour le composant carte de reçu de paiement
 */
export interface PaymentReceiptCardProps {
  receipt: PaymentReceipt;
  onView?: (receipt: PaymentReceipt) => void;
  onDownload?: (receipt: PaymentReceipt) => void;
}

/**
 * Props pour le composant filters de liste de paiements/reçus
 */
export interface PaymentReceiptFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sortBy: 'date' | 'amount' | 'service';
  onSortByChange: (value: 'date' | 'amount' | 'service') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (value: 'asc' | 'desc') => void;
}

/** ========== MODAL ========== */

/**
 * Props pour le modal de paiement (paiement d'un rendez-vous, etc.)
 */
export interface ModalPaymentProps {
  appointment: Appointment;
  setModalOpen: (open: boolean) => void;
  setSteps: (step: number) => void;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export type PaymentMethodType = 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'PAYPAL' | 'STRIPE';

export interface Payment extends BaseEntity {
  userId: string;
  transactionId: string;
  amount: number;
  currency: string;
  method: PaymentMethodType;
  status: PaymentStatus;
  paymentIntentId: string;
  clientSecret?: string;
  metadata?: Record<string, any>;
}