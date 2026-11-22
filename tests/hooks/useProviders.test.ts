import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProviders } from '@/hooks/useProviders';
import { parseProvidersResponse } from '@/hooks/providers-response';

const okResponse = (body: unknown) => ({ ok: true, json: async () => body }) as Response;
const provider = (id: string) => ({
  _id: id,
  id,
  email: `${id}@test.fr`,
  name: `Clinique ${id}`,
  roles: ['PROVIDER'],
  status: 'ACTIVE',
});

// Format renvoyé par GET /api/providers (createPaginatedResponse)
const paginated = (items: unknown[], total: number) => ({
  success: true,
  data: items,
  pagination: { page: 1, limit: 20, total, totalPages: 1, hasMore: false },
});

describe('useProviders', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset();
  });

  it('lit le format paginé de l’API (data + pagination.total)', async () => {
    vi.mocked(fetch).mockResolvedValue(
      okResponse(paginated([provider('p1'), provider('p2')], 8)),
    );

    const { result } = renderHook(() => useProviders({ status: 'ACTIVE', limit: 20 }));

    await waitFor(() => expect(result.current.providers).toHaveLength(2));
    expect(result.current.total).toBe(8);
    expect(result.current.error).toBeNull();
    expect(String(vi.mocked(fetch).mock.calls[0]![0])).toContain('status=ACTIVE');
  });
});

describe('parseProvidersResponse', () => {
  it('accepte encore l’ancien format { providers, total }', () => {
    expect(parseProvidersResponse({ providers: [provider('p1')], total: 3 })).toEqual({
      providers: [provider('p1')],
      total: 3,
    });
  });

  it('retombe sur la longueur du tableau sans total', () => {
    expect(parseProvidersResponse({ data: [provider('p1')] }).total).toBe(1);
  });

  it('renvoie une liste vide pour une réponse invalide', () => {
    expect(parseProvidersResponse(null)).toEqual({ providers: [], total: 0 });
  });
});
