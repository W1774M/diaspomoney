import { describe, expect, it } from 'vitest';
import {
  buildPlaceholderEmail,
  getProposalDisplayName,
  getProposalMissingInfo,
  isPlaceholderEmail,
  normalizePhone,
  ProviderProposalSchema,
} from '@/lib/csm/provider-proposal';

describe('ProviderProposalSchema', () => {
  it('accepte un nom et un téléphone seul (sans e-mail)', () => {
    const r = ProviderProposalSchema.safeParse({ lastName: 'Diallo', phone: '+221 77 123 45 67' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.type).toBe('INDIVIDUAL');
  });

  it('accepte un nom et un e-mail seul, normalisé en minuscules', () => {
    const r = ProviderProposalSchema.safeParse({ firstName: 'Awa', email: ' Awa@Exemple.FR ' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe('awa@exemple.fr');
  });

  it('exige au moins un e-mail ou un téléphone', () => {
    const r = ProviderProposalSchema.safeParse({ lastName: 'Diallo', email: '', phone: '  ' });
    expect(r.success).toBe(false);
  });

  it('exige un nom (ou le nom de l’établissement)', () => {
    expect(ProviderProposalSchema.safeParse({ phone: '0601020304' }).success).toBe(false);
    expect(
      ProviderProposalSchema.safeParse({ type: 'INSTITUTION', lastName: 'X', phone: '0601020304' }).success,
    ).toBe(false);
    expect(
      ProviderProposalSchema.safeParse({ type: 'INSTITUTION', companyName: 'Clinique', phone: '0601020304' }).success,
    ).toBe(true);
  });

  it('refuse un e-mail ou un téléphone invalide', () => {
    expect(ProviderProposalSchema.safeParse({ lastName: 'D', email: 'pas-un-email' }).success).toBe(false);
    expect(ProviderProposalSchema.safeParse({ lastName: 'D', phone: '12' }).success).toBe(false);
  });

  it('refuse une adresse technique saisie à la main', () => {
    const r = ProviderProposalSchema.safeParse({ lastName: 'D', email: 'x@a-completer.invalid' });
    expect(r.success).toBe(false);
  });
});

describe('adresse technique', () => {
  it('construit une adresse .invalid reconnue comme technique', () => {
    const email = buildPlaceholderEmail('ABC-123');
    expect(email).toBe('prestataire-abc123@a-completer.invalid');
    expect(isPlaceholderEmail(email)).toBe(true);
    expect(isPlaceholderEmail(buildPlaceholderEmail())).toBe(true);
    expect(isPlaceholderEmail('awa@exemple.fr')).toBe(false);
    expect(isPlaceholderEmail(undefined)).toBe(false);
  });
});

describe('aides', () => {
  it('normalise les téléphones', () => {
    expect(normalizePhone('+221 77-123.45 67')).toBe('+221771234567');
    expect(normalizePhone('06 01 02 03 04')).toBe('0601020304');
    expect(normalizePhone('')).toBe('');
  });

  it('donne le nom affiché et les informations manquantes', () => {
    const p = ProviderProposalSchema.parse({ lastName: 'Diallo', phone: '0601020304' });
    expect(getProposalDisplayName(p)).toBe('Diallo');
    expect(getProposalMissingInfo(p)).toEqual(['e-mail', 'catégorie', 'ville', 'prénom']);

    const inst = ProviderProposalSchema.parse({
      type: 'INSTITUTION',
      companyName: 'Clinique du Port',
      email: 'contact@clinique.sn',
      phone: '0601020304',
      category: 'HEALTH',
      city: 'Dakar',
    });
    expect(getProposalDisplayName(inst)).toBe('Clinique du Port');
    expect(getProposalMissingInfo(inst)).toEqual([]);
  });
});
