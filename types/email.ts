/**
 * Types email - DiaspoMoney
 */

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

export interface EmailServiceConfig {
  from: string;
  replyTo?: string;
  enabled: boolean;
}

// === TYPES TEMPLATES ===
export interface WelcomeEmailData {
  name: string;
  verificationUrl: string;
}

export interface PasswordResetEmailData {
  name: string;
  resetUrl: string;
}

export interface PaymentConfirmationEmailData {
  name: string;
  amount: number;
  currency: string;
  service: string;
}

export interface AppointmentNotificationEmailData {
  name: string;
  provider: string;
  date: string;
  time: string;
  type: 'confirmation' | 'reminder';
}

export interface CustomEmailData {
  subject: string;
  html: string;
  text?: string;
  tags?: Array<{ name: string; value: string }>;
}

// === TYPES DE REQUÊTES ===
export interface SendEmailRequest {
  type: EmailType;
  to: string;
  data: any;
}

export enum EmailType {
  WELCOME = 'welcome',
  PASSWORD_RESET = 'password_reset',
  PAYMENT_CONFIRMATION = 'payment_confirmation',
  APPOINTMENT_NOTIFICATION = 'appointment_notification',
  CUSTOM = 'custom'
}

// === TYPES DE RÉPONSES ===
export interface EmailResponse {
  success: boolean;
  message: string;
  emailId?: string;
}

export interface EmailStatusResponse {
  service: string;
  status: string;
  connection: string;
  queue: {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  };
  timestamp: string;
}

// === TYPES STATISTIQUES ===
export interface EmailStats {
  total: number;
  pending: number;
  processing: number;
  sent: number;
  failed: number;
}

export interface EmailMetrics {
  sentToday: number;
  sentThisWeek: number;
  sentThisMonth: number;
  successRate: number;
  averageDeliveryTime: number;
}
