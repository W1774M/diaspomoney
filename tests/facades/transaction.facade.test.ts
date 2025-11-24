/**
 * Tests unitaires pour TransactionFacade
 * 
 * Implémente les tests pour :
 * - createTransaction (via execute())
 * - Gestion d'erreurs
 * - Validation des données
 * - Orchestration avec TransactionService et NotificationService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { transactionFacade } from '@/facades/transaction.facade';
import type { TransactionFacadeData } from '@/lib/types';

// Mock des dépendances
vi.mock('@/services/transaction/transaction.service');
vi.mock('@/services/notification/notification.service');
vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('TransactionFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createTransaction (via execute)', () => {
    it('devrait créer une transaction avec succès', async () => {
      const transactionData: TransactionFacadeData = {
        payerId: 'payer123',
        beneficiaryId: 'beneficiary123',
        amount: 100.50,
        currency: 'EUR',
        type: 'PAYMENT',
      };

      // Mock du service transaction
      const mockTransaction = {
        _id: 'transaction123',
        id: 'transaction123',
        payerId: transactionData.payerId,
        beneficiaryId: transactionData.beneficiaryId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        type: transactionData.type,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: mockTransaction.id,
        payerId: mockTransaction.payerId,
        beneficiaryId: mockTransaction.beneficiaryId,
        amount: mockTransaction.amount,
        currency: mockTransaction.currency,
        type: mockTransaction.type,
        status: mockTransaction.status,
      } as any);

      const result = await transactionFacade.execute(transactionData);

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.id).toBe('transaction123');
      expect(result.transaction?.amount).toBe(100.50);
      expect(transactionService.createTransaction).toHaveBeenCalled();
    });

    it('devrait créer une transaction avec notification si demandé', async () => {
      const transactionData: TransactionFacadeData = {
        payerId: 'payer123',
        beneficiaryId: 'beneficiary123',
        amount: 100.50,
        currency: 'EUR',
        type: 'PAYMENT',
        sendNotification: true,
      };

      const mockTransaction = {
        _id: 'transaction123',
        id: 'transaction123',
        payerId: transactionData.payerId,
        beneficiaryId: transactionData.beneficiaryId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        type: transactionData.type,
        status: 'PENDING',
      };

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: mockTransaction.id,
        payerId: mockTransaction.payerId,
        beneficiaryId: mockTransaction.beneficiaryId,
        amount: mockTransaction.amount,
        currency: mockTransaction.currency,
        type: mockTransaction.type,
        status: mockTransaction.status,
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'TRANSACTION_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await transactionFacade.execute(transactionData);

      expect(result.success).toBe(true);
      expect(result.notificationSent).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: transactionData.payerId,
          type: 'TRANSACTION_CREATED',
        }),
      );
    });

    it('devrait créer une transaction avec différents types', async () => {
      const transactionTypes = ['PAYMENT', 'REFUND', 'TRANSFER', 'DEPOSIT'];

      for (const type of transactionTypes) {
        const transactionData: TransactionFacadeData = {
          payerId: 'payer123',
          beneficiaryId: 'beneficiary123',
          amount: 100.50,
          currency: 'EUR',
          type,
        };

        const mockTransaction = {
          _id: `transaction-${type}`,
          id: `transaction-${type}`,
          payerId: transactionData.payerId,
          beneficiaryId: transactionData.beneficiaryId,
          amount: transactionData.amount,
          currency: transactionData.currency,
          type: transactionData.type,
          status: 'PENDING',
        };

        const { transactionService } = await import('@/services/transaction/transaction.service');
        vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction as any);

        const { transactionMapper } = await import('@/lib/mappers');
        vi.mocked(transactionMapper.map).mockReturnValue({
          id: mockTransaction.id,
          type: mockTransaction.type,
        } as any);

        const result = await transactionFacade.execute(transactionData);

        expect(result.success).toBe(true);
        expect(result.transaction?.type).toBe(type);
      }
    });

    it('devrait créer une transaction avec différents serviceType', async () => {
      const serviceTypes = ['HEALTH', 'EDUCATION', 'BTP'] as const;

      for (const serviceType of serviceTypes) {
        const transactionData: TransactionFacadeData = {
          payerId: 'payer123',
          beneficiaryId: 'beneficiary123',
          amount: 100.50,
          currency: 'EUR',
          type: 'PAYMENT',
          serviceType,
        };

        const mockTransaction = {
          _id: `transaction-${serviceType}`,
          id: `transaction-${serviceType}`,
          payerId: transactionData.payerId,
          beneficiaryId: transactionData.beneficiaryId,
          amount: transactionData.amount,
          currency: transactionData.currency,
          type: transactionData.type,
          serviceType: transactionData.serviceType,
          status: 'PENDING',
        };

        const { transactionService } = await import('@/services/transaction/transaction.service');
        vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction as any);

        const { transactionMapper } = await import('@/lib/mappers');
        vi.mocked(transactionMapper.map).mockReturnValue({
          id: mockTransaction.id,
          serviceType: mockTransaction.serviceType,
        } as any);

        const result = await transactionFacade.execute(transactionData);

        expect(result.success).toBe(true);
        expect(result.transaction?.serviceType).toBe(serviceType);
      }
    });

    it('devrait créer une transaction avec metadata personnalisée', async () => {
      const transactionData: TransactionFacadeData = {
        payerId: 'payer123',
        beneficiaryId: 'beneficiary123',
        amount: 100.50,
        currency: 'EUR',
        type: 'PAYMENT',
        metadata: {
          bookingId: 'booking123',
          invoiceId: 'invoice123',
          customField: 'customValue',
        },
      };

      const mockTransaction = {
        _id: 'transaction123',
        id: 'transaction123',
        payerId: transactionData.payerId,
        beneficiaryId: transactionData.beneficiaryId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        type: transactionData.type,
        metadata: transactionData.metadata,
        status: 'PENDING',
      };

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: mockTransaction.id,
        metadata: mockTransaction.metadata,
      } as any);

      const result = await transactionFacade.execute(transactionData);

      expect(result.success).toBe(true);
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: transactionData.metadata,
        }),
      );
    });

    it('devrait créer une transaction avec description optionnelle', async () => {
      const transactionData: TransactionFacadeData = {
        payerId: 'payer123',
        beneficiaryId: 'beneficiary123',
        amount: 100.50,
        currency: 'EUR',
        type: 'PAYMENT',
        description: 'Paiement pour service de consultation',
      };

      const mockTransaction = {
        _id: 'transaction123',
        id: 'transaction123',
        payerId: transactionData.payerId,
        beneficiaryId: transactionData.beneficiaryId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        type: transactionData.type,
        description: transactionData.description,
        status: 'PENDING',
      };

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: mockTransaction.id,
        description: mockTransaction.description,
      } as any);

      const result = await transactionFacade.execute(transactionData);

      expect(result.success).toBe(true);
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          description: transactionData.description,
        }),
      );
    });

    it('devrait gérer les erreurs lors de la création de transaction', async () => {
      const transactionData: TransactionFacadeData = {
        payerId: 'payer123',
        beneficiaryId: 'beneficiary123',
        amount: 100.50,
        currency: 'EUR',
        type: 'PAYMENT',
      };

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockRejectedValue(
        new Error('Erreur lors de la création de la transaction'),
      );

      const result = await transactionFacade.execute(transactionData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.errorCode).toBe('TRANSACTION_CREATION_FAILED');
    });

    it('devrait valider les données d\'entrée', async () => {
      const invalidData = {
        payerId: '', // Payer ID vide
        beneficiaryId: '', // Beneficiary ID vide
        amount: -100, // Montant négatif
        currency: 'EU', // Devise invalide (doit être 3 caractères)
        type: '', // Type vide
      } as TransactionFacadeData;

      const result = await transactionFacade.execute(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('ne devrait pas faire échouer la création si l\'envoi de notification échoue', async () => {
      const transactionData: TransactionFacadeData = {
        payerId: 'payer123',
        beneficiaryId: 'beneficiary123',
        amount: 100.50,
        currency: 'EUR',
        type: 'PAYMENT',
        sendNotification: true,
      };

      const mockTransaction = {
        _id: 'transaction123',
        id: 'transaction123',
        payerId: transactionData.payerId,
        beneficiaryId: transactionData.beneficiaryId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        type: transactionData.type,
        status: 'PENDING',
      };

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: mockTransaction.id,
        payerId: mockTransaction.payerId,
        beneficiaryId: mockTransaction.beneficiaryId,
        amount: mockTransaction.amount,
        currency: mockTransaction.currency,
        type: mockTransaction.type,
        status: mockTransaction.status,
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockRejectedValue(
        new Error('Erreur d\'envoi de notification'),
      );

      const result = await transactionFacade.execute(transactionData);

      // La création de transaction doit réussir même si la notification échoue
      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.notificationSent).toBe(false);
    });

    it('devrait créer une transaction avec serviceId optionnel', async () => {
      const transactionData: TransactionFacadeData = {
        payerId: 'payer123',
        beneficiaryId: 'beneficiary123',
        amount: 100.50,
        currency: 'EUR',
        type: 'PAYMENT',
        serviceId: 'service123',
      };

      const mockTransaction = {
        _id: 'transaction123',
        id: 'transaction123',
        payerId: transactionData.payerId,
        beneficiaryId: transactionData.beneficiaryId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        type: transactionData.type,
        serviceId: transactionData.serviceId,
        status: 'PENDING',
      };

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue(mockTransaction as any);

      const { transactionMapper } = await import('@/lib/mappers');
      vi.mocked(transactionMapper.map).mockReturnValue({
        id: mockTransaction.id,
        serviceId: mockTransaction.serviceId,
      } as any);

      const result = await transactionFacade.execute(transactionData);

      expect(result.success).toBe(true);
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceId: transactionData.serviceId,
        }),
      );
    });
  });
});

