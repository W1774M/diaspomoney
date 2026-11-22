import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  push: vi.fn(),
  addSuccess: vi.fn(),
  addError: vi.fn(),
  sendEmail: vi.fn(),
  generatePdf: vi.fn(),
  stripeDetails: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock('@/components/ui/Notification', () => ({
  useNotificationManager: () => ({ addSuccess: h.addSuccess, addError: h.addError }),
}));
vi.mock('@/lib/email/resend', () => ({ sendBookingTakeChargeEmail: h.sendEmail }));
vi.mock('@/lib/invoice-pdf-generator', () => ({
  generateInvoicePDF: h.generatePdf,
  getStripePaymentDetails: h.stripeDetails,
}));

import { useBookingActions } from '@/hooks/bookings/useBookingActions';

const booking = (metadata: Record<string, unknown> = {}) =>
  ({
    id: 'booking-0001abcd',
    reservationNumber: 'RES-42',
    serviceId: 'consultation',
    status: 'PENDING',
    createdAt: '2026-03-10T10:00:00.000Z',
    metadata,
  }) as any;

function setup(over: Partial<Parameters<typeof useBookingActions>[0]> = {}) {
  const props = {
    booking: booking({ clientEmail: 'awa@test.fr', clientFirstName: 'Awa', clientLastName: 'Diallo', serviceLabel: 'Consultation', totalAmount: 19 }),
    bookingId: 'booking-0001abcd',
    updateStatus: vi.fn(async () => true),
    refetch: vi.fn(async () => undefined),
    deleteBooking: vi.fn(async () => ({ success: true })),
    isProgressComplete: true,
    bookingsPageUrl: '/dashboard/bookings',
    ...over,
  };
  return { props, ...renderHook(() => useBookingActions(props)) };
}

describe('useBookingActions : prise en charge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('n’ouvre la confirmation que si la progression est complète', () => {
    const incomplete = setup({ isProgressComplete: false });
    act(() => incomplete.result.current.handleTakeChargeClick());
    expect(incomplete.result.current.showTakeChargeDialog).toBe(false);

    const ready = setup();
    act(() => ready.result.current.handleTakeChargeClick());
    expect(ready.result.current.showTakeChargeDialog).toBe(true);
  });

  it('confirme la commande, rafraîchit et envoie l’e-mail au client', async () => {
    h.sendEmail.mockResolvedValue(true);
    const { result, props } = setup();
    await act(() => result.current.handleTakeCharge());

    expect(props.updateStatus).toHaveBeenCalledWith('CONFIRMED');
    expect(props.refetch).toHaveBeenCalled();
    expect(h.sendEmail).toHaveBeenCalledWith('awa@test.fr', 'Awa Diallo', expect.any(String), 'Consultation', 19, '€');
    expect(h.addSuccess).toHaveBeenCalledWith('Commande prise en charge avec succès');
    expect(result.current.isUpdating).toBe(false);
  });

  it('reste en succès si le rafraîchissement ou l’e-mail échouent, ou sans e-mail client', async () => {
    h.sendEmail.mockResolvedValueOnce(false);
    const failingRefetch = setup({ refetch: vi.fn(async () => { throw new Error('réseau'); }) });
    await act(() => failingRefetch.result.current.handleTakeCharge());
    expect(h.addSuccess).toHaveBeenCalledTimes(1);

    h.sendEmail.mockRejectedValueOnce(new Error('Resend KO'));
    const failingEmail = setup();
    await act(() => failingEmail.result.current.handleTakeCharge());
    expect(h.addSuccess).toHaveBeenCalledTimes(2);

    const noEmail = setup({ booking: booking({ clientName: 'Client X' }) });
    await act(() => noEmail.result.current.handleTakeCharge());
    expect(h.sendEmail).toHaveBeenCalledTimes(2);
    expect(h.addSuccess).toHaveBeenCalledTimes(3);
  });

  it('signale l’échec ou l’erreur de mise à jour du statut', async () => {
    const refused = setup({ updateStatus: vi.fn(async () => false) });
    await act(() => refused.result.current.handleTakeCharge());
    expect(h.addError).toHaveBeenCalledWith('Erreur lors de la prise en charge de la commande');

    const crashing = setup({ updateStatus: vi.fn(async () => { throw new Error('500'); }) });
    await act(() => crashing.result.current.handleTakeCharge());
    expect(h.addError).toHaveBeenCalledTimes(2);
    expect(h.sendEmail).not.toHaveBeenCalled();
  });

  it('ne fait rien sans réservation', async () => {
    const { result, props } = setup({ booking: null });
    act(() => {
      result.current.handleTakeChargeClick();
      result.current.handleDeleteBookingClick();
    });
    await act(async () => {
      await result.current.handleTakeCharge();
      await result.current.handleDeleteBooking();
      await result.current.handleGenerateInvoice();
    });
    expect(props.updateStatus).not.toHaveBeenCalled();
    expect(props.deleteBooking).not.toHaveBeenCalled();
    expect(h.generatePdf).not.toHaveBeenCalled();
    expect(result.current.showDeleteDialog).toBe(false);
  });
});

