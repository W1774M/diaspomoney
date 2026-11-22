import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useUsers } from '@/hooks/useUsers';

const okResponse = (body: unknown) => ({ ok: true, json: async () => body }) as Response;
const user = (id: string, email = `${id}@test.fr`) => ({ _id: id, email, firstName: 'A', lastName: 'B', roles: ['CUSTOMER'], status: 'ACTIVE', createdAt: new Date() });

describe('useUsers', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('charge les utilisateurs avec les filtres dans l’URL', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse({ success: true, data: [user('u1'), user('u2')], total: 2 }));

    const { result } = renderHook(() => useUsers({ role: 'PROVIDER', status: 'ACTIVE', search: 'awa', limit: 10, page: 2 }));

    await waitFor(() => expect(result.current.users).toHaveLength(2));
    expect(result.current.total).toBe(2);
    expect(result.current.error).toBeNull();
    const url = String(vi.mocked(fetch).mock.calls[0]![0]);
    expect(url).toContain('role=PROVIDER');
    expect(url).toContain('status=ACTIVE');
    expect(url).toContain('search=awa');
    expect(url).toContain('limit=10');
    expect(url).toContain('page=2');
  });

  it('déduit la page depuis offset et limit', async () => {
    vi.mocked(fetch).mockResolvedValue(okResponse({ success: true, data: [], total: 0 }));
    renderHook(() => useUsers({ limit: 20, offset: 40 }));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toContain('page=3');
  });

  it('expose une erreur quand l’API échoue ou répond success: false', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.error).toBe('Failed to fetch users'));

    vi.mocked(fetch).mockResolvedValueOnce(okResponse({ success: false, error: 'Accès refusé' }));
    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(result.current.error).toBe('Accès refusé'));
  });

  it('relance sur demande et remplace la liste si elle a changé', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(okResponse({ success: true, data: [user('u1')], total: 1 }));
    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.users).toHaveLength(1));
    const first = result.current.users;

    // Même contenu : la référence est conservée (pas de rendu inutile).
    vi.mocked(fetch).mockResolvedValueOnce(okResponse({ success: true, data: [user('u1')], total: 1 }));
    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(result.current.users).toBe(first);

    // E-mail modifié : nouvelle liste.
    vi.mocked(fetch).mockResolvedValueOnce(okResponse({ success: true, data: [user('u1', 'nouveau@test.fr')], total: 1 }));
    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(result.current.users[0]!.email).toBe('nouveau@test.fr'));

    // Autre utilisateur, même taille : nouvelle liste.
    vi.mocked(fetch).mockResolvedValueOnce(okResponse({ success: true, data: [user('u9')], total: 1 }));
    await act(async () => {
      result.current.refetch();
    });
    await waitFor(() => expect(result.current.users[0]!._id).toBe('u9'));
  });
});
