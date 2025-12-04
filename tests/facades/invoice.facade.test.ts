/**
 * Tests unitaires pour InvoiceFacade
 * 
 * Implémente les tests pour :
 * - createInvoice
 * - Gestion d'erreurs
 * - Validation des données
 * - Orchestration des services (InvoiceService, EmailService, NotificationService)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { invoiceFacade } from '@/facades/invoice.facade';
import type { InvoiceFacadeData } from '@/facades/invoice.facade';

// Mock des dépendances
vi.mock('@/services/invoice/invoice.service');
vi.mock('@/services/email/email.service');
vi.mock('@/services/notification/notification.service');

// Mock des repositories - utiliser vi.hoisted() pour que les variables soient disponibles dans vi.mock
const { mockUserRepository } = vi.hoisted(() => {
  return {
    mockUserRepository: {
      findById: vi.fn(),
      findByEmail: vi.fn(),
      create: vi.fn(),
      findUsersWithFilters: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
});

vi.mock('@/repositories', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/repositories')>();
  return {
    ...actual,
    getUserRepository: vi.fn(() => mockUserRepository),
    getInvoiceRepository: vi.fn(() => ({
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findAll: vi.fn(),
    })),
  };
});

vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('InvoiceFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createInvoice', () => {
    it('devrait créer une facture avec succès', async () => {
      const invoiceData: InvoiceFacadeData = {
        userId: 'user123',
        amount: 100.50,
        currency: 'EUR',
        items: [
          {
            description: 'Service de consultation',
            quantity: 1,
            unitPrice: 100.50,
            total: 100.50,
          },
        ],
      };

      // Mock du service invoice
      const mockInvoice = {
        _id: 'invoice123',
        id: 'invoice123',
        invoiceNumber: 'INV-2025-001',
        userId: invoiceData.userId,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        items: invoiceData.items,
        totalAmount: invoiceData.amount,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue(mockInvoice as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        ...mockInvoice,
        id: mockInvoice.id,
        invoiceNumber: mockInvoice.invoiceNumber,
      } as any);

      const result = await invoiceFacade.createInvoice(invoiceData);

      expect(result.success).toBe(true);
      expect(result.invoiceId).toBe('invoice123');
      expect(result.invoiceNumber).toBe('INV-2025-001');
      expect(invoiceService.createInvoice).toHaveBeenCalledWith(invoiceData);
    });

    it('devrait créer une facture et envoyer un email si demandé', async () => {
      const invoiceData: InvoiceFacadeData = {
        userId: 'user123',
        amount: 100.50,
        currency: 'EUR',
        items: [
          {
            description: 'Service de consultation',
            quantity: 1,
            unitPrice: 100.50,
            total: 100.50,
          },
        ],
        sendEmail: true,
        recipientEmail: 'client@example.com',
      };

      const mockInvoice = {
        _id: 'invoice123',
        id: 'invoice123',
        invoiceNumber: 'INV-2025-001',
        userId: invoiceData.userId,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        totalAmount: invoiceData.amount,
      };

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue(mockInvoice as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: mockInvoice.id,
        invoiceNumber: mockInvoice.invoiceNumber,
      } as any);

      mockUserRepository.findById.mockResolvedValue({
        _id: 'user123',
        email: 'user@example.com',
      } as any);

      const { emailService } = await import('@/services/email/email.service');
      vi.mocked(emailService.sendCustomEmail).mockResolvedValue(true);

      const result = await invoiceFacade.createInvoice(invoiceData);

      expect(result.success).toBe(true);
      expect(result.emailSent).toBe(true);
      expect(emailService.sendCustomEmail).toHaveBeenCalled();
    });

    it('devrait créer une facture et envoyer une notification si demandé', async () => {
      const invoiceData: InvoiceFacadeData = {
        userId: 'user123',
        amount: 100.50,
        currency: 'EUR',
        items: [
          {
            description: 'Service de consultation',
            quantity: 1,
            unitPrice: 100.50,
            total: 100.50,
          },
        ],
        sendNotification: true,
      };

      const mockInvoice = {
        _id: 'invoice123',
        id: 'invoice123',
        invoiceNumber: 'INV-2025-001',
        userId: invoiceData.userId,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        totalAmount: invoiceData.amount,
      };

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue(mockInvoice as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: mockInvoice.id,
        invoiceNumber: mockInvoice.invoiceNumber,
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'INVOICE_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await invoiceFacade.createInvoice(invoiceData);

      expect(result.success).toBe(true);
      expect(result.notificationSent).toBe(true);
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: invoiceData.userId,
          type: 'INVOICE_CREATED',
        }),
      );
    });

    it('devrait gérer les erreurs lors de la création de facture', async () => {
      const invoiceData: InvoiceFacadeData = {
        userId: 'user123',
        amount: 100.50,
        currency: 'EUR',
        items: [
          {
            description: 'Service de consultation',
            quantity: 1,
            unitPrice: 100.50,
            total: 100.50,
          },
        ],
      };

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockRejectedValue(
        new Error('Erreur lors de la création de la facture'),
      );

      const result = await invoiceFacade.createInvoice(invoiceData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Erreur lors de la création de la facture');
    });

    it('devrait valider les données d\'entrée', async () => {
      const invalidData = {
        userId: '', // User ID vide
        amount: -100, // Montant négatif
        currency: 'EU', // Devise invalide (doit être 3 caractères)
        items: [], // Aucun item
      } as InvoiceFacadeData;

      // Le décorateur @Validate lance une exception pour les données invalides
      await expect(invoiceFacade.createInvoice(invalidData)).rejects.toThrow();
    });

    it('ne devrait pas faire échouer la création si l\'envoi d\'email échoue', async () => {
      const invoiceData: InvoiceFacadeData = {
        userId: 'user123',
        amount: 100.50,
        currency: 'EUR',
        items: [
          {
            description: 'Service de consultation',
            quantity: 1,
            unitPrice: 100.50,
            total: 100.50,
          },
        ],
        sendEmail: true,
        recipientEmail: 'client@example.com',
      };

      const mockInvoice = {
        _id: 'invoice123',
        id: 'invoice123',
        invoiceNumber: 'INV-2025-001',
        userId: invoiceData.userId,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        totalAmount: invoiceData.amount,
      };

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue(mockInvoice as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: mockInvoice.id,
        invoiceNumber: mockInvoice.invoiceNumber,
      } as any);

      mockUserRepository.findById.mockResolvedValue({
        _id: 'user123',
        email: 'user@example.com',
      } as any);

      const { emailService } = await import('@/services/email/email.service');
      vi.mocked(emailService.sendCustomEmail).mockRejectedValue(
        new Error('Erreur d\'envoi d\'email'),
      );

      const result = await invoiceFacade.createInvoice(invoiceData);

      // La création de facture doit réussir même si l'email échoue
      expect(result.success).toBe(true);
      expect(result.invoiceId).toBe('invoice123');
      expect(result.emailSent).toBe(false);
    });

    it('ne devrait pas faire échouer la création si l\'envoi de notification échoue', async () => {
      const invoiceData: InvoiceFacadeData = {
        userId: 'user123',
        amount: 100.50,
        currency: 'EUR',
        items: [
          {
            description: 'Service de consultation',
            quantity: 1,
            unitPrice: 100.50,
            total: 100.50,
          },
        ],
        sendNotification: true,
      };

      const mockInvoice = {
        _id: 'invoice123',
        id: 'invoice123',
        invoiceNumber: 'INV-2025-001',
        userId: invoiceData.userId,
        amount: invoiceData.amount,
        currency: invoiceData.currency,
        totalAmount: invoiceData.amount,
      };

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue(mockInvoice as any);

      const { invoiceMapper } = await import('@/lib/mappers');
      vi.mocked(invoiceMapper.map).mockReturnValue({
        id: mockInvoice.id,
        invoiceNumber: mockInvoice.invoiceNumber,
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockRejectedValue(
        new Error('Erreur d\'envoi de notification'),
      );

      const result = await invoiceFacade.createInvoice(invoiceData);

      // La création de facture doit réussir même si la notification échoue
      expect(result.success).toBe(true);
      expect(result.invoiceId).toBe('invoice123');
      expect(result.notificationSent).toBe(false);
    });
  });
});

