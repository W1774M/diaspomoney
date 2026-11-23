/**
 * lib/coss/client
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { CossCtor } = vi.hoisted(() => ({
  CossCtor: vi.fn(function Coss(this: Record<string, unknown>) {
    this['ok'] = true;
  }),
}));

vi.mock('coss', () => ({ Coss: CossCtor }));

describe('lib/coss/client', () => {
  const prev = process.env['COSS_API_KEY'];

  beforeEach(() => {
    vi.resetModules();
    CossCtor.mockClear();
    delete process.env['COSS_API_KEY'];
  });

  afterEach(() => {
    if (prev === undefined) delete process.env['COSS_API_KEY'];
    else process.env['COSS_API_KEY'] = prev;
  });

  it('isCossSchedulingConfigured exige un préfixe coss_', async () => {
    const { isCossSchedulingConfigured } = await import('@/lib/coss/client');
    expect(isCossSchedulingConfigured()).toBe(false);
    process.env['COSS_API_KEY'] = 'sk_live_x';
    expect(isCossSchedulingConfigured()).toBe(false);
    process.env['COSS_API_KEY'] = 'coss_test_abc';
    expect(isCossSchedulingConfigured()).toBe(true);
  });

  it('getCossClient refuse sans clé', async () => {
    const { getCossClient } = await import('@/lib/coss/client');
    expect(() => getCossClient()).toThrow(/COSS_API_KEY/);
  });

  it('getCossClient instancie et met en cache', async () => {
    process.env['COSS_API_KEY'] = 'coss_test_abc';
    const { getCossClient } = await import('@/lib/coss/client');
    const a = getCossClient();
    const b = getCossClient();
    expect(a).toBe(b);
    expect(CossCtor).toHaveBeenCalledTimes(1);
  });
});
