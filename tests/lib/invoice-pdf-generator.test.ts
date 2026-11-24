import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InvoiceData } from '@/lib/invoice-pdf-generator';

const { addImage, addPage, html2canvas } = vi.hoisted(() => ({
  addImage: vi.fn(),
  addPage: vi.fn(),
  html2canvas: vi.fn(),
}));

vi.mock('html2canvas', () => ({ default: html2canvas }));
vi.mock('jspdf', () => ({
  jsPDF: vi.fn(function JsPDF(this: { addImage: typeof addImage; addPage: typeof addPage }) {
    this.addImage = addImage;
    this.addPage = addPage;
  }),
}));

import { generateInvoicePDF, getStripePaymentDetails } from '@/lib/invoice-pdf-generator';

const companyInfo: InvoiceData['companyInfo'] = {
  name: 'DiaspoMoney',
  address: '1 rue de la Paix',
  city: 'Paris',
  postalCode: '75002',
  country: 'France',
  email: 'hello@diaspomoney.fr',
  phone: '+331',
  siret: '123',
  vatNumber: 'FR123',
  website: 'https://diaspomoney.fr',
};

function booking(metadata: Record<string, unknown>, id = '507f1f77bcf86cd799439011') {
  return {
    id,
    reservationNumber: 'RES-1',
    serviceId: 'svc-1',
    createdAt: '2026-06-01T10:00:00.000Z',
    metadata,
  } as InvoiceData['booking'];
}

describe('facture PDF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    html2canvas.mockResolvedValue({
      height: 4000,
      width: 794,
      toDataURL: () => 'data:image/png;base64,xx',
    });
  });

  it('compose une facture payée, avec options et montant déjà totalisé', async () => {
    const doc = await generateInvoicePDF({
      booking: booking({
        clientFirstName: 'Awa',
        clientLastName: 'Diop',
        clientEmail: 'awa@example.com',
        clientPhone: '+221',
        serviceLabel: 'Consultation',
        serviceDescription: 'Visite',
        totalAmount: 80,
        additionalOptions: [{ label: 'Déplacement', price: 15 }, { id: 'opt', price: '5' }],
      }),
      companyInfo,
      stripeDetails: {
        paymentIntentId: 'pi_1',
        amount: 8000,
        currency: 'eur',
        status: 'succeeded',
        created: 1_780_000_000,
        paymentMethod: { type: 'card', card: { brand: 'visa', last4: '4242' } },
      },
    });
    expect(doc.addImage).toHaveBeenCalled();
    expect(doc.addPage).toHaveBeenCalled();
  });

  it('recalcule le montant depuis les prix texte, et ignore des options illisibles', async () => {
    html2canvas.mockResolvedValueOnce({
      height: 100,
      width: 794,
      toDataURL: () => 'data:image/png;base64,xx',
    });
    await generateInvoicePDF({
      booking: booking(
        {
          clientName: 'Awa',
          servicePrice: '40,50',
          optionsPrice: '10',
          discountAmount: '5,50',
          additionalOptions: '{pas du json',
        },
        'abcdef1234567890',
      ),
      companyInfo: {
        name: companyInfo.name,
        address: companyInfo.address,
        city: companyInfo.city,
        postalCode: companyInfo.postalCode,
        country: companyInfo.country,
        email: companyInfo.email,
      },
    });
    expect(addPage).not.toHaveBeenCalled();
  });

  it('lit le PaymentIntent, ou retourne null', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ paymentIntentId: 'pi_1', status: 'succeeded' }) })
      .mockResolvedValueOnce({ ok: false })
      .mockRejectedValueOnce(new Error('réseau'));
    vi.stubGlobal('fetch', fetchMock);

    expect(await getStripePaymentDetails('pi 1')).toMatchObject({ paymentIntentId: 'pi_1' });
    expect(await getStripePaymentDetails('pi_2')).toBeNull();
    expect(await getStripePaymentDetails('pi_3')).toBeNull();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('pi%201');
    vi.unstubAllGlobals();
  });
});
