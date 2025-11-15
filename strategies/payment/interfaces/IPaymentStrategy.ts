/**
 * Interface pour les stratégies de paiement
 * Définit le contrat que toutes les stratégies de paiement doivent respecter
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

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  error?: string;
}

export interface PaymentData {
  amount: number;
  currency: string;
  customerId: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface RefundData {
  transactionId: string;
  amount?: number | undefined; // Si non spécifié, rembourse le montant total
  reason?: string | undefined;
  metadata?: Record<string, string> | undefined;
}

/**
 * Interface principale pour les stratégies de paiement
 */
export interface IPaymentStrategy {
  /**
   * Nom du provider (ex: 'STRIPE', 'PAYPAL')
   */
  readonly name: string;

  /**
   * Devises supportées
   */
  readonly supportedCurrencies: string[];

  /**
   * Pays supportés
   */
  readonly supportedCountries: string[];

  /**
   * Traiter un paiement
   */
  processPayment(data: PaymentData): Promise<PaymentResult>;

  /**
   * Créer un Payment Intent (pour les paiements en deux étapes)
   */
  createPaymentIntent(data: PaymentData): Promise<PaymentResult>;

  /**
   * Confirmer un Payment Intent
   */
  confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<PaymentResult>;

  /**
   * Rembourser une transaction
   */
  refund(data: RefundData): Promise<RefundResult>;

  /**
   * Vérifier le statut d'une transaction
   */
  getTransactionStatus(transactionId: string): Promise<PaymentResult>;

  /**
   * Valider si le provider peut traiter ce paiement
   */
  canProcess(data: PaymentData): boolean;
}

