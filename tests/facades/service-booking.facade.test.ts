/**
 * Tests unitaires pour ServiceBookingFacade
 * 
 * Implémente les tests pour :
 * - createServiceBooking (via execute())
 * - Orchestration complète du processus de réservation
 * - Intégration avec PaymentFacade, BookingService, NotificationService, TransactionService, InvoiceService
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { serviceBookingFacade } from '@/facades/service-booking.facade';
import type { ServiceBookingFacadeData } from '@/lib/types/service-booking.types';

// Mock des dépendances - hoisted pour être disponible dans vi.mock()
const { mockPaymentServiceInstance } = vi.hoisted(() => {
  const mockInstance = {
    createPaymentIntent: vi.fn(),
    processPayment: vi.fn(),
    getTransactionStatus: vi.fn(),
    cancelPaymentIntent: vi.fn(),
    refundPayment: vi.fn(),
  };
  return { mockPaymentServiceInstance: mockInstance };
});

vi.mock('@/services/booking/booking.service');
vi.mock('@/services/payment/payment.service.strategy', () => ({
  PaymentService: {
    getInstance: vi.fn(() => mockPaymentServiceInstance),
  },
}));
vi.mock('@/services/transaction/transaction.service');
vi.mock('@/services/invoice/invoice.service');
vi.mock('@/services/notification/notification.service');
vi.mock('@/facades/payment.facade');
vi.mock('@/lib/mappers');
vi.mock('@/lib/logger');
vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

describe('ServiceBookingFacade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockBookingData = (overrides?: Partial<ServiceBookingFacadeData>): ServiceBookingFacadeData => ({
    serviceType: 'HEALTH',
    clientInfo: {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33123456789',
      email: 'john.doe@example.com',
    },
    beneficiaryInfo: {
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+33987654321',
      email: 'jane.doe@example.com',
      country: 'FR',
    },
    selectedService: {
      serviceId: 'service123',
      category: 'Consultation',
      label: 'Consultation médicale',
      description: 'Consultation médicale générale',
      price: 50,
      options: [],
    },
    additionalOptions: [],
    paymentIntentId: 'pi_test123',
    appointmentDate: '2025-02-01',
    appointmentTime: '10:00',
    ...overrides,
  });

  describe('createServiceBooking (via execute)', () => {
    it('devrait créer une réservation HEALTH avec succès', async () => {
      const bookingData = createMockBookingData({ serviceType: 'HEALTH' });

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        appointmentDate: new Date(bookingData.appointmentDate!),
        timeslot: bookingData.appointmentTime,
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe('booking123');
      expect(result.reservationNumber).toBe('RES-2025-001');
      expect(bookingService.createBooking).toHaveBeenCalled();
    });

    it('devrait créer une réservation EDUCATION avec succès', async () => {
      const bookingData = createMockBookingData({ serviceType: 'EDUCATION' });

      const mockBooking = {
        _id: 'booking456',
        id: 'booking456',
        reservationNumber: 'RES-2025-002',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'EDUCATION',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans456',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans456',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice456',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe('booking456');
    });

    it('devrait créer une réservation BTP avec succès', async () => {
      const bookingData = createMockBookingData({ serviceType: 'BTP' });

      const mockBooking = {
        _id: 'booking789',
        id: 'booking789',
        reservationNumber: 'RES-2025-003',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'BTP',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans789',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans789',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice789',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      expect(result.bookingId).toBe('booking789');
    });

    it('devrait calculer correctement le montant total (prix de base + options)', async () => {
      const bookingData = createMockBookingData({
        selectedService: {
          serviceId: 'service123',
          category: 'Consultation',
          label: 'Consultation médicale',
          description: 'Consultation médicale générale',
          price: 50,
          options: [],
        },
        additionalOptions: [
          { id: 'opt1', category: 'HEALTH', label: 'Option 1', description: 'Option 1', price: 10, optional: true },
          { id: 'opt2', category: 'HEALTH', label: 'Option 2', description: 'Option 2', price: 20, optional: true },
        ],
      });

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      // Vérifier que le montant total est calculé (50 + 10 + 20 = 80)
      // Le montant est passé dans les metadata de la réservation
      expect(bookingService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            basePrice: '50',
            optionsPrice: '30',
            totalAmount: '80',
          }),
        }),
      );
    });

    it('devrait générer un ID unique pour utilisateurs non connectés (guest-*)', async () => {
      const bookingData = createMockBookingData({
        metadata: {}, // Pas de userId dans metadata
      });

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      // Vérifier qu'un requesterId de type guest-* a été généré
      expect(bookingService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          requesterId: expect.stringMatching(/^guest-/),
        }),
      );
    });

    it('devrait utiliser userId depuis metadata si fourni', async () => {
      const bookingData = createMockBookingData({
        metadata: { userId: 'user123' },
      });

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'user123',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      expect(bookingService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          requesterId: 'user123',
        }),
      );
    });

    it('devrait créer une transaction associée', async () => {
      const bookingData = createMockBookingData();

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      expect(transactionService.createTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          payerId: expect.any(String),
          beneficiaryId: expect.any(String),
          amount: 50, // Prix de base
          currency: 'EUR',
          serviceType: 'HEALTH',
          serviceId: bookingData.selectedService.serviceId,
        }),
      );
    });

    it('devrait créer une facture associée', async () => {
      const bookingData = createMockBookingData();

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      expect(invoiceService.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(String),
          bookingId: 'booking123',
          amount: 50,
          currency: 'EUR',
          items: expect.arrayContaining([
            expect.objectContaining({
              description: expect.stringContaining('Service booking'),
              quantity: 1,
              unitPrice: 50,
              total: 50,
            }),
          ]),
        }),
      );
    });

    it('devrait envoyer des notifications au client et au bénéficiaire', async () => {
      const bookingData = createMockBookingData();

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      // Vérifier que les notifications ont été envoyées
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: bookingData.clientInfo.email,
          type: 'SERVICE_BOOKING_CONFIRMED',
        }),
      );
      // Notification au bénéficiaire si email différent
      expect(notificationService.sendNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: bookingData.beneficiaryInfo.email,
          type: 'SERVICE_BOOKING_CONFIRMED',
        }),
      );
    });

    it('devrait gérer les erreurs lors de la création de réservation', async () => {
      const bookingData = createMockBookingData();

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockRejectedValue(
        new Error('Erreur lors de la création de la réservation'),
      );

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('devrait valider les données d\'entrée (CreateBookingSchema)', async () => {
      const invalidData = {
        serviceType: 'INVALID_TYPE' as any,
        clientInfo: {
          firstName: '',
          lastName: '',
          phone: '',
          email: 'invalid-email',
        },
        beneficiaryInfo: {
          firstName: '',
          lastName: '',
          phone: '',
          country: 'FR',
        },
        selectedService: {
          serviceId: '',
          category: '',
          label: '',
          description: '',
          price: -10,
          options: [],
        },
        additionalOptions: [],
        paymentIntentId: '',
      } as ServiceBookingFacadeData;

      // Le décorateur @Validate lance une exception pour les données invalides
      await expect(serviceBookingFacade.execute(invalidData)).rejects.toThrow();
    });

    it('ne devrait pas faire échouer la création si l\'envoi de notification échoue', async () => {
      const bookingData = createMockBookingData();

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockRejectedValue(
        new Error('Erreur d\'envoi de notification'),
      );

      const result = await serviceBookingFacade.execute(bookingData);

      // La création de réservation doit réussir même si la notification échoue
      expect(result.success).toBe(true);
      expect(result.bookingId).toBe('booking123');
    });

    it('devrait gérer les erreurs de paiement (paymentIntentId invalide)', async () => {
      const bookingData = createMockBookingData({
        paymentIntentId: 'pi_invalid',
      });

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        status: 'CANCELLED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: false,
        error: 'Payment verification failed',
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(bookingService.updateBookingStatus).toHaveBeenCalledWith(
        expect.any(String),
        'CANCELLED',
      );
    });

    it('devrait créer une réservation avec options supplémentaires', async () => {
      const bookingData = createMockBookingData({
        additionalOptions: [
          { id: 'opt1', category: 'HEALTH', label: 'Option urgente', description: 'Option urgente', price: 25, optional: true },
          { id: 'opt2', category: 'HEALTH', label: 'Option premium', description: 'Option premium', price: 15, optional: true },
        ],
      });

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingData.selectedService.serviceId,
        serviceId: bookingData.selectedService.serviceId,
        serviceType: 'HEALTH',
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingData.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await serviceBookingFacade.execute(bookingData);

      expect(result.success).toBe(true);
      // Vérifier que les options sont incluses dans les metadata
      expect(bookingService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            additionalOptions: expect.stringContaining('opt1'),
          }),
        }),
      );
    });

    it('devrait créer une réservation avec et sans appointmentDate/appointmentTime', async () => {
      // Test avec date et heure
      const bookingDataWithDate = createMockBookingData({
        appointmentDate: '2025-02-01',
        appointmentTime: '10:00',
      });

      const mockBooking = {
        _id: 'booking123',
        id: 'booking123',
        reservationNumber: 'RES-2025-001',
        requesterId: 'guest-johndo-123456-abc',
        providerId: bookingDataWithDate.selectedService.serviceId,
        serviceId: bookingDataWithDate.selectedService.serviceId,
        serviceType: 'HEALTH',
        appointmentDate: new Date(bookingDataWithDate.appointmentDate!),
        timeslot: bookingDataWithDate.appointmentTime,
        status: 'CONFIRMED',
      };

      const { bookingService } = await import('@/services/booking/booking.service');
      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
      vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);

      const { bookingMapper } = await import('@/lib/mappers');
      vi.mocked(bookingMapper.map).mockReturnValue({
        ...mockBooking,
      } as any);

      const { PaymentService } = await import('@/services/payment/payment.service.strategy');
      const mockPaymentService = PaymentService.getInstance();
      vi.mocked(mockPaymentService.getTransactionStatus).mockResolvedValue({
        success: true,
        transactionId: 'trans123',
        paymentIntentId: bookingDataWithDate.paymentIntentId,
      } as any);

      const { transactionService } = await import('@/services/transaction/transaction.service');
      vi.mocked(transactionService.createTransaction).mockResolvedValue({
        id: 'trans123',
      } as any);

      const { invoiceService } = await import('@/services/invoice/invoice.service');
      vi.mocked(invoiceService.createInvoice).mockResolvedValue({
        id: 'invoice123',
      } as any);

      const { notificationService } = await import('@/services/notification/notification.service');
      vi.mocked(notificationService.sendNotification).mockResolvedValue({
        id: 'notification123',
        recipient: 'user123',
        type: 'BOOKING_CREATED',
        subject: 'Test',
        content: 'Test',
        channels: [],
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const resultWithDate = await serviceBookingFacade.execute(bookingDataWithDate);

      expect(resultWithDate.success).toBe(true);
      expect(bookingService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentDate: expect.any(Date),
          timeslot: '10:00',
        }),
      );

      // Test sans date et heure
      vi.clearAllMocks();

      const bookingDataWithoutDate = createMockBookingData({});
      // Omit appointmentDate and appointmentTime to test without them
      delete (bookingDataWithoutDate as any).appointmentDate;
      delete (bookingDataWithoutDate as any).appointmentTime;

      const mockBookingWithoutDate = {
        ...mockBooking,
        appointmentDate: new Date(),
        timeslot: undefined,
      };

      vi.mocked(bookingService.createBooking).mockResolvedValue(mockBookingWithoutDate as any);

      const resultWithoutDate = await serviceBookingFacade.execute(bookingDataWithoutDate);

      expect(resultWithoutDate.success).toBe(true);
      expect(bookingService.createBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          appointmentDate: expect.any(Date), // Date par défaut
        }),
      );
    });
  });
});

