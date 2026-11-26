import { describe, expect, it } from 'vitest';
import { accountActivationTemplate } from '@/lib/email/templates/account-activation';
import { bookingTakeChargeTemplate } from '@/lib/email/templates/booking-take-charge';
import { feedbackRequestTemplate } from '@/lib/email/templates/feedback-request';
import { passwordResetTemplate } from '@/lib/email/templates/password-reset';
import { paymentConfirmationTemplate } from '@/lib/email/templates/payment-confirmation';
import { paymentLinkTemplate } from '@/lib/email/templates/payment-link';
import { providerAssignmentTemplate } from '@/lib/email/templates/provider-assignment';
import { welcomeTemplate } from '@/lib/email/templates/welcome';

describe('templates email', () => {
  it('construit le message de bienvenue avec et sans lien de connexion', () => {
    const withLogin = welcomeTemplate('Awa', '"https://diaspomoney.fr/verify"', "'https://diaspomoney.fr/login'");
    const withoutLogin = welcomeTemplate('Awa', 'https://diaspomoney.fr/verify');

    expect(withLogin.subject).toContain('Awa');
    expect(withLogin.html).toContain('https://diaspomoney.fr/verify');
    expect(withLogin.html).toContain('https://diaspomoney.fr/login');
    expect(withLogin.text).toContain('Dashboard');
    expect(withoutLogin.html).not.toContain('Accéder à mon Dashboard');
  });

  it('formate le montant en nombre ou en texte', () => {
    const numeric = paymentConfirmationTemplate('Awa', 12.5, 'EUR', 'Consultation');
    const textual = paymentConfirmationTemplate('Awa', '12,50', 'EUR', 'Consultation');
    const link = paymentLinkTemplate(
      'Awa',
      'RES-1',
      'Consultation',
      40,
      'EUR',
      '"https://pay.diaspomoney.fr/x"',
    );
    const linkText = paymentLinkTemplate(
      'Awa',
      'RES-1',
      'Consultation',
      '40,00',
      'XOF',
      'https://pay.diaspomoney.fr/x',
    );

    expect(numeric.html).toContain('12.50');
    expect(textual.html).toContain('12,50');
    expect(link.subject).toContain('RES-1');
    expect(link.html).toContain('https://pay.diaspomoney.fr/x');
    expect(linkText.html).toContain('XOF');
  });

  it('couvre les variantes de prise en charge, feedback, reset et activation', () => {
    const withAmount = bookingTakeChargeTemplate('Awa', 'RES-9', 'Santé', 80, 'EUR');
    const withoutAmount = bookingTakeChargeTemplate('Awa', 'RES-9', 'Santé', 'offert');
    const noAmount = bookingTakeChargeTemplate('Awa', 'RES-9', 'Santé');
    const feedback = feedbackRequestTemplate(
      'Awa',
      'RES-9',
      'Santé',
      '"https://diaspomoney.fr/feedback/1"',
    );
    const reset = passwordResetTemplate('Awa', 'https://diaspomoney.fr/reset');
    const activation = accountActivationTemplate('Awa', '"https://diaspomoney.fr/activate"');

    expect(withAmount.html).toContain('80.00');
    expect(withoutAmount.html).toContain('offert');
    expect(noAmount.html).not.toContain('Montant');
    expect(feedback.subject).toContain('RES-9');
    expect(feedback.html).toContain('https://diaspomoney.fr/feedback/1');
    expect(reset.subject).toContain('mot de passe');
    expect(activation.html).toContain('https://diaspomoney.fr/activate');
  });

  it('détaille une attribution prestataire, ou reste minimale', () => {
    const full = providerAssignmentTemplate({
      providerName: '  Dr Ndiaye  ',
      reservationNumber: 'RES-2',
      serviceName: 'Visite',
      appointmentDate: '2026-12-01',
      appointmentTime: '10:00',
      clientName: 'Awa Diop',
      clientEmail: 'awa@example.com',
      clientPhone: '+221',
      beneficiaryName: 'Moussa',
      beneficiaryPhone: '+33',
      notes: 'Apporter le carnet',
    });
    const dateOnly = providerAssignmentTemplate({
      reservationNumber: 'RES-3',
      serviceName: 'Visite',
      appointmentDate: '2026-12-02',
    });
    const timeOnly = providerAssignmentTemplate({
      reservationNumber: 'RES-4',
      serviceName: 'Visite',
      appointmentTime: '11:00',
    });

    expect(full.subject).toContain('RES-2');
    expect(full.html).toContain('Dr Ndiaye');
    expect(full.html).toContain('2026-12-01 à 10:00');
    expect(full.text).toContain('Apporter le carnet');
    expect(dateOnly.html).toContain('2026-12-02');
    expect(timeOnly.html).toContain('11:00');
    expect(timeOnly.html).toContain('Prestataire');
  });
});
