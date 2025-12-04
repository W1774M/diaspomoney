/**
 * Tests unitaires pour PaymentFacade
 * 
 * Implémente les tests pour :
 * - processPayment (méthode principale via execute())
 * - Intégration avec Stripe (PaymentService), TransactionService, InvoiceService, NotificationService
 * - Gestion des paiements 3D Secure
 * - Gestion des erreurs de paiement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { paymentFacade } from '@/facades/payment.facade';
import type { PaymentFacadeData } from '@/lib/types';

// Mock des dépendances - hoisted pour être disponible dans vi.mock()
const { mockPaymentServiceInstance } = vi.hoisted(() => {
  const mockInstance = {
    createPaymentIntent: vi.fn(),
    confirmPaymentIntent: vi.fn(),
    getTransactionStatus: vi.fn(),
    cancelPaymentIntent: vi.fn(),
    refundPayment: vi.fn(),
  };
  return { mockPaymentServiceInstance: mockInstance };
});

vi.mock('@/services/payment/payment.service', () => ({
  PaymentService: {
    getInstance: vi.fn(() => mockPaymentServiceInstance),
  },
}));

vi.mock('@/services/transaction/transaction.service');
vi.mock('@/services/invoice/invoice.service');
vi.mock('@/services/notification/notification.service');
vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('PaymentFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockPaymentData = (overrides?: Partial<PaymentFacadeData>): PaymentFacadeData => ({
    amount: 100.50,
    currency: 'EUR',
    customerId: 'customer123',
    paymentMethodId: 'pm_test123',
    payerId: 'payer123',
    beneficiaryId: 'beneficiary123',
    serviceType: 'HEALTH',
    serviceId: 'service123',
    description: 'Payment for service',
    createInvoice: true,
    sendNotification: true,
    ...overrides,
  });

  describe('processPayment (via execute)', () => {
    it('devrait traiter un paiement avec succès', async () => {
      const paymentData = createMockPaymentData();

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const mockTransaction = {
        _id: 'trans123',
        id: 'trans123',
        payerId: paymentData.payerId,
        beneficiaryId: paymentData.beneficiaryId,
        amount: paymentData.amount,
        currency: paymentData.currency,
      };

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        ...mockTransaction,
      } as any);

      const mockInvoice = {
        _id: 'invoice123',
        id: 'invoice123',
      };

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue(mockInvoice as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        ...mockInvoice,
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_test123');
      expect(result.transactionId).toBe('trans123');
      expect(result.invoiceId).toBe('invoice123');
    });

    it('devrait créer un PaymentIntent via PaymentService', async () => {
      const paymentData = createMockPaymentData();

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      await paymentFacade.execute(paymentData);

      expect(vi.mocked(mockPaymentService.createPaymentIntent)).toHaveBeenCalledWith(
        paymentData.amount,
        paymentData.currency,
        expect.any(String), // customerId peut être undefined ou string selon le schéma
        expect.objectContaining({
          payerId: paymentData.payerId,
          beneficiaryId: paymentData.beneficiaryId,
          serviceType: paymentData.serviceType,
          serviceId: paymentData.serviceId,
        }),
      );
    });

    it('devrait confirmer le PaymentIntent', async () => {
      const paymentData = createMockPaymentData();

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      await paymentFacade.execute(paymentData);

      expect(vi.mocked(mockPaymentService.confirmPaymentIntent)).toHaveBeenCalledWith(
        mockPaymentIntent.id,
        paymentData.paymentMethodId,
      );
    });

    it('devrait créer une transaction associée', async () => {
      const paymentData = createMockPaymentData();

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      await paymentFacade.execute(paymentData);

      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          payerId: paymentData.payerId,
          beneficiaryId: paymentData.beneficiaryId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          serviceType: paymentData.serviceType,
          serviceId: paymentData.serviceId,
          description: paymentData.description,
          metadata: expect.objectContaining({
            paymentIntentId: mockPaymentIntent.id,
          }),
        }),
      );
    });

    it('devrait créer une facture si demandée', async () => {
      const paymentData = createMockPaymentData({
        createInvoice: true,
      });

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(true);
      expect(result.invoiceId).toBe('invoice123');
      expect(invoiceService.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: paymentData.payerId,
          transactionId: 'trans123',
          amount: paymentData.amount,
          currency: paymentData.currency,
        }),
      );
    });

    it('ne devrait pas créer de facture si createInvoice est false', async () => {
      const paymentData = createMockPaymentData({
        createInvoice: false,
      });

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(true);
      expect(result.invoiceId).toBeUndefined();
      expect(invoiceService.createInvoice).not.toHaveBeenCalled();
    });

    it('devrait envoyer des notifications si demandé', async () => {
      const paymentData = createMockPaymentData({
        sendNotification: true,
      });

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      await paymentFacade.execute(paymentData);

      expect(notificationService.sendPaymentSuccessNotification).toHaveBeenCalledWith(
        expect.any(String), // customerId peut être undefined ou string
        paymentData.amount,
        paymentData.currency,
        paymentData.description,
        'fr',
      );
    });

    it('devrait gérer les paiements nécessitant une action (3D Secure)', async () => {
      const paymentData = createMockPaymentData();

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'requires_action',
      };

      const mockPaymentResult = {
        success: false,
        requiresAction: true,
        nextAction: {
          type: 'redirect_to_url',
          url: 'https://stripe.com/3d-secure',
        },
        error: 'Payment requires authentication',
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(false);
      expect(result.requiresAction).toBe(true);
      expect(result.nextAction).toBeDefined();
      expect(result.nextAction?.url).toBe('https://stripe.com/3d-secure');
    });

    it('devrait gérer les erreurs de paiement (carte refusée)', async () => {
      const paymentData = createMockPaymentData();

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'failed',
      };

      const mockPaymentResult = {
        success: false,
        error: 'Your card was declined.',
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Your card was declined.');
    });

    it('devrait gérer les erreurs de paiement (fonds insuffisants)', async () => {
      const paymentData = createMockPaymentData();

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'failed',
      };

      const mockPaymentResult = {
        success: false,
        error: 'Insufficient funds',
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
    });

    it('devrait valider les données d\'entrée (CreatePaymentSchema)', async () => {
      const invalidData = {
        amount: -100, // Montant négatif
        currency: 'EU', // Devise invalide (doit être 3 caractères)
        paymentMethodId: '', // Payment method ID vide
        serviceType: 'INVALID' as any, // Type de service invalide
      } as PaymentFacadeData;

      // Le décorateur @Validate lance une exception pour les données invalides
      await expect(paymentFacade.execute(invalidData)).rejects.toThrow();
    });

    it('devrait gérer les erreurs Stripe (rate limit)', async () => {
      const paymentData = createMockPaymentData();

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockRejectedValue(
        new Error('Rate limit exceeded'),
      );

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('devrait gérer les erreurs Stripe (timeout)', async () => {
      const paymentData = createMockPaymentData();

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockRejectedValue(
        new Error('Request timeout'),
      );

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('ne devrait pas faire échouer le paiement si l\'envoi de notification échoue', async () => {
      const paymentData = createMockPaymentData({
        sendNotification: true,
      });

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockRejectedValue(
        new Error('Erreur d\'envoi de notification'),
      );

      const result = await paymentFacade.execute(paymentData);

      // Le paiement doit réussir même si la notification échoue
      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_test123');
      expect(result.transactionId).toBe('trans123');
    });

    it('ne devrait pas faire échouer le paiement si la création de facture échoue', async () => {
      const paymentData = createMockPaymentData({
        createInvoice: true,
      });

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockRejectedValue(
        new Error('Erreur de création de facture'),
      );

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      const result = await paymentFacade.execute(paymentData);

      // Le paiement doit réussir même si la facture échoue
      expect(result.success).toBe(true);
      expect(result.paymentIntentId).toBe('pi_test123');
      expect(result.transactionId).toBe('trans123');
      expect(result.invoiceId).toBeUndefined();
    });

    it('devrait traiter un paiement avec serviceType HEALTH', async () => {
      const paymentData = createMockPaymentData({
        serviceType: 'HEALTH',
      });

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(true);
      expect(vi.mocked(mockPaymentService.createPaymentIntent)).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(String),
        expect.anything(), // customerId peut être undefined ou string
        expect.objectContaining({
          serviceType: 'HEALTH',
        }),
      );
    });

    it('devrait traiter un paiement avec serviceType EDUCATION', async () => {
      const paymentData = createMockPaymentData({
        serviceType: 'EDUCATION',
      });

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(true);
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceType: 'EDUCATION',
        }),
      );
    });

    it('devrait traiter un paiement avec serviceType BTP', async () => {
      const paymentData = createMockPaymentData({
        serviceType: 'BTP',
      });

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      const result = await paymentFacade.execute(paymentData);

      expect(result.success).toBe(true);
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceType: 'BTP',
        }),
      );
    });

    it('devrait traiter un paiement avec metadata personnalisée', async () => {
      const paymentData = createMockPaymentData({
        metadata: {
          bookingId: 'booking123',
          customField: 'customValue',
          orderNumber: 'ORD-2025-001',
        },
      });

      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
      };

      const mockPaymentResult = {
        success: true,
        paymentIntentId: mockPaymentIntent.id,
      };

      const { PaymentService } = await import('@/services/payment/payment.service');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.createPaymentIntent).mockResolvedValue(mockPaymentIntent as any);
      vi.mocked(mockPaymentService.confirmPaymentIntent).mockResolvedValue(mockPaymentResult as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendPaymentSuccessNotification).mockResolvedValue(undefined);

      await paymentFacade.execute(paymentData);

      // Vérifier que les metadata sont passées au PaymentIntent
      expect(vi.mocked(mockPaymentService.createPaymentIntent)).toHaveBeenCalledWith(
        expect.any(Number),
        expect.any(String),
        expect.anything(), // customerId peut être undefined ou string
        expect.objectContaining({
          bookingId: 'booking123',
          customField: 'customValue',
          orderNumber: 'ORD-2025-001',
        }),
      );

      // Vérifier que les metadata sont passées à la transaction
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            bookingId: 'booking123',
            customField: 'customValue',
            orderNumber: 'ORD-2025-001',
            paymentIntentId: mockPaymentIntent.id,
          }),
        }),
      );
    });
  });
});

