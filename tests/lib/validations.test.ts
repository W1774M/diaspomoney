import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  bookingSchema,
  forgotPasswordSchema,
  loginSchema,
  paymentSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/validations';

/** Messages d'erreur d'un résultat safeParse, par chemin. */
const errors = (r: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] } | undefined;
}) =>
  Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]));

// Date fixe : les contrôles d'âge et d'expiration de carte en dépendent.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-22T12:00:00'));
});
afterAll(() => vi.useRealTimers());

describe('loginSchema et forgotPasswordSchema', () => {
  it('nettoie l’email et accepte un mot de passe de 8 à 128 caractères', () => {
    expect(loginSchema.parse({ email: '  awa@test.fr ', password: '12345678' })).toEqual({ email: 'awa@test.fr', password: '12345678' });
    expect(forgotPasswordSchema.parse({ email: 'awa@test.fr' })).toEqual({ email: 'awa@test.fr' });
  });

  it('refuse un email absent ou mal formé et un mot de passe hors bornes', () => {
    expect(errors(loginSchema.safeParse({ email: '', password: '' }))).toEqual({ email: 'Format d\'email invalide', password: 'Le mot de passe doit contenir au moins 8 caractères' });
    expect(errors(loginSchema.safeParse({ email: 'pas-un-email', password: 'x'.repeat(129) }))).toEqual({
      email: 'Format d\'email invalide', password: 'Le mot de passe est trop long',
    });
    expect(errors(forgotPasswordSchema.safeParse({ email: `${'a'.repeat(250)}@b.fr` }))).toEqual({ email: 'Email trop long' });
  });
});

describe('resetPasswordSchema', () => {
  it('exige un mot de passe fort et identique à la confirmation', () => {
    expect(resetPasswordSchema.safeParse({ password: 'Fort!123', confirmPassword: 'Fort!123' }).success).toBe(true);
    expect(errors(resetPasswordSchema.safeParse({ password: 'faible123', confirmPassword: 'faible123' }))).toEqual({
      password: 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
    });
    expect(errors(resetPasswordSchema.safeParse({ password: 'Fort!123', confirmPassword: 'Fort!124' }))).toEqual({
      confirmPassword: 'Les mots de passe ne correspondent pas',
    });
  });
});

describe('registerSchema', () => {
  const valid = {
    firstName: ' Awa ', lastName: "N'Diaye-Ba", email: 'awa@test.fr', phone: '+33 6 12 34 56 78',
    dateOfBirth: '1990-05-01', countryOfResidence: 'FR', targetCountry: 'SN', targetCity: 'Dakar',
    selectedServices: 'HEALTH', password: 'Fort!123', confirmPassword: 'Fort!123',
    securityQuestion: 'ville', securityAnswer: 'Thiès', termsAccepted: true, kycConsent: true,
  };

  it('accepte une inscription complète et normalise nom et téléphone', () => {
    const r = registerSchema.parse(valid);
    expect(r).toMatchObject({ firstName: 'Awa', lastName: "N'Diaye-Ba", phone: '+33612345678' });
    expect(registerSchema.parse({ ...valid, phone: '06.12.34.56.78' }).phone).toBe('0612345678');
  });

  it('refuse un nom avec des caractères interdits, un téléphone trop court et un mineur', () => {
    expect(errors(registerSchema.safeParse({ ...valid, firstName: 'Awa2', phone: '+33 12', dateOfBirth: '2012-01-01' }))).toEqual({
      firstName: 'Prénom invalide',
      phone: 'Numéro de téléphone invalide. Format attendu: +[code pays][numéro] (ex: +33612345678)',
      dateOfBirth: 'Vous devez avoir au moins 18 ans',
    });
    expect(errors(registerSchema.safeParse({ ...valid, dateOfBirth: '1890-01-01' }))).toEqual({ dateOfBirth: 'Vous devez avoir au moins 18 ans' });
  });

  it('retire les balises et le mot « script » des champs texte', () => {
    expect(errors(registerSchema.safeParse({ ...valid, lastName: '<script>' }))).toEqual({ lastName: 'Nom invalide' });
    expect(registerSchema.parse({ ...valid, firstName: ' <Awa> ' }).firstName).toBe('Awa');
  });

  it('exige CGU, KYC et mots de passe concordants', () => {
    expect(errors(registerSchema.safeParse({ ...valid, termsAccepted: false, kycConsent: false, confirmPassword: 'x' }))).toEqual({
      termsAccepted: 'Vous devez accepter les conditions générales',
      kycConsent: 'Vous devez accepter la vérification KYC',
      confirmPassword: 'Les mots de passe ne correspondent pas',
    });
  });
});

