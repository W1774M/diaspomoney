/**
 * Types et interfaces pour les paiements - DiaspoMoney
 */

/**
 * Payment Intent (Stripe)
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
 * Provider de paiement
 */
export type PaymentProvider = 'STRIPE' | 'PAYPAL' | 'MOBILE_MONEY';

/**
 * Résultat d'un paiement
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
 * Reçu de paiement
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

// === TYPES COMPOSANTS PAIEMENTS ===

/**
 * Props pour le composant PaymentReceiptCard
 */
export interface PaymentReceiptCardProps {
  receipt: PaymentReceipt;
  onView?: (receipt: PaymentReceipt) => void;
  onDownload?: (receipt: PaymentReceipt) => void;
}

/**
 * Props pour le composant PaymentReceiptFilters
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

/**
 * Props pour le composant PaymentStats
 */
export interface PaymentStatsProps {
  totalPaid: number;
  pendingCount: number;
  receiptsCount: number;
  currency?: string;
}

// === TYPES UI PAIEMENTS ===

/**
 * Méthode de paiement UI
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
 * Adresse de facturation UI
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
