import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import HomeAnnouncementDialog from '../../components/features/home/HomeAnnouncementDialog';
import type { HomeAnnouncement } from '../../lib/home-content';

const announcement: HomeAnnouncement = {
  id: 'a1',
  title: 'Offre spéciale de 2 euros',
  message: '',
  imageUrl: '/img/ads/add-2euros.jpeg',
  imageAlt: 'Offre DiaspoMoney à 2 euros',
  href: '/services/health',
  ctaLabel: '',
  isActive: true,
  startsAt: null,
  endsAt: null,
  frequencyHours: 1,
  version: 'a1:1',
};

/** Stockage en mémoire : localStorage n'est pas toujours fourni par l'environnement de test. */
function installMemoryStorage() {
  const store = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, String(value)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  });
}

describe('HomeAnnouncementDialog', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('peut être ouverte manuellement par la bannière même après avoir été fermée', () => {
    // Fermée il y a peu : pas d'ouverture automatique.
    window.localStorage.setItem('diaspomoney.homeDialog.lastShownAt', String(Date.now()));
    window.localStorage.setItem('diaspomoney.homeDialog.version', announcement.version);
    render(<HomeAnnouncementDialog announcement={announcement} />);

    act(() => {
      window.dispatchEvent(new Event('diaspomoney:open-home-announcement'));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Offre spéciale de 2 euros')).toBeInTheDocument();
  });

  it('se réaffiche immédiatement quand l’annonce a été modifiée', () => {
    window.localStorage.setItem('diaspomoney.homeDialog.lastShownAt', String(Date.now()));
    window.localStorage.setItem('diaspomoney.homeDialog.version', 'a1:0');
    render(<HomeAnnouncementDialog announcement={announcement} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ne rend rien sans annonce en cours', () => {
    render(<HomeAnnouncementDialog announcement={null} />);

    act(() => {
      window.dispatchEvent(new Event('diaspomoney:open-home-announcement'));
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
