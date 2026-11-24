/**
 * GET /api/home-dialog-ad
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readFile } = vi.hoisted(() => ({
  readFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({ readFile }));

import { GET } from '@/app/api/home-dialog-ad/route';

describe('GET /api/home-dialog-ad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readFile.mockResolvedValue(Buffer.from('jpeg-bytes'));
  });

  it('sert l’image JPEG sans cache', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    expect(res.headers.get('Cache-Control')).toMatch(/no-store/);
    expect(readFile).toHaveBeenCalled();
    const buf = Buffer.from(await res.arrayBuffer());
    expect(buf.toString()).toBe('jpeg-bytes');
  });
});
