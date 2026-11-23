/**
 * ServiceBookingFacade — branche POC coss (HEALTH après paiement)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServiceBookingFacadeData } from '@/lib/types/service-booking.types';

const { mockPaymentServiceInstance, isConfigured, createCoss, parisLocalToIso } = vi.hoisted(
  () => {
    const mockInstance = {
      createPaymentIntent: vi.fn(),
      processPayment: vi.fn(),
      getTransactionStatus: vi.fn(),
      verifyPaymentProof: vi.fn(),
      cancelPaymentIntent: vi.fn(),
      refundPayment: vi.fn(),
    };
    return {
      mockPaymentServiceInstance: mockInstance,
      isConfigured: vi.fn(),
      createCoss: vi.fn(),
      parisLocalToIso: vi.fn(),
    };
  },
);

vi.mock('@/services/booking/booking.service');
vi.mock('@/services/payment/payment.service', () => ({
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
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/coss/client', () => ({
  isCossSchedulingConfigured: isConfigured,
}));
vi.mock('@/lib/coss/scheduling-health-poc', () => ({
  createHealthCossBooking: createCoss,
  parisLocalToIso,
}));

import { serviceBookingFacade } from '@/facades/service-booking.facade';

function bookingData(
  overrides: Partial<ServiceBookingFacadeData> = {},
): ServiceBookingFacadeData {
  return {
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
      relationship: 'OTHER',
      location: { address: '1 rue', city: 'Paris', country: 'FR' },
    },
    selectedService: {
      serviceId: 'service123',
      category: 'Consultation',
      label: 'Consultation médicale',
      description: 'Consultation',
      price: 50,
      options: [],
    },
    additionalOptions: [],
    paymentIntentId: 'pi_test123',
    appointmentDate: '2026-11-24',
    appointmentTime: '10:00',
    metadata: { cossSlotStart: '2026-11-24T09:00:00.000Z' },
    ...overrides,
  };
}

async function mockHappyPath(data: ServiceBookingFacadeData) {
  const mockBooking = {
    _id: 'booking123',
    id: 'booking123',
    reservationNumber: 'RES-2026-001',
    requesterId: 'guest-1',
    providerId: data.selectedService.serviceId,
    serviceId: data.selectedService.serviceId,
    serviceType: 'HEALTH',
    status: 'CONFIRMED',
    metadata: {},
  };

  const { bookingService } = await import('@/services/booking/booking.service');
  vi.mocked(bookingService.createBooking).mockResolvedValue(mockBooking as any);
  vi.mocked(bookingService.updateBookingStatus).mockResolvedValue(mockBooking as any);
  vi.mocked(bookingService.updateBooking).mockResolvedValue(mockBooking as any);

  const { bookingMapper } = await import('@/lib/mappers');
  vi.mocked(bookingMapper.map).mockReturnValue({ ...mockBooking } as any);

  mockPaymentServiceInstance.verifyPaymentProof.mockResolvedValue({
    success: true,
    paymentIntentId: data.paymentIntentId,
    transactionId: data.paymentIntentId,
    metadata: { status: 'succeeded' },
  });
  mockPaymentServiceInstance.getTransactionStatus.mockResolvedValue({
    success: true,
    paymentIntentId: data.paymentIntentId,
    transactionId: 'trans123',
    metadata: { status: 'succeeded' },
  });

  const { transactionService } = await import('@/services/transaction/transaction.service');
  vi.mocked(transactionService.createTransaction).mockResolvedValue({ id: 'trans123' } as any);

  const { invoiceService } = await import('@/services/invoice/invoice.service');
  vi.mocked(invoiceService.createInvoice).mockResolvedValue({ id: 'invoice123' } as any);

  const { notificationService } = await import('@/services/notification/notification.service');
  vi.mocked(notificationService.sendNotification).mockResolvedValue({
    id: 'n1',
    recipient: 'u1',
    type: 'BOOKING_CREATED',
    subject: 't',
    content: 't',
    channels: [],
    status: 'PENDING',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any);

  return bookingService;
}

describe('ServiceBookingFacade — coss HEALTH', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isConfigured.mockReturnValue(true);
    createCoss.mockResolvedValue({ id: 'coss_bk_1' });
    parisLocalToIso.mockReturnValue('2026-11-24T09:00:00.000Z');
  });

  it('lie le booking coss après succès local', async () => {
    const data = bookingData();
    const bookingService = await mockHappyPath(data);

    const result = await serviceBookingFacade.execute(data);

    expect(result.success).toBe(true);
    expect(createCoss).toHaveBeenCalledWith(
      expect.objectContaining({
        startIso: '2026-11-24T09:00:00.000Z',
        attendee: expect.objectContaining({ email: 'john.doe@example.com' }),
      }),
    );
    expect(bookingService.updateBooking).toHaveBeenCalledWith(
      'booking123',
      expect.objectContaining({
        metadata: expect.objectContaining({ cossBookingId: 'coss_bk_1' }),
      }),
    );
  });

  it('ne bloque pas si coss échoue', async () => {
    isConfigured.mockReturnValue(true);
    createCoss.mockRejectedValue(new Error('coss down'));
    const data = bookingData();
    await mockHappyPath(data);

    const result = await serviceBookingFacade.execute(data);
    expect(result.success).toBe(true);
  });

  it('ignore coss si non configuré', async () => {
    isConfigured.mockReturnValue(false);
    const data = bookingData();
    await mockHappyPath(data);

    await serviceBookingFacade.execute(data);
    expect(createCoss).not.toHaveBeenCalled();
  });
});
