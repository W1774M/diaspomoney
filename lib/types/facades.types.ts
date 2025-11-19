/**
 * Types pour les facades
 * Définit les types pour les facades (FacadeData, FacadeResult patterns)
 */

/**
 * Données d'entrée d'une facade
 */
export interface FacadeData {
  /**
   * ID de l'utilisateur qui effectue l'action
   */
  userId?: string;

  /**
   * Métadonnées supplémentaires
   */
  metadata?: Record<string, any>;
}

/**
 * Résultat d'une facade
 */
export interface FacadeResult<T = any> {
  /**
   * Succès de l'opération
   */
  success: boolean;

  /**
   * Données de résultat
   */
  data?: T;

  /**
   * Message
   */
  message?: string;

  /**
   * Erreur
   */
  error?: string;

  /**
   * Code d'erreur
   */
  errorCode?: string;

  /**
   * Métadonnées
   */
  metadata?: Record<string, any>;

  /**
   * Timestamp
   */
  timestamp?: Date;
}

/**
 * Options d'exécution d'une facade
 */
export interface FacadeOptions {
  /**
   * Valider les données d'entrée
   */
  validate?: boolean;

  /**
   * Logger l'exécution
   */
  log?: boolean;

  /**
   * Timeout (ms)
   */
  timeout?: number;

  /**
   * Retry en cas d'échec
   */
  retry?: {
    maxAttempts: number;
    delay: number;
  };

  /**
   * Options supplémentaires
   */
  options?: Record<string, any>;
}

/**
 * Interface de base pour une facade
 */
export interface IFacade<TData extends FacadeData, TResult = any> {
  /**
   * Exécuter la facade
   */
  execute(data: TData, options?: FacadeOptions): Promise<FacadeResult<TResult>>;
}

/**
 * Données pour la facade de réservation
 */
export interface BookingFacadeData extends FacadeData {
  /**
   * ID du demandeur
   */
  requesterId: string;

  /**
   * ID du provider
   */
  providerId: string;

  /**
   * ID du service
   */
  serviceId: string;

  /**
   * Type de service
   */
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';

  /**
   * Date de rendez-vous
   */
  appointmentDate: Date;

  /**
   * Créneau horaire
   */
  timeslot?: string;

  /**
   * Mode de consultation
   */
  consultationMode?: 'IN_PERSON' | 'TELEMEDICINE' | 'HYBRID';

  /**
   * Bénéficiaire
   */
  recipient?: string;

  /**
   * Données de paiement
   */
  payment?: {
    amount: number;
    currency: string;
    paymentMethodId: string;
    createInvoice?: boolean;
  };
}

/**
 * Résultat de la facade de réservation
 */
export interface BookingFacadeResult extends FacadeResult {
  /**
   * Réservation créée
   */
  booking?: any; // Booking

  /**
   * Résultat du paiement
   */
  paymentResult?: {
    success: boolean;
    paymentIntentId?: string;
    transactionId?: string;
  };

  /**
   * Notification envoyée
   */
  notificationSent?: boolean;
}

/**
 * Données pour la facade de paiement
 */
export interface PaymentFacadeData extends FacadeData {
  /**
   * Montant
   */
  amount: number;

  /**
   * Devise
   */
  currency: string;

  /**
   * ID du client
   */
  customerId: string;

  /**
   * ID de la méthode de paiement
   */
  paymentMethodId: string;

  /**
   * ID du payeur
   */
  payerId: string;

  /**
   * ID du bénéficiaire
   */
  beneficiaryId: string;

  /**
   * Type de service
   */
  serviceType: 'HEALTH' | 'BTP' | 'EDUCATION';

  /**
   * ID du service
   */
  serviceId: string;

  /**
   * Description
   */
  description: string;

  /**
   * Créer une facture automatiquement
   */
  createInvoice?: boolean;

  /**
   * Envoyer une notification automatiquement
   */
  sendNotification?: boolean;

  /**
   * Métadonnées
   */
  metadata?: Record<string, string>;
}

