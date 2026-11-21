/**
 * Service Registry - Configuration de l'injection de dépendances
 * 
 * Enregistre tous les services et leurs dépendances dans le conteneur
 */

import { getBookingRepository, getInvoiceRepository, getTransactionRepository, getUserRepository } from '@/repositories';
import { BookingService } from '@/services/booking/booking.service';
import { EmailService } from '@/services/email/email.service';
import { InvoiceService } from '@/services/invoice/invoice.service';
import { NotificationService } from '@/services/notification/notification.service';
import { PaymentService } from '@/services/payment/payment.service';
import { TransactionService } from '@/services/transaction/transaction.service';
import { UserService } from '@/services/user/user.service';
import { serviceContainer } from './service-container';

/**
 * Clés de service pour l'injection de dépendances
 */
export const ServiceKeys = {
  // Repositories
  BookingRepository: Symbol('BookingRepository'),
  InvoiceRepository: Symbol('InvoiceRepository'),
  TransactionRepository: Symbol('TransactionRepository'),
  UserRepository: Symbol('UserRepository'),

  // Services
  BookingService: Symbol('BookingService'),
  EmailService: Symbol('EmailService'),
  InvoiceService: Symbol('InvoiceService'),
  NotificationService: Symbol('NotificationService'),
  PaymentService: Symbol('PaymentService'),
  TransactionService: Symbol('TransactionService'),
  UserService: Symbol('UserService'),
} as const;

/**
 * Initialiser le registre de services
 */
export function initializeServiceRegistry(): void {
  // Enregistrer les repositories
  serviceContainer.register(ServiceKeys.BookingRepository, () => getBookingRepository());
  serviceContainer.register(ServiceKeys.InvoiceRepository, () => getInvoiceRepository());
  serviceContainer.register(ServiceKeys.TransactionRepository, () => getTransactionRepository());
  serviceContainer.register(ServiceKeys.UserRepository, () => getUserRepository());

  // Enregistrer les services avec leurs dépendances
  serviceContainer.register(ServiceKeys.NotificationService, () => {
    return NotificationService.getInstance();
  });

  serviceContainer.register(ServiceKeys.EmailService, () => {
    return new EmailService({
      from: process.env['FROM_EMAIL'] || 'noreply@diaspomoney.fr',
      replyTo: process.env['REPLY_TO_EMAIL'] || 'noreply@diaspomoney.fr',
      enabled: !!process.env['RESEND_API_KEY'],
    });
  });

  serviceContainer.register(ServiceKeys.PaymentService, () => {
    return PaymentService.getInstance();
  });

  serviceContainer.register(ServiceKeys.TransactionService, () => {
    return TransactionService.getInstance();
  });

  serviceContainer.register(ServiceKeys.UserService, () => {
    return UserService.getInstance();
  });

  serviceContainer.register(ServiceKeys.BookingService, () => {
    return BookingService.getInstance();
  });

  serviceContainer.register(ServiceKeys.InvoiceService, () => {
    return InvoiceService.getInstance();
  });
}

/**
 * Obtenir un service depuis le conteneur
 */
export function getService<T>(key: symbol): T {
  return serviceContainer.resolve<T>(key);
}

