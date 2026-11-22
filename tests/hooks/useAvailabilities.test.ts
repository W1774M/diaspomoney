import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAvailabilities } from '@/hooks/availabilities/useAvailabilities';

type Reply = { ok?: boolean; body: unknown } | Error;

/** Répond selon « MÉTHODE url » ; la liste GET renvoie `rules`. */
function api(rules: any[], replies: Record<string, Reply> = {}) {
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    // Appels hors API (journalisation côté client…) : ignorés.
    if (!String(input).startsWith('/api/')) return { ok: true, status: 200, json: async () => ({}) } as Response;
    const key = `${init?.method ?? 'GET'} ${String(input)}`;
    const reply = replies[key] ?? (key.startsWith('GET /api/availabilities') ? { body: { success: true, data: rules } } : undefined);
    if (!reply) throw new Error(`appel inattendu : ${key}`);
    if (reply instanceof Error || typeof reply === 'string') throw reply;
    return { ok: reply.ok ?? true, status: reply.ok === false ? 400 : 200, json: async () => reply.body } as Response;
  });
}

const rule = (id: string, isActive = true) => ({ id, name: `Règle ${id}`, type: 'weekly', isActive, timeSlots: [] });
const calls = () =>
  vi.mocked(fetch)
    .mock.calls.filter(([u]) => String(u).startsWith('/api/'))
    .map(([u, i]) => `${i?.method ?? 'GET'} ${String(u)}`);

async function mount(type?: 'weekly' | 'monthly' | 'custom') {
  const hook = renderHook(() => useAvailabilities(type));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  return hook;
}

describe('useAvailabilities : chargement', () => {
  beforeEach(() => vi.mocked(fetch).mockReset());

  it('charge les règles au montage, filtrées par type', async () => {
    api([rule('r1'), rule('r2')]);
    const { result } = await mount('weekly');
    expect(result.current.availabilities).toHaveLength(2);
    expect(result.current.error).toBeNull();
    expect(calls()).toEqual(['GET /api/availabilities?type=weekly']);
  });

  it('vide la liste et expose l’erreur de l’API ou d’un format invalide', async () => {
    api([], { 'GET /api/availabilities': { ok: false, body: { error: 'Non autorisé' } } });
    const { result } = await mount();
    expect(result.current.error).toBe('Non autorisé');
    expect(result.current.availabilities).toEqual([]);

    api([], { 'GET /api/availabilities': { ok: false, body: {} } });
    await act(() => result.current.refreshAvailabilities());
    expect(result.current.error).toBe('Erreur lors de la récupération des disponibilités');

    api([], { 'GET /api/availabilities': { body: { success: false } } });
    await act(() => result.current.refreshAvailabilities());
    expect(result.current.error).toBe('Format de réponse invalide');

    api([], { 'GET /api/availabilities': 'panne' as unknown as Error });
    await act(() => result.current.refreshAvailabilities());
    expect(result.current.error).toBe('Erreur inconnue');
  });

  it('rafraîchit avec un autre type à la demande', async () => {
    api([rule('r1')]);
    const { result } = await mount('weekly');
    await act(() => result.current.refreshAvailabilities('custom'));
    expect(calls().at(-1)).toBe('GET /api/availabilities?type=custom');
  });
});

describe('useAvailabilities : écriture', () => {
  beforeEach(() => vi.mocked(fetch).mockReset());

  it('crée, met à jour et supprime une règle puis recharge la liste', async () => {
    api([rule('r1')], {
      'POST /api/availabilities': { body: { success: true, data: rule('r2') } },
      'PUT /api/availabilities/r1': { body: { success: true, data: { ...rule('r1'), name: 'Matin' } } },
      'DELETE /api/availabilities/r1': { body: { success: true } },
    });
    const { result } = await mount('weekly');

    let created: any;
    await act(async () => {
      created = await result.current.createAvailabilityRule({ name: 'Règle r2', type: 'weekly', timeSlots: [] });
    });
    expect(created).toMatchObject({ id: 'r2' });

    let updated: any;
    await act(async () => {
      updated = await result.current.updateAvailabilityRule('r1', { name: 'Matin' });
    });
    expect(updated).toMatchObject({ name: 'Matin' });

    let deleted = false;
    await act(async () => {
      deleted = await result.current.deleteAvailabilityRule('r1');
    });
    expect(deleted).toBe(true);
    expect(calls().filter((c) => c === 'GET /api/availabilities?type=weekly')).toHaveLength(4);
  });

  it('renvoie null ou false et expose l’erreur en cas d’échec', async () => {
    api([rule('r1')], {
      'POST /api/availabilities': { ok: false, body: { error: 'Créneaux qui se chevauchent' } },
      'PUT /api/availabilities/r1': { body: { success: false } },
      'DELETE /api/availabilities/r1': { ok: false, body: {} },
      'PUT /api/availabilities/r9': { ok: false, body: {} },
      'DELETE /api/availabilities/r9': { body: { success: false } },
    });
    const { result } = await mount();

    await act(async () => {
      expect(await result.current.createAvailabilityRule({ name: 'x', type: 'weekly', timeSlots: [] })).toBeNull();
    });
    expect(result.current.error).toBe('Créneaux qui se chevauchent');

    await act(async () => {
      expect(await result.current.updateAvailabilityRule('r1', {})).toBeNull();
    });
    expect(result.current.error).toBe('Format de réponse invalide');

    await act(async () => {
      expect(await result.current.updateAvailabilityRule('r9', {})).toBeNull();
    });
    expect(result.current.error).toBe('Erreur lors de la mise à jour de la règle');

    await act(async () => {
      expect(await result.current.deleteAvailabilityRule('r1')).toBe(false);
    });
    expect(result.current.error).toBe('Erreur lors de la suppression de la règle');

    await act(async () => {
      expect(await result.current.deleteAvailabilityRule('r9')).toBe(false);
    });
    expect(result.current.error).toBe('Format de réponse invalide');
  });

  it('gère une création sans message d’erreur et une réponse sans données', async () => {
    api([], { 'POST /api/availabilities': { ok: false, body: {} } });
    const { result } = await mount();
    await act(() => result.current.createAvailabilityRule({ name: 'x', type: 'weekly', timeSlots: [] }));
    expect(result.current.error).toBe('Erreur lors de la création de la règle');

    api([], { 'POST /api/availabilities': { body: { success: true } } });
    await act(() => result.current.createAvailabilityRule({ name: 'x', type: 'weekly', timeSlots: [] }));
    expect(result.current.error).toBe('Format de réponse invalide');
  });

  it('bascule le statut d’une règle connue, refuse une règle inconnue', async () => {
    api([rule('r1', true)], { 'PUT /api/availabilities/r1': { body: { success: true, data: rule('r1', false) } } });
    const { result } = await mount();

    await act(async () => {
      expect(await result.current.toggleAvailabilityRuleStatus('r1')).toBe(true);
    });
    const put = vi.mocked(fetch).mock.calls.find(([u, i]) => i?.method === 'PUT' && String(u).startsWith('/api/'))!;
    expect(JSON.parse(String(put[1]!.body))).toEqual({ isActive: false });

    await act(async () => {
      expect(await result.current.toggleAvailabilityRuleStatus('inconnue')).toBe(false);
    });
    expect(result.current.error).toBe('Règle non trouvée');
  });
});
