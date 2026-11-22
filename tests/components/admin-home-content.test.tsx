import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HomeAnnouncement, HomeBannerMessage } from '../../lib/home-content';

const notify = vi.hoisted(() => ({
  addSuccess: vi.fn(),
  addError: vi.fn(),
  addWarning: vi.fn(),
  addInfo: vi.fn(),
}));

vi.mock('@/components/ui/Notification', () => ({ useNotificationManager: () => notify }));
vi.mock('@/components/auth', () => ({
  AuthorizedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import HomeContentPage from '../../app/dashboard/home-content/page';
import { fromLocalInput, toLocalInput } from '../../app/dashboard/home-content/_components/shared';

const banner = (extra: Partial<HomeBannerMessage>): HomeBannerMessage => ({
  id: 'm1',
  icon: '🎉',
  textBefore: 'Nouvelle offre santé :',
  linkType: 'announcement',
  linkLabel: 'voir l’offre',
  linkHref: '',
  textAfter: 'à partir de 10€.',
  isActive: true,
  order: 1,
  startsAt: null,
  endsAt: null,
  ...extra,
});

const announcement = (extra: Partial<HomeAnnouncement>): HomeAnnouncement & { createdAt: string } => ({
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
  createdAt: '2026-01-01T00:00:00.000Z',
  ...extra,
});

let messages: HomeBannerMessage[];
let announcements: ReturnType<typeof announcement>[];
let calls: { url: string; method: string; body: unknown }[];

const json = (data: unknown, ok = true) => ({ ok, json: async () => data }) as Response;

beforeEach(() => {
  vi.clearAllMocks();
  calls = [];
  messages = [
    banner({}),
    banner({
      id: 'm2',
      icon: '🏠',
      textBefore: 'Travaux en Afrique ?',
      linkType: 'url',
      linkLabel: 'demandez un devis',
      linkHref: '/services/immo',
      textAfter: '.',
      order: 2,
      isActive: false,
    }),
  ];
  announcements = [
    announcement({}),
    announcement({
      id: 'a2',
      title: 'Rentrée scolaire',
      isActive: true,
      startsAt: '2099-09-01T00:00:00.000Z',
      frequencyHours: 24,
      version: 'a2:1',
    }),
  ];
  vi.mocked(global.fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body =
      init?.body instanceof FormData ? 'form-data' : init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });
    if (url === '/api/home-banner-messages' && method === 'GET') return json({ messages });
    if (url === '/api/home-announcements' && method === 'GET') return json({ announcements });
    if (url === '/api/home-announcements/images') return json({ url: '/api/home-announcements/images/abc' });
    if (method === 'POST' && (body as { textBefore?: string })?.textBefore === 'refus') {
      return json({ error: 'Erreur de validation', details: { issues: [{ message: 'Le message est vide' }] } }, false);
    }
    return json({ success: true });
  });
});

