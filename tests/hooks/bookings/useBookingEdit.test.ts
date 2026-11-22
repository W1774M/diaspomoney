import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ addSuccess: vi.fn(), addError: vi.fn() }));
vi.mock('@/components/ui/Notification', () => ({
  useNotificationManager: () => ({ addSuccess: h.addSuccess, addError: h.addError }),
}));

import { useBookingEdit } from '@/hooks/bookings/useBookingEdit';

const json = (body: unknown, ok = true) => ({ ok, json: async () => body }) as Response;

const booking = (metadata: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
  ({
    id: 'b1',
    serviceId: 'consultation',
    appointmentDate: '2026-12-01T09:00:00.000Z',
    timeslot: '09:00',
    recipient: { firstName: 'Mamadou', lastName: 'Bah', phone: '+237600000000', email: 'mamadou@test.cm' },
    metadata: {
      clientFirstName: 'Awa',
      clientLastName: 'Diallo',
      clientEmail: 'awa@test.fr',
      clientPhone: '0600000000',
      serviceLabel: 'Consultation',
      servicePrice: '19',
      serviceDescription: 'Médecine générale',
      additionalOptions: '[{"id":"o1","label":"Rappel","price":5}]',
      promotionCode: 'BIENVENUE',
      basePrice: 19,
      ...metadata,
    },
    ...extra,
  }) as any;

function setup(b: any = booking()) {
  const refetch = vi.fn(async () => undefined);
  return { refetch, ...renderHook(() => useBookingEdit({ booking: b, bookingId: 'b1', refetch })) };
}

const lastBody = () => JSON.parse(String(vi.mocked(fetch).mock.calls.at(-1)![1]!.body));

describe('useBookingEdit : données initiales', () => {
  beforeEach(() => vi.mocked(fetch).mockReset());

  it('pré-remplit le formulaire depuis la réservation', () => {
    const { result } = setup();
    expect(result.current.editData).toMatchObject({
      clientFirstName: 'Awa',
      clientEmail: 'awa@test.fr',
      beneficiaryFirstName: 'Mamadou',
      beneficiaryEmail: 'mamadou@test.cm',
      serviceId: 'consultation',
      servicePrice: 19,
      timeslot: '09:00',
      additionalOptions: [{ id: 'o1', label: 'Rappel', price: 5 }],
      promotionCode: 'BIENVENUE',
    });
    expect(result.current.editData.appointmentDate).toBeInstanceOf(Date);
    expect(result.current.isPaymentCompleted).toBe(false);
  });

  it('ignore un prix illisible et accepte des options déjà en tableau', () => {
    const { result } = setup(booking({ servicePrice: 'gratuit', additionalOptions: [{ id: 'o2', price: 3 }] }));
    expect(result.current.editData.servicePrice).toBeUndefined();
    expect(result.current.editData.additionalOptions).toEqual([{ id: 'o2', price: 3 }]);
  });

  it('reste vide et inactif sans réservation', async () => {
    const { result } = setup(null);
    expect(result.current.editData).toEqual({});
    act(() => result.current.openEditModal());
    expect(result.current.isEditing).toBe(false);
    await act(() => result.current.saveBooking());
    await act(() => result.current.validatePromotionCode('X'));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.isPaymentCompleted).toBe(false);
  });

  it('ouvre et referme le formulaire en réinitialisant les saisies', () => {
    const { result } = setup();
    act(() => result.current.openEditModal());
    expect(result.current.isEditing).toBe(true);
    act(() => result.current.setEditData({ ...result.current.editData, clientFirstName: 'Modifié' }));
    act(() => result.current.closeEditModal());
    expect(result.current.isEditing).toBe(false);
    expect(result.current.editData.clientFirstName).toBe('Awa');
  });
});

