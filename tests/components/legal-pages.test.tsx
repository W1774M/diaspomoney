/**
 * Pages légales : mentions légales, CGU et CGV identifient l'éditeur réel (lib/legal/company.ts),
 * sans emplacement à compléter.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import LegalNoticePage from '../../app/legal-notice/page';
import TermsAndConditionsPage from '../../app/terms-and-conditions/page';
import TermsOfSalePage from '../../app/terms-of-sale/page';
import { formatEffectiveDate, legalIdentity } from '@/lib/legal/company';

const PLACEHOLDERS = /\[Date à insérer\]|\(adresse\)|\(email de contact\)|à compléter/i;

describe('Mentions légales', () => {
  it('donne éditeur, directeur de la publication, hébergeur et contact', () => {
    const { container } = render(<LegalNoticePage />);
    const text = container.textContent ?? '';
    expect(screen.getByRole('heading', { level: 1, name: 'Mentions légales' })).toBeInTheDocument();
    for (const expected of [
      'VALEUR ETHIC CONSEIL',
      'SARL',
      "42 rue d'Achères, 78600 Maisons-Laffitte, France",
      'SIREN : 500 085 709',
      'SIRET du siège : 500 085 709 00029',
      'TVA intracommunautaire : non attribué',
      'WE WIN SOLUTIONS – DIASPOMONEY (SAS), en cours de formation',
      'Théodore Ntone Priso',
      'IONOS SARL',
      '431 303 775 RCS Sarreguemines',
      'contact@diaspomoney.fr',
    ]) {
      expect(text).toContain(expected);
    }
    expect(screen.getByRole('link', { name: 'politique de confidentialité' })).toHaveAttribute('href', '/privacy-policy');
    expect(text).not.toMatch(PLACEHOLDERS);
  });
});

describe('CGU et CGV', () => {
  it('les CGU sont datées et nomment l’éditeur', () => {
    const { container } = render(<TermsAndConditionsPage />);
    const text = container.textContent ?? '';
    expect(text).toContain(`En vigueur à compter du : ${formatEffectiveDate()}`);
    expect(text).toContain(legalIdentity());
    expect(text).not.toContain('propriété de la société DIASPOMONEY');
    expect(text).not.toMatch(PLACEHOLDERS);
    expect(screen.getByRole('link', { name: 'mentions légales' })).toHaveAttribute('href', '/legal-notice');
  });

  it('les CGV nomment l’exploitant', () => {
    const { container } = render(<TermsOfSalePage />);
    expect(container.textContent).toContain(`(${legalIdentity()})`);
  });
});

describe('formatEffectiveDate', () => {
  it('écrit la date en français', () => {
    expect(formatEffectiveDate('2026-11-23')).toBe('23 novembre 2026');
    expect(formatEffectiveDate('2027-01-01')).toBe('1 janvier 2027');
  });
});
