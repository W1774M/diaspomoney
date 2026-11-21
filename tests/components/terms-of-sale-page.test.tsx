import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TermsOfSalePage from '../../app/terms-of-sale/page';

describe('TermsOfSalePage', () => {
  it('affiche les CGV officielles DiaspoMoney', () => {
    render(<TermsOfSalePage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /conditions générales de vente \(cgv\)/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '1. OBJET' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '12. LOI APPLICABLE' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Cour d’appel de Rouen/)).toBeInTheDocument();
  });
});
