/**
 * GET /api/public/packs
 */
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { find, lean, sort, select } = vi.hoisted(() => {
  const lean = vi.fn();
  const select = vi.fn(() => ({ lean }));
  const sort = vi.fn(() => ({ select }));
  const find = vi.fn(() => ({ sort }));
  return { find, lean, sort, select };
});

vi.mock('@/lib/mongodb', () => ({ default: vi.fn(async () => undefined) }));
vi.mock('@/models/Pack', () => ({
  default: { find },
}));

import { GET } from '@/app/api/public/packs/route';

describe('GET /api/public/packs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lean.mockResolvedValue([
      { id: 'p1', label: 'Pack Santé', category: 'HEALTH', isActive: true },
    ]);
  });

  it('liste uniquement les packs actifs', async () => {
    const res = await GET(new NextRequest('http://localhost/api/public/packs'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.count).toBe(1);
    expect(find).toHaveBeenCalledWith({ isActive: true });
  });

  it('filtre une catégorie valide', async () => {
    await GET(new NextRequest('http://localhost/api/public/packs?category=BTP'));
    expect(find).toHaveBeenCalledWith({ isActive: true, category: 'BTP' });
  });

  it('ignore une catégorie invalide', async () => {
    await GET(new NextRequest('http://localhost/api/public/packs?category=LEGAL'));
    expect(find).toHaveBeenCalledWith({ isActive: true });
  });
});
