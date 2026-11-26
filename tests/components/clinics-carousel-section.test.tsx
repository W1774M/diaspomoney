import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ClinicsCarouselSection } from '../../components/features/home/ClinicsCarouselSection';

describe('ClinicsCarouselSection', () => {
  it('affiche les cliniques partenaires sans tarifs sur les cartes', () => {
    render(<ClinicsCarouselSection />);

    expect(
      screen.getByRole('heading', { level: 2, name: /cliniques partenaires/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('CLINIQUE SAINT PETERSBOURG')).not.toHaveLength(0);
    expect(screen.getAllByText('CLINIQUE House Health')).not.toHaveLength(0);
    expect(screen.getAllByText('Clinique Dentaire Yosam')).not.toHaveLength(0);
    expect(screen.getAllByText(/Bonaberi - Douala/i)).not.toHaveLength(0);
    expect(screen.queryByText('Médecin généraliste : 19€')).not.toBeInTheDocument();
    expect(screen.queryByText('Médecin spécialiste : 29€')).not.toBeInTheDocument();
    // Carte = article dont le titre contient le bouton (pas de <h3> dans un <button>).
    const heading = screen.getAllByRole('heading', { level: 3, name: 'CLINIQUE SAINT PETERSBOURG' })[0];
    expect(heading?.querySelector('button')).not.toBeNull();
    expect(heading?.closest('button')).toBeNull();
  });

  it('ouvre le détail complet et propose de choisir une clinique', () => {
    render(<ClinicsCarouselSection />);

    const [saintPetersbourgCard] = screen.getAllByRole('button', {
      name: /CLINIQUE SAINT PETERSBOURG/i,
    });

    if (!saintPetersbourgCard) {
      throw new Error('Carte clinique introuvable');
    }

    fireEvent.click(saintPetersbourgCard);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Toutes les spécialités')).toBeInTheDocument();
    expect(screen.getByText('Médecin généraliste : 19€')).toBeInTheDocument();
    expect(screen.getByText('Médecin spécialiste : 29€')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Choisir cette clinique' })).toHaveAttribute(
      'href',
      '/services/health?clinic=clinique-saint-petersbourg',
    );
  });
});
