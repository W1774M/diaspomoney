import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ClinicsCarouselSection } from '../../components/features/home/ClinicsCarouselSection';
import { HeroSection } from '../../components/features/home/HeroSection';
import { HomeCountryFilterProvider } from '../../components/features/home/HomeCountryFilter';
import type { PresenceCountry } from '../../lib/presence-countries';

const countries: PresenceCountry[] = [
  { id: 'a', iso: 'CM', name: 'Cameroun', preposition: 'au', status: 'present', order: 1 },
  { id: 'b', iso: 'CG', name: 'Congo', preposition: 'au', status: 'present', order: 2 },
  { id: 'c', iso: 'CI', name: 'Côte d’Ivoire', preposition: 'en', status: 'coming_soon', order: 3 },
];

function renderHome() {
  return render(
    <HomeCountryFilterProvider>
      <HeroSection />
      <ClinicsCarouselSection />
    </HomeCountryFilterProvider>,
  );
}

/** Cartes de la liste visible (hors copie masquée du défilement). */
function visibleClinicCount() {
  const set = document.querySelector('#cliniques .marquee-set:not([data-marquee-clone])');
  return set ? set.querySelectorAll('article').length : 0;
}

describe('Filtre des cliniques par pays (home)', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ countries }),
    } as Response);
  });

  it('affiche les pays de l’admin, seuls les pays présents sont cliquables', async () => {
    renderHome();

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith('/api/presence-countries', expect.anything()));
    // La liste par défaut (6 pays) est remplacée par celle de l'admin (3 pays).
    await waitFor(() => expect(screen.queryByText('Bientôt au Rwanda')).not.toBeInTheDocument());

    expect(screen.getByRole('button', { name: 'Présent au Cameroun' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Présent au Congo' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Côte d’Ivoire/ })).not.toBeInTheDocument();
    expect(screen.getByText('Bientôt en Côte d’Ivoire')).toBeInTheDocument();
  });

  it('filtre le carrousel et revient à toute la liste', async () => {
    renderHome();
    await waitFor(() => expect(screen.queryByText('Bientôt au Rwanda')).not.toBeInTheDocument());

    const total = visibleClinicCount();
    expect(total).toBeGreaterThan(0);

    // Congo : aucune clinique pour l'instant.
    const congo = screen.getByRole('button', { name: 'Présent au Congo' });
    act(() => fireEvent.click(congo));
    expect(congo).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/Aucune clinique disponible au Congo/)).toBeInTheDocument();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();

    // Cameroun : toutes les cliniques actuelles sont à Douala.
    act(() => fireEvent.click(screen.getByRole('button', { name: 'Présent au Cameroun' })));
    expect(visibleClinicCount()).toBe(total);
    const status = screen.getByRole('status');
    expect(within(status).getByText(/disponibles au Cameroun/)).toBeInTheDocument();
    expect(screen.getByText('Santé au Cameroun')).toBeInTheDocument();

    // « Voir tous les pays » retire le filtre.
    act(() => fireEvent.click(within(status).getByRole('button', { name: /Voir tous les pays/ })));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByText('Santé à Douala')).toBeInTheDocument();
  });

  it('un second clic sur le pays actif retire le filtre', async () => {
    renderHome();
    await waitFor(() => expect(screen.queryByText('Bientôt au Rwanda')).not.toBeInTheDocument());

    const cameroun = screen.getByRole('button', { name: 'Présent au Cameroun' });
    act(() => fireEvent.click(cameroun));
    expect(cameroun).toHaveAttribute('aria-pressed', 'true');
    act(() => fireEvent.click(cameroun));
    expect(cameroun).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('garde la liste par défaut si l’API échoue', async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error('réseau'));
    renderHome();

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    expect(screen.getByText('Bientôt au Rwanda')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Présent au Cameroun' })).toBeInTheDocument();
  });
});
