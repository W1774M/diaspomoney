/**
 * QuoteFacade — création BTP / EDUCATION
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createBTPQuote, createEducationInquiry, quoteCreate } = vi.hoisted(() => ({
  createBTPQuote: vi.fn(),
  createEducationInquiry: vi.fn(),
  quoteCreate: vi.fn(),
}));

vi.mock('@/services/btp/btp.service', () => ({
  btpService: { createBTPQuote },
}));
vi.mock('@/services/education/education.service', () => ({
  educationService: { createEducationInquiry },
}));
vi.mock('@/domain/crm', () => ({
  Quote: { create: quoteCreate },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));
vi.mock('@/lib/decorators/log.decorator', () => ({
  Log: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));
vi.mock('@/lib/decorators/validate.decorator', () => ({
  Validate: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));
vi.mock('@/lib/decorators/audit.decorator', () => ({
  Audit: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));
vi.mock('@/lib/decorators/performance.decorator', () => ({
  Performance: () => (_t: unknown, _k: string, d: PropertyDescriptor) => d,
}));

import { QuoteFacade } from '@/facades/quote.facade';

describe('QuoteFacade', () => {
  let facade: QuoteFacade;

  beforeEach(() => {
    vi.clearAllMocks();
    facade = QuoteFacade.getInstance();
    createBTPQuote.mockResolvedValue({ id: 'btp-1', costEstimate: 1000 });
    createEducationInquiry.mockResolvedValue({ id: 'edu-1' });
    quoteCreate.mockReturnValue({ kind: 'BTP' });
  });

  it('crée un devis BTP et applique Quote.create si email présent', async () => {
    const result = await facade.createQuote({
      sector: 'BTP',
      contact: { email: 'awa@example.com', name: 'Awa' },
      projectType: 'rénovation',
      area: 50,
    });

    expect(result.success).toBe(true);
    expect(result.quote).toEqual({ id: 'btp-1', costEstimate: 1000 });
    expect(quoteCreate).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'BTP', contactEmail: 'awa@example.com' }),
    );
    expect(createBTPQuote).toHaveBeenCalled();
  });

  it('crée une inquiry EDUCATION', async () => {
    const result = await facade.createQuote({
      sector: 'EDUCATION',
      contactEmail: 'parent@example.com',
      clientId: 'u1',
      studentInfo: { firstName: 'Awa', lastName: 'Diallo' },
    });

    expect(result.success).toBe(true);
    expect(createEducationInquiry).toHaveBeenCalled();
    expect(quoteCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: 'EDUCATION',
        contactEmail: 'parent@example.com',
        clientId: 'u1',
      }),
    );
  });

  it('délègue sans Quote.create si email absent (BTP/EDUCATION)', async () => {
    const result = await facade.createQuote({
      sector: 'BTP',
      projectType: 'neuf',
    });
    expect(result.success).toBe(true);
    expect(quoteCreate).not.toHaveBeenCalled();
  });

  it('renvoie success false sur erreur service', async () => {
    createBTPQuote.mockRejectedValue(new Error('mongo down'));
    const result = await facade.createQuote({
      sector: 'BTP',
      contactEmail: 'a@b.co',
      projectType: 'x',
    });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/mongo down/);
  });
});
