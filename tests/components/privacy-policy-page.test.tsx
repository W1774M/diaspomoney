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

  it('identifie le responsable du traitement, sans emplacement à compléter', () => {
    const { container } = render(<PrivacyPolicyPage />);
    const text = container.textContent ?? '';
    expect(text).toContain('VALEUR ETHIC CONSEIL');
    expect(text).toContain('SIREN 500 085 709');
    expect(text).toContain("42 rue d'Achères, 78600 Maisons-Laffitte");
    expect(text).toContain('En vigueur à compter du : 23 novembre 2026');
    expect(text).toContain('Aucun délégué à la protection des données (DPO)');
    expect(text).not.toMatch(/\[Date à insérer\]|\(adresse\)|\(email|\(Email du DPO\)|\(Adresse du DPO\)/);
  });
});