describe('useBookingActions : suppression', () => {
  beforeEach(() => vi.clearAllMocks());

  it('supprime puis retourne à la liste des réservations', async () => {
    const { result, props } = setup();
    act(() => result.current.handleDeleteBookingClick());
    expect(result.current.showDeleteDialog).toBe(true);

    await act(() => result.current.handleDeleteBooking());
    expect(props.deleteBooking).toHaveBeenCalledWith('booking-0001abcd');
    expect(h.push).toHaveBeenCalledWith('/dashboard/bookings');
    expect(result.current.showDeleteDialog).toBe(false);
    expect(result.current.deleteLoading).toBe(false);
  });

  it('affiche l’erreur sans quitter la page', async () => {
    const refused = setup({ deleteBooking: vi.fn(async () => ({ success: false })) });
    await act(() => refused.result.current.handleDeleteBooking());
    expect(h.addError).toHaveBeenCalledWith('Erreur lors de la suppression de la réservation');

    const crashing = setup({ deleteBooking: vi.fn(async () => { throw new Error('verrouillée'); }) });
    await act(() => crashing.result.current.handleDeleteBooking());
    expect(h.addError).toHaveBeenCalledWith('Erreur lors de la suppression : verrouillée');
    expect(h.push).not.toHaveBeenCalled();
  });
});

describe('useBookingActions : facture', () => {
  beforeEach(() => vi.clearAllMocks());

  it('génère et télécharge la facture, avec le détail Stripe si disponible', async () => {
    const save = vi.fn();
    h.generatePdf.mockResolvedValue({ save });
    h.stripeDetails.mockResolvedValue({ last4: '4242' });

    const { result } = setup({ booking: booking({ paymentIntentId: 'pi_123' }) });
    await act(() => result.current.handleGenerateInvoice());

    expect(h.stripeDetails).toHaveBeenCalledWith('pi_123');
    expect(h.generatePdf).toHaveBeenCalledWith(expect.objectContaining({ stripeDetails: { last4: '4242' } }));
    expect(save).toHaveBeenCalledWith('facture-FAC-2026-RES-42.pdf');
    expect(h.addSuccess).toHaveBeenCalledWith('Facture générée et téléchargée avec succès');
    expect(result.current.generatingInvoice).toBe(false);
  });

  it('se passe du détail Stripe introuvable et nomme la facture d’après l’id', async () => {
    const save = vi.fn();
    h.generatePdf.mockResolvedValue({ save });
    h.stripeDetails.mockResolvedValue(null);

    const { result } = setup({ booking: { ...booking({ paymentIntentId: 'pi_x' }), reservationNumber: undefined } });
    await act(() => result.current.handleGenerateInvoice());

    expect(h.generatePdf.mock.calls[0]![0]).not.toHaveProperty('stripeDetails');
    expect(save).toHaveBeenCalledWith('facture-FAC-2026-0001ABCD.pdf');
  });

  it('signale une erreur de génération', async () => {
    h.generatePdf.mockRejectedValue(new Error('jsPDF absent'));
    const { result } = setup();
    await act(() => result.current.handleGenerateInvoice());
    expect(h.stripeDetails).not.toHaveBeenCalled();
    expect(h.addError).toHaveBeenCalledWith('Erreur lors de la génération de la facture : jsPDF absent');
  });
});
