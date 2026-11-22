import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PresenceCountry } from '../../lib/presence-countries';

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

import PresenceCountriesPage from '../../app/dashboard/presence-countries/page';

let countries: PresenceCountry[];
let calls: { url: string; method: string; body: unknown }[];

function jsonResponse(data: unknown, ok = true) {
  return { ok, json: async () => data } as Response;
}

beforeEach(() => {
  vi.clearAllMocks();
  calls = [];
  countries = [
    { id: 'a', iso: 'CM', name: 'Cameroun', preposition: 'au', status: 'present', order: 1 },
    { id: 'b', iso: 'CI', name: 'Côte d’Ivoire', preposition: 'en', status: 'coming_soon', order: 2 },
  ];
  vi.mocked(global.fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ url, method, body });
    if (method === 'GET') return jsonResponse({ countries });
    if (method === 'POST' && body?.iso === 'CM') {
      return jsonResponse({ error: 'Ce pays est déjà dans la liste' }, false);
    }
    return jsonResponse({ success: true });
  });
});

async function renderPage() {
  render(<PresenceCountriesPage />);
  await screen.findByText('Présent au Cameroun');
}

describe('Admin — pays de présence', () => {
  it('liste les pays avec leur statut', async () => {
    await renderPage();
    expect(screen.getByText('Bientôt en Côte d’Ivoire')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Repasser en bientôt' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Passer en présent' })).toBeInTheDocument();
  });

  it('fait passer un pays de « bientôt » à « présent »', async () => {
    await renderPage();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Passer en présent' })));

    expect(calls).toContainEqual({ url: '/api/presence-countries/b', method: 'PATCH', body: { status: 'present' } });
    expect(notify.addSuccess).toHaveBeenCalled();
  });

  it('ajoute un pays choisi dans la liste', async () => {
    await renderPage();
    fireEvent.change(screen.getByLabelText('Pays'), { target: { value: 'SN' } });
    // Nom et préposition proposés automatiquement, modifiables.
    expect(screen.getByLabelText('Nom affiché')).not.toHaveValue('');
    fireEvent.change(screen.getByLabelText('Nom affiché'), { target: { value: 'Sénégal' } });
    fireEvent.change(screen.getByLabelText('Préposition'), { target: { value: 'au' } });
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'present' } });
    expect(screen.getByText('Présent au Sénégal')).toBeInTheDocument();

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Ajouter' })));

    expect(calls).toContainEqual({
      url: '/api/presence-countries',
      method: 'POST',
      body: { iso: 'SN', name: 'Sénégal', preposition: 'au', status: 'present' },
    });
  });

  it('réordonne, modifie et retire un pays', async () => {
    await renderPage();

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Descendre Cameroun' })));
    expect(calls).toContainEqual({ url: '/api/presence-countries/a', method: 'PATCH', body: { order: 2 } });
    expect(calls).toContainEqual({ url: '/api/presence-countries/b', method: 'PATCH', body: { order: 1 } });

    fireEvent.click(screen.getByRole('button', { name: 'Modifier Cameroun' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom affiché pour Cameroun' }), { target: { value: 'Cameroun (Douala)' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' })));
    expect(calls).toContainEqual({
      url: '/api/presence-countries/a',
      method: 'PATCH',
      body: { name: 'Cameroun (Douala)', preposition: 'au' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Retirer Côte d’Ivoire' }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Retirer' })));
    await waitFor(() =>
      expect(calls).toContainEqual({ url: '/api/presence-countries/b', method: 'DELETE', body: undefined }),
    );
  });

  it('affiche l’erreur renvoyée par l’API', async () => {
    countries = [];
    await act(async () => render(<PresenceCountriesPage />));
    await screen.findByText(/Aucun pays/);
    fireEvent.change(screen.getByLabelText('Pays'), { target: { value: 'CM' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Ajouter' })));
    expect(notify.addError).toHaveBeenCalledWith('Ce pays est déjà dans la liste');
  });
});