describe('bookingSchema', () => {
  const personne = { firstName: 'Awa', lastName: 'Diallo', phone: '06 12 34 56 78' };
  const valid = {
    requester: { ...personne, email: 'awa@test.fr' },
    recipient: { firstName: 'Mamadou', lastName: 'Bah', phone: '33612345678' },
    timeslot: '09:00',
    selectedService: { id: 1, name: 'Consultation', price: 19 },
    country: 'Sénégal', address1: '12 rue de Thiès', postalCode: 'SN-123', city: 'Dakar',
    cardNumber: '4242 4242 4242 4242', expiryDate: '12/27', cvv: '123', cardholderName: 'Awa Diallo',
  };

  it('accepte une réservation complète (téléphones FR 0… ou 33…, carte Luhn)', () => {
    const r = bookingSchema.parse(valid);
    expect(r.requester.phone).toBe('0612345678');
    expect(r.recipient.phone).toBe('33612345678');
    expect(r.cardNumber).toBe('4242424242424242');
    expect(bookingSchema.parse({ ...valid, selectedService: null, address2: ' Bât. B ' }).address2).toBe('Bât. B');
  });

  it('refuse un téléphone non français, une carte invalide, expirée ou un CVV faux', () => {
    expect(errors(bookingSchema.safeParse({
      ...valid,
      recipient: { ...valid.recipient, phone: '+221 77 123 45 67' },
      cardNumber: '4242 4242 4242 4241',
      expiryDate: '10/26',
      cvv: '12a',
    }))).toEqual({
      'recipient.phone': 'Numéro de téléphone invalide',
      cardNumber: 'Numéro de carte invalide',
      expiryDate: 'La carte a expiré',
      cvv: 'CVV invalide',
    });
  });

  it('accepte une carte valable jusqu’à la fin du mois en cours', () => {
    expect(bookingSchema.safeParse({ ...valid, expiryDate: '11/26' }).success).toBe(true);
    expect(errors(bookingSchema.safeParse({ ...valid, expiryDate: '13/26' }))).toEqual({ expiryDate: 'Format de date invalide (MM/AA)' });
  });

  it('valide l’adresse de facturation', () => {
    expect(errors(bookingSchema.safeParse({ ...valid, country: 'S3n', address1: '1 r', postalCode: '75@01', city: 'D' }))).toEqual({
      country: 'Nom de pays invalide',
      address1: 'L\'adresse doit contenir au moins 5 caractères',
      postalCode: 'Code postal invalide',
      city: 'La ville doit contenir au moins 2 caractères',
    });
  });
});

describe('paymentSchema', () => {
  const valid = { cardNumber: '5555-5555-5555-4444', expiryDate: '11/26', cvv: ' 1234 ', cardholderName: 'Awa Diallo' };

  it('accepte une carte valide jusqu’au mois en cours, et nettoie le CVV', () => {
    expect(paymentSchema.parse(valid)).toEqual({ cardNumber: '5555555555554444', expiryDate: '11/26', cvv: '1234', cardholderName: 'Awa Diallo' });
    expect(paymentSchema.safeParse({ ...valid, expiryDate: '01/30' }).success).toBe(true);
  });

  it('refuse une carte invalide ou expirée (mois ou année passés) et un CVV trop court', () => {
    expect(errors(paymentSchema.safeParse({ ...valid, cardNumber: '5555 5555 5555 4445', expiryDate: '10/26', cvv: '12' }))).toEqual({
      cardNumber: 'Numéro de carte invalide', expiryDate: 'Date d\'expiration invalide', cvv: 'Code CVV invalide',
    });
    expect(errors(paymentSchema.safeParse({ ...valid, expiryDate: '12/25' }))).toEqual({ expiryDate: 'Date d\'expiration invalide' });
    expect(errors(paymentSchema.safeParse({ ...valid, expiryDate: '2026-12' }))).toEqual({ expiryDate: 'Date d\'expiration invalide' });
  });
});