/**
 * Résultat de la facade de paiement
 */
export interface PaymentFacadeResult extends FacadeResult {
  /**
   * ID du payment intent
   */
  paymentIntentId?: string;

  /**
   * ID de la transaction
   */
  transactionId?: string;

  /**
   * ID de la facture
   */
  invoiceId?: string;

  /**
   * Nécessite une action (3D Secure, etc.)
   */
  requiresAction?: boolean;

  /**
   * Prochaine action à effectuer
   */
  nextAction?: {
    type: string;
    url: string;
  };
}

/**
 * Données pour la facade de facture
 */
export interface InvoiceFacadeData extends FacadeData {
  /**
   * ID de l'utilisateur
   */
  userId: string;

  /**
   * Montant
   */
  amount: number;

  /**
   * Devise
   */
  currency: string;

  /**
   * Taxe
   */
  tax?: number;

  /**
   * Items de la facture
   */
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  /**
   * ID de transaction
   */
  transactionId?: string;

  /**
   * ID de réservation
   */
  bookingId?: string;

  /**
   * Date d'échéance
   */
  dueDate?: Date;

  /**
   * Adresse de facturation
   */
  billingAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };

  /**
   * Envoyer la facture par email
   */
  sendEmail?: boolean;

  /**
   * Envoyer une notification
   */
  sendNotification?: boolean;

  /**
   * Email du destinataire
   */
  recipientEmail?: string;

  /**
   * Métadonnées
   */
  metadata?: Record<string, any>;
}

/**
 * Résultat de la facade de facture
 */
export interface InvoiceFacadeResult extends FacadeResult {
  /**
   * Facture créée
   */
  invoice?: any; // Invoice

  /**
   * Email envoyé
   */
  emailSent?: boolean;
}

/**
 * Données pour la facade de réclamation
 */
export interface ComplaintFacadeData extends FacadeData {
  /**
   * ID de l'utilisateur
   */
  userId: string;

  /**
   * Type de réclamation
   */
  type: string;

  /**
   * Priorité
   */
  priority: string;

  /**
   * Sujet
   */
  subject: string;

  /**
   * Description
   */
  description: string;

  /**
   * Métadonnées
   */
  metadata?: Record<string, any>;
}

/**
 * Résultat de la facade de réclamation
 */
export interface ComplaintFacadeResult extends FacadeResult {
  /**
   * Réclamation créée
   */
  complaint?: any; // Complaint

  /**
   * Notification envoyée
   */
  notificationSent?: boolean;
}

/**
 * Données pour la facade de bénéficiaire
 */
export interface BeneficiaryFacadeData extends FacadeData {
  /**
   * ID de l'utilisateur
   */
  userId: string;

  /**
   * Nom
   */
  name: string;

  /**
   * Email
   */
  email?: string;

  /**
   * Téléphone
   */
  phone?: string;

  /**
   * Relation
   */
  relationship?: string;

  /**
   * Métadonnées
   */
  metadata?: Record<string, any>;
}

/**
 * Résultat de la facade de bénéficiaire
 */
export interface BeneficiaryFacadeResult extends FacadeResult {
  /**
   * Bénéficiaire créé
   */
  beneficiary?: any; // Beneficiary

  /**
   * Notification envoyée
   */
  notificationSent?: boolean;
}

/**
 * Configuration d'une facade
 */
export interface FacadeConfig {
  /**
   * Nom de la facade
   */
  name: string;

  /**
   * Services utilisés
   */
  services: string[];

  /**
   * Validation activée
   */
  validate?: boolean;

  /**
   * Logging activé
   */
  log?: boolean;

  /**
   * Timeout par défaut (ms)
   */
  defaultTimeout?: number;
}

/**
 * Erreur de facade
 */
export interface FacadeError {
  /**
   * Code d'erreur
   */
  code: string;

  /**
   * Message d'erreur
   */
  message: string;

  /**
   * Service en erreur
   */
  service?: string;

  /**
   * Détails
   */
  details?: Record<string, any>;
}

