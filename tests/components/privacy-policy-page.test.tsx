import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PrivacyPolicyPage from '../../app/privacy-policy/page';

describe('PrivacyPolicyPage', () => {
  it('affiche la politique de confidentialité officielle DiaspoMoney', () => {
    render(<PrivacyPolicyPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /politique de confidentialité \(p2c\)/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Définitions Préalables Sommaires' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '11. Contact' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/Article 6\.1\.b RGPD/).length).toBeGreaterThan(0);
    // Accès du support aux comptes : lecture seule, durée limitée, journalisé
    expect(screen.getByText(/Accès du support à votre compte/)).toBeInTheDocument();
    expect(screen.getByText(/se fait en lecture\s+seule/)).toBeInTheDocument();
  });
});
