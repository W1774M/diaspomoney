import * as Sentry from '@sentry/nextjs';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useServiceOptions } from '@/hooks/services/useServiceOptions';
import { useServices } from '@/hooks/services/useServices';

const json = (body: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => body }) as Response;

// Les deux hooks partagent la même mécanique : une seule série de tests, deux cibles.
const cases = [
  {
    name: 'useServices',
    url: '/api/services',
    use: (o: { category?: string; isActive?: boolean }) => {
      const r = useServices(o);
      return { items: r.services, loading: r.loading, error: r.error, refetch: r.refetch };
    },
    raw: { _id: 'mongo-1', category: 'HEALTH', label: 'Consultation', description: 'd', price: 19 },
    mapped: { id: 'mongo-1', _id: 'mongo-1', isActive: true, important: false, optional: false, metadata: {}, associatedOptions: [] },
    defaultError: 'Erreur lors du chargement des services',
  },
  {
    name: 'useServiceOptions',
    url: '/api/service-options',
    use: (o: { category?: string; isActive?: boolean }) => {
      const r = useServiceOptions(o);
      return { items: r.options, loading: r.loading, error: r.error, refetch: r.refetch };
    },
    raw: { _id: 'opt-1', category: 'HEALTH', label: 'Rappel SMS', description: 'd', price: 2 },
    mapped: { id: 'opt-1', optional: true, isActive: true, associatedServices: [] },
    defaultError: 'Erreur lors du chargement des options',
  },
] as const;

describe.each(cases)('$name', ({ url, use, raw, mapped, defaultError }) => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
    vi.mocked(Sentry.captureException).mockClear();
  });

  async function mount(options: { category?: string; isActive?: boolean } = {}) {
    const hook = renderHook((o) => use(o), { initialProps: options });
    await waitFor(() => expect(hook.result.current.loading).toBe(false));
    return hook;
  }

  it('charge et normalise la liste, avec les filtres dans l’URL', async () => {
    vi.mocked(fetch).mockResolvedValue(json({ success: true, data: [raw] }));
    const { result } = await mount({ category: 'HEALTH', isActive: false });

    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toBe(`${url}?category=HEALTH&isActive=false`);
    expect(result.current.items).toEqual([expect.objectContaining({ ...mapped, label: raw.label })]);
    expect(result.current.error).toBeNull();
  });

  it('ne recharge pas pour des options identiques, recharge quand elles changent', async () => {
    vi.mocked(fetch).mockResolvedValue(json({ success: true, data: [] }));
    const hook = await mount({ category: 'HEALTH' });
    hook.rerender({ category: 'HEALTH' });
    expect(fetch).toHaveBeenCalledTimes(1);

    hook.rerender({ category: 'BTP' });
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(String(vi.mocked(fetch).mock.calls[1]![0])).toBe(`${url}?category=BTP`);
  });

  it('refetch recharge vraiment la liste après un premier chargement réussi', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ success: true, data: [] }));
    const { result } = await mount();
    expect(result.current.items).toEqual([]);

    // Exemple : un service vient d’être créé dans le tableau de bord.
    vi.mocked(fetch).mockResolvedValueOnce(json({ success: true, data: [raw] }));
    await act(() => result.current.refetch());
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.items).toHaveLength(1);
  });

  it('expose l’erreur de l’API et la remonte à Sentry à partir de 500', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ error: 'Accès refusé' }, 403));
    const { result } = await mount();
    expect(result.current.error).toBe('Accès refusé');
    expect(Sentry.captureException).not.toHaveBeenCalled();

    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 503, json: async () => { throw new Error('html'); } } as unknown as Response);
    await act(() => result.current.refetch());
    expect(result.current.error).toBe(defaultError);
    expect(result.current.items).toEqual([]);
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });

  it('signale un format invalide et une panne réseau', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({ success: true, data: 'pas une liste' }));
    const { result } = await mount();
    expect(result.current.error).toBe('Format de réponse invalide');

    vi.mocked(fetch).mockRejectedValueOnce(new Error('hors ligne'));
    await act(() => result.current.refetch());
    expect(result.current.error).toBe('hors ligne');
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);

    vi.mocked(fetch).mockRejectedValueOnce('panne');
    await act(() => result.current.refetch());
    expect(result.current.error).toBe('Erreur inconnue');
  });

  it('ignore un second chargement lancé pendant le premier', async () => {
    let release!: (r: Response) => void;
    vi.mocked(fetch).mockReturnValueOnce(new Promise<Response>((r) => (release = r)));
    const { result } = renderHook(() => use({}));
    await act(async () => {
      void result.current.refetch();
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => release(json({ success: true, data: [] })));
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
