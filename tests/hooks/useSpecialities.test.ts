import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSpecialities } from '@/hooks/specialities/useSpecialities';

const json = (body: unknown, status = 200) => ({ ok: status < 400, status, json: async () => body }) as Response;
const apiCalls = () => vi.mocked(fetch).mock.calls.filter(([u]) => String(u).startsWith('/api/'));

describe('useSpecialities', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
    vi.mocked(fetch).mockResolvedValue(json({ success: true, data: [{ id: 's1', name: 'Cardiologie', group: 'sante', createdAt: '2026-01-02' }] }));
  });

  it('charge une seule fois sans options (pas de boucle de requêtes)', async () => {
    const { result } = renderHook(() => useSpecialities());
    await waitFor(() => expect(result.current.loading).toBe(false));
    // Laisse le temps à une éventuelle boucle de se manifester.
    await act(() => new Promise((r) => setTimeout(r, 50)));

    expect(apiCalls()).toHaveLength(1);
    expect(result.current.specialities[0]).toMatchObject({ id: 's1', name: 'Cardiologie' });
    expect(result.current.specialities[0]!.createdAt).toEqual(new Date('2026-01-02'));
  });

  it('passe les filtres dans l’URL et recharge seulement quand ils changent', async () => {
    const hook = renderHook((o) => useSpecialities(o), { initialProps: { group: 'sante', isActive: true } });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    expect(String(apiCalls()[0]![0])).toBe('/api/specialities?group=sante&isActive=true');

    hook.rerender({ group: 'sante', isActive: true }); // nouvel objet, mêmes valeurs
    await act(() => new Promise((r) => setTimeout(r, 20)));
    expect(apiCalls()).toHaveLength(1);

    hook.rerender({ group: 'edu', isActive: true });
    await waitFor(() => expect(apiCalls()).toHaveLength(2));
    expect(String(apiCalls()[1]![0])).toBe('/api/specialities?group=edu&isActive=true');
  });

  it('expose les erreurs de l’API, de format et de réseau', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ error: 'Interdit' }, 403));
    const { result } = renderHook(() => useSpecialities());
    await waitFor(() => expect(result.current.error).toBe('Interdit'));

    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500, json: async () => { throw new Error('html'); } } as unknown as Response);
    await act(() => result.current.refetch());
    expect(result.current.error).toBe('Erreur lors du chargement des spécialités');

    vi.mocked(fetch).mockResolvedValueOnce(json({ success: false }));
    await act(() => result.current.refetch());
    expect(result.current.error).toBe('Format de réponse invalide');

    vi.mocked(fetch).mockRejectedValueOnce(new Error('hors ligne'));
    await act(() => result.current.refetch());
    expect(result.current.error).toBe('hors ligne');
    expect(result.current.specialities).toEqual([]);
  });
});