describe('useBookingEdit : code promotionnel', () => {
  beforeEach(() => vi.mocked(fetch).mockReset());

  it('efface le code quand la saisie est vide', async () => {
    const { result } = setup();
    await act(() => result.current.validatePromotionCode('  '));
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.promoCodeData).toBeNull();
  });

  it('valide un code sur le montant prix + options', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      json({ success: true, valid: true, code: { _id: 'pc1', label: 'MOINS10', percentage: 10 }, discount: { percentage: 10, amount: 2.4 } }),
    );
    const { result } = setup();
    await act(() => result.current.validatePromotionCode(' moins10 '));

    expect(lastBody()).toEqual({ label: 'MOINS10', amount: 24 });
    expect(result.current.promoCodeData).toMatchObject({ label: 'MOINS10', discount: { amount: 2.4 } });
    expect(h.addSuccess).toHaveBeenCalledWith('Code promotionnel valide : 10% de réduction');
  });

  it('montre le refus de l’API ou l’erreur réseau', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ success: true, valid: false, error: 'Code expiré' }));
    const { result } = setup();
    await act(() => result.current.validatePromotionCode('VIEUX'));
    expect(result.current.promoCodeError).toBe('Code expiré');

    vi.mocked(fetch).mockResolvedValueOnce(json({ success: false }));
    await act(() => result.current.validatePromotionCode('AUTRE'));
    expect(result.current.promoCodeError).toBe('Code promotionnel invalide');

    vi.mocked(fetch).mockRejectedValueOnce(new Error('hors ligne'));
    await act(() => result.current.validatePromotionCode('RESEAU'));
    expect(result.current.promoCodeError).toBe('Erreur lors de la validation du code');
    expect(result.current.isValidatingPromoCode).toBe(false);
  });

  it('calcule le montant depuis basePrice texte quand le prix n’est pas saisi', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ success: false }));
    const { result } = setup(booking({ servicePrice: undefined, basePrice: '30', additionalOptions: undefined }));
    await act(() => result.current.validatePromotionCode('X'));
    expect(lastBody().amount).toBe(30);
  });
});

describe('useBookingEdit : enregistrement', () => {
  beforeEach(() => vi.mocked(fetch).mockReset());

  it('enregistre sans code : recalcule le total et retire la remise', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ success: true }));
    const { result, refetch } = setup(booking({ discountAmount: 5, promotionCodeId: 'old' }));
    act(() => result.current.openEditModal());
    await act(() => result.current.saveBooking());

    const [url, init] = vi.mocked(fetch).mock.calls[0]!;
    expect(url).toBe('/api/bookings/b1');
    expect(init!.method).toBe('PUT');
    const body = lastBody();
    expect(body.metadata).toMatchObject({ basePrice: 19, servicePrice: 19, optionsPrice: 5, totalAmount: 24, beneficiaryFirstName: 'Mamadou' });
    expect(body.metadata).not.toHaveProperty('promotionCode');
    expect(body.metadata).not.toHaveProperty('discountAmount');
    expect(body.appointmentDate).toBe('2026-12-01T09:00:00.000Z');
    expect(body.timeslot).toBe('09:00');
    expect(refetch).toHaveBeenCalled();
    expect(h.addSuccess).toHaveBeenCalledWith('Réservation mise à jour avec succès');
    expect(result.current.isEditing).toBe(false);
  });

  it('applique un code validé (remise de l’API, sinon pourcentage)', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ success: true, valid: true, code: { id: 'pc2', label: 'MOINS50', percentage: 50 }, discount: { percentage: 50 } }));
    const { result } = setup();
    await act(() => result.current.validatePromotionCode('MOINS50'));

    vi.mocked(fetch).mockResolvedValueOnce(json({ success: true }));
    await act(() => result.current.saveBooking());
    expect(lastBody().metadata).toMatchObject({
      promotionCode: 'MOINS50',
      promotionCodeId: 'pc2',
      discountPercentage: 50,
      discountAmount: 12,
      totalAmount: 12,
    });
  });

  it('ne touche pas aux montants d’une réservation déjà payée et vide les options', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ success: true }));
    const { result } = setup(booking({ paymentStatus: 'confirmed', totalAmount: 99 }, { recipient: undefined }));
    expect(result.current.isPaymentCompleted).toBe(true);
    // Prix retiré du formulaire (propriété omise : exactOptionalPropertyTypes interdit undefined).
    const { servicePrice: _retire, ...sansPrix } = result.current.editData;
    act(() => result.current.setEditData({ ...sansPrix, additionalOptions: [], appointmentDate: null }));
    await act(() => result.current.saveBooking());

    const body = lastBody();
    expect(body.metadata.totalAmount).toBe(99);
    expect(body.metadata.additionalOptions).toBe('[]');
    expect(body.appointmentDate).toBeNull();
    expect(body.metadata).not.toHaveProperty('beneficiaryFirstName');
  });

  it('affiche l’erreur HTTP ou applicative', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ error: 'Réservation verrouillée' }, false));
    const { result, refetch } = setup();
    await act(() => result.current.saveBooking());
    expect(h.addError).toHaveBeenCalledWith('Erreur lors de la mise à jour : Réservation verrouillée');

    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => { throw new Error('pas du JSON'); } } as unknown as Response);
    await act(() => result.current.saveBooking());
    expect(h.addError).toHaveBeenLastCalledWith('Erreur lors de la mise à jour : Erreur lors de la mise à jour de la réservation');

    vi.mocked(fetch).mockResolvedValueOnce(json({ success: false }));
    await act(() => result.current.saveBooking());
    expect(h.addError).toHaveBeenLastCalledWith('Erreur lors de la mise à jour : Erreur lors de la mise à jour');
    expect(refetch).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });
});