describe('Admin — contenu de la home : bandeau', () => {
  it('liste les messages avec leur statut et l’aperçu du bandeau', async () => {
    render(<HomeContentPage />);
    await screen.findAllByText('Travaux en Afrique ?');

    expect(screen.getByRole('tab', { name: 'Bandeau défilant' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Lien : ouvre l’annonce d’accueil')).toBeInTheDocument();
    expect(screen.getByText('Lien : /services/immo')).toBeInTheDocument();
    expect(screen.getByText('En ligne')).toBeInTheDocument();
    expect(screen.getByText('Désactivé')).toBeInTheDocument();
  });

  it('active, réordonne et supprime un message', async () => {
    render(<HomeContentPage />);
    await screen.findAllByText('Travaux en Afrique ?');

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Activer' })));
    expect(calls).toContainEqual({ url: '/api/home-banner-messages/m2', method: 'PATCH', body: { isActive: true } });

    await act(async () => fireEvent.click(screen.getAllByRole('button', { name: 'Monter' })[1]!));
    expect(calls).toContainEqual({ url: '/api/home-banner-messages/m2', method: 'PATCH', body: { order: 1 } });

    fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer' })[0]!);
    await act(async () =>
      fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer' }).at(-1)!),
    );
    await waitFor(() =>
      expect(calls).toContainEqual({ url: '/api/home-banner-messages/m1', method: 'DELETE', body: undefined }),
    );
  });

  it('crée un message avec un lien vers une page', async () => {
    render(<HomeContentPage />);
    await screen.findAllByText('Travaux en Afrique ?');

    fireEvent.click(screen.getByRole('button', { name: 'Nouveau message' }));
    fireEvent.click(screen.getByRole('button', { name: 'Choisir 🎁' }));
    fireEvent.change(screen.getByLabelText('Texte avant le lien'), { target: { value: 'Offre école' } });
    fireEvent.change(screen.getByLabelText('Lien'), { target: { value: 'url' } });
    fireEvent.change(screen.getByLabelText('Texte du lien'), { target: { value: 'découvrir' } });
    fireEvent.change(screen.getByLabelText('Adresse'), { target: { value: '/services/edu' } });
    fireEvent.change(screen.getByLabelText('Texte après le lien'), { target: { value: '!' } });
    fireEvent.change(screen.getByLabelText('Début'), { target: { value: '2026-12-01T09:00' } });

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' })));

    const post = calls.find((c) => c.method === 'POST');
    expect(post?.url).toBe('/api/home-banner-messages');
    expect(post?.body).toMatchObject({
      icon: '🎁',
      textBefore: 'Offre école',
      linkType: 'url',
      linkLabel: 'découvrir',
      linkHref: '/services/edu',
      textAfter: '!',
      isActive: true,
      startsAt: new Date('2026-12-01T09:00').toISOString(),
      endsAt: null,
    });
  });

  it('modifie un message existant et remonte les erreurs de validation', async () => {
    render(<HomeContentPage />);
    await screen.findAllByText('Travaux en Afrique ?');

    fireEvent.click(screen.getAllByRole('button', { name: 'Modifier' })[1]!);
    expect(screen.getByLabelText('Adresse')).toHaveValue('/services/immo');
    fireEvent.change(screen.getByLabelText('Lien'), { target: { value: 'none' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' })));
    expect(calls).toContainEqual(
      expect.objectContaining({
        url: '/api/home-banner-messages/m2',
        method: 'PATCH',
        body: expect.objectContaining({ linkType: 'none', linkLabel: '', linkHref: '' }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Nouveau message' }));
    fireEvent.change(screen.getByLabelText('Texte avant le lien'), { target: { value: 'refus' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' })));
    expect(notify.addError).toHaveBeenCalledWith('Erreur de validation : Le message est vide');
  });
});

describe('Admin — contenu de la home : annonce', () => {
  async function openAnnouncementTab() {
    render(<HomeContentPage />);
    await act(async () => fireEvent.click(screen.getByRole('tab', { name: 'Annonce d’accueil' })));
    await screen.findByText('Rentrée scolaire');
  }

  it('liste les annonces et marque celle affichée', async () => {
    await openAnnouncementTab();
    expect(screen.getByLabelText('Affichée actuellement')).toBeInTheDocument();
    expect(screen.getByText('Programmé')).toBeInTheDocument();
    expect(screen.getByText(/Une fois par jour/)).toBeInTheDocument();
  });

  it('crée une annonce avec une image téléversée', async () => {
    await openAnnouncementTab();
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle annonce' }));

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Promo Noël' } });
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff])], 'noel.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => fireEvent.change(fileInput, { target: { files: [file] } }));
    await waitFor(() =>
      expect(calls).toContainEqual({ url: '/api/home-announcements/images', method: 'POST', body: 'form-data' }),
    );

    fireEvent.change(screen.getByLabelText(/Description de l’image/), { target: { value: 'Sapin de Noël' } });
    fireEvent.change(screen.getByLabelText(/^Lien/), { target: { value: '/services/health' } });
    fireEvent.change(screen.getByLabelText(/^Bouton/), { target: { value: 'J’en profite' } });
    fireEvent.change(screen.getByLabelText(/Réafficher/), { target: { value: '0' } });
    fireEvent.click(screen.getByLabelText('Active'));

    // Aperçu en direct.
    expect(screen.getAllByText('Promo Noël').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: 'J’en profite' })).toHaveAttribute('href', '/services/health');

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' })));
    const post = calls.find((c) => c.url === '/api/home-announcements' && c.method === 'POST');
    expect(post?.body).toMatchObject({
      title: 'Promo Noël',
      imageUrl: '/api/home-announcements/images/abc',
      imageAlt: 'Sapin de Noël',
      href: '/services/health',
      ctaLabel: 'J’en profite',
      frequencyHours: 0,
      isActive: true,
    });
  });

  it('refuse une image trop lourde ou d’un format non pris en charge', async () => {
    await openAnnouncementTab();
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle annonce' }));
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const svg = new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' });
    await act(async () => fireEvent.change(fileInput, { target: { files: [svg] } }));
    expect(notify.addError).toHaveBeenCalledWith('Format non pris en charge (JPEG, PNG, WebP ou GIF)');

    const big = new File([new Uint8Array(3 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    await act(async () => fireEvent.change(fileInput, { target: { files: [big] } }));
    expect(notify.addError).toHaveBeenCalledWith('Image trop lourde (2 Mo maximum)');

    // Sans image, l'enregistrement est bloqué.
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Sans image' } });
    fireEvent.change(screen.getByLabelText(/Description de l’image/), { target: { value: 'Rien' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' })));
    expect(notify.addError).toHaveBeenCalledWith('Ajoutez une image');
    expect(calls.some((c) => c.url === '/api/home-announcements' && c.method === 'POST')).toBe(false);
  });

  it('désactive, modifie et supprime une annonce', async () => {
    await openAnnouncementTab();

    await act(async () => fireEvent.click(screen.getAllByRole('button', { name: 'Désactiver' })[0]!));
    expect(calls).toContainEqual({ url: '/api/home-announcements/a1', method: 'PATCH', body: { isActive: false } });

    fireEvent.click(screen.getAllByRole('button', { name: 'Modifier' })[1]!);
    expect(screen.getByLabelText('Titre')).toHaveValue('Rentrée scolaire');
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Rentrée 2099' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' })));
    expect(calls).toContainEqual(
      expect.objectContaining({
        url: '/api/home-announcements/a2',
        method: 'PATCH',
        body: expect.objectContaining({ title: 'Rentrée 2099', startsAt: '2099-09-01T00:00:00.000Z' }),
      }),
    );

    fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer' })[0]!);
    await act(async () =>
      fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer' }).at(-1)!),
    );
    await waitFor(() =>
      expect(calls).toContainEqual({ url: '/api/home-announcements/a1', method: 'DELETE', body: undefined }),
    );
  });
});

describe('Conversion des dates de diffusion', () => {
  it('fait l’aller-retour ISO ↔ champ datetime-local', () => {
    const iso = new Date('2026-12-01T09:30').toISOString();
    expect(toLocalInput(iso)).toBe('2026-12-01T09:30');
    expect(fromLocalInput('2026-12-01T09:30')).toBe(iso);
    expect(toLocalInput(null)).toBe('');
    expect(fromLocalInput('')).toBeNull();
  });
});
