import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TermsAndConditionsPage from '@/app/terms-and-conditions/page';

describe('TermsAndConditionsPage', () => {
  it('affiche les CGU officielles DiaspoMoney', () => {
    render(<TermsAndConditionsPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /conditions générales d.utilisation \(cgu\)/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '1. OBJET' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: '11. DROIT APPLICABLE' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Centre de Médiation de la Consommation \(CM2C\)/)).toBeInTheDocument();
  });
});
