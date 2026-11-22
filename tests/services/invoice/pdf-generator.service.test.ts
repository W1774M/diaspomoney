// @vitest-environment node
/**
 * Génération du PDF de facture avec le vrai PDFKit : on capture les textes écrits dans le
 * document (le contenu est compressé dans le fichier) et on vérifie le PDF produit.
 */
import PDFDocument from 'pdfkit';
import * as Sentry from '@sentry/nextjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  passThrough: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
  findById: vi.fn(),
}));
vi.mock('@/lib/decorators/log.decorator', () => ({ Log: h.passThrough }));
vi.mock('@/lib/decorators/performance.decorator', () => ({ Performance: h.passThrough }));
vi.mock('@/repositories', () => ({ getUserRepository: () => ({ findById: h.findById }) }));

import { pdfGeneratorService, PDFGeneratorService } from '@/services/invoice/pdf-generator.service';

type Item = { description: string; quantity: number; unitPrice: number; total: number };
const invoice = (extra: Record<string, unknown> = {}) => ({
  id: 'inv1',
  invoiceNumber: 'FAC-2026-0001',
  userId: 'u1',
  status: 'PAID',
  currency: 'EUR',
  amount: 120,
  tax: 20,
  totalAmount: 120,
  createdAt: new Date('2026-11-22T10:00:00Z'),
  dueDate: '2026-12-22T10:00:00Z',
  items: [{ description: 'Consultation', quantity: 2, unitPrice: 50, total: 100 }] as Item[],
  metadata: {},
  ...extra,
}) as never;

let texts: string[] = [];
let textSpy: ReturnType<typeof vi.spyOn>;
const nbsp = (s: string) => s.replace(/[  ]/g, ' ');
const written = () => texts.map(nbsp).join('\n');

beforeEach(() => {
  vi.clearAllMocks();
  texts = [];
  const original = PDFDocument.prototype.text;
  textSpy = vi.spyOn(PDFDocument.prototype, 'text').mockImplementation(function (this: PDFKit.PDFDocument, ...args: unknown[]) {
    texts.push(String(args[0]));
    return (original as (...a: unknown[]) => PDFKit.PDFDocument).apply(this, args);
  });
  h.findById.mockImplementation(async (id: string) =>
    id === 'u1'
      ? { id: 'u1', name: 'Awa Diallo', email: 'awa@test.fr', address: '1 rue X', postalCode: '75010', city: 'Paris', countryOfResidence: 'France' }
      : { id, firstName: 'Dr', lastName: 'Bah', email: 'bah@test.fr', city: 'Dakar', country: 'Sénégal' },
  );
});

afterEach(() => {
  textSpy.mockRestore();
});

describe('PDFGeneratorService.generateInvoicePDF', () => {
  it('produit un PDF avec client, prestataire, lignes, TVA, totaux et notes', async () => {
    const pdf = await pdfGeneratorService.generateInvoicePDF(invoice({ metadata: { providerId: 'p1', notes: 'Merci de régler sous 30 jours' } }));
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);

    const out = written();
    for (const expected of [
      'FACTURE', 'N° FAC-2026-0001',
      'Facturé à:', 'Awa Diallo', 'awa@test.fr', '1 rue X\n75010 Paris\nFrance',
      'Prestataire:', 'Dr Bah', 'bah@test.fr', 'Dakar\nSénégal',
      "Date d'émission: 22/11/2026", "Date d'échéance: 22/12/2026", 'Statut: Payée',
      'Consultation', '50,00 €', '100,00 €',
      'Sous-total:', 'TVA:', '20,00 €', 'Total:', '120,00 €',
      'Notes:', 'Merci de régler sous 30 jours', 'Merci pour votre confiance !',
    ]) {
      expect(out).toContain(expected);
    }
    expect(h.findById).toHaveBeenCalledWith('p1');
  });

  it('se passe du client, du prestataire, de l’échéance, de la TVA et des notes', async () => {
    h.findById.mockResolvedValue(null);
    await pdfGeneratorService.generateInvoicePDF(invoice({ tax: 0, dueDate: undefined, totalAmount: undefined, status: 'BIZARRE', metadata: { providerId: 'p1' } }));
    const out = written();
    expect(out).not.toContain('Facturé à:');
    expect(out).not.toContain('Prestataire:');
    expect(out).not.toContain("Date d'échéance");
    expect(out).not.toContain('TVA:');
    expect(out).toContain('Statut: BIZARRE');
    expect(out).toContain('120,00 €');
  });

  it('compose les noms à défaut de nom complet', async () => {
    h.findById.mockImplementation(async (id: string) => (id === 'u1' ? { id, firstName: '', lastName: '' } : { id }));
    await pdfGeneratorService.generateInvoicePDF(invoice({ metadata: { providerId: 'p1' } }));
    expect(texts).toEqual(expect.arrayContaining(['Client', 'Prestataire']));
  });

  it.each([
    ['DRAFT', 'Brouillon'], ['PENDING', 'En attente'], ['OVERDUE', 'En retard'], ['CANCELLED', 'Annulée'], ['SENT', 'Envoyée'],
  ])('traduit le statut %s', async (status, label) => {
    await pdfGeneratorService.generateInvoicePDF(invoice({ status }));
    expect(written()).toContain(`Statut: ${label}`);
  });

  it('ajoute le pied de page sur chaque page', async () => {
    const items = Array.from({ length: 40 }, (_, i) => ({ description: `Ligne ${i}`, quantity: 1, unitPrice: 1, total: 1 }));
    const pdf = await pdfGeneratorService.generateInvoicePDF(invoice({ items }));
    const pages = (pdf.toString('latin1').match(/\/Type \/Page\b/g) || []).length;
    // 40 lignes tiennent sur quelques pages (et non une page par cellule)
    expect(pages).toBeGreaterThan(1);
    expect(pages).toBeLessThanOrEqual(4);
    const footers = texts.filter((t) => t === 'DiaspoMoney - Plateforme de services pour la diaspora');
    expect(footers).toHaveLength(pages);
    for (let i = 0; i < 40; i++) expect(texts.filter((t) => t === `Ligne ${i}`)).toHaveLength(1);
    expect(texts.filter((t) => t === 'Description').length).toBe(pages);
  });

  it('remonte une erreur de lecture du client', async () => {
    h.findById.mockRejectedValueOnce(new Error('mongo HS'));
    await expect(pdfGeneratorService.generateInvoicePDF(invoice())).rejects.toThrow('mongo HS');
    expect(Sentry.captureException).toHaveBeenCalled();
  });

  it('est un singleton', () => {
    expect(PDFGeneratorService.getInstance()).toBe(pdfGeneratorService);
  });
});
