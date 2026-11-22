// @vitest-environment node
/**
 * Chaque accesseur exporté par le conteneur renvoie un repository enregistré.
 * (Quatre accesseurs levaient « Repository … not found » : PCI et RGPD jamais enregistrés.)
 */
import { describe, expect, it } from 'vitest';

import * as container from '@/repositories/container/RepositoryContainer';

const getters = Object.entries(container).filter(
  ([name, value]) => /^get[A-Z]\w*Repository$/.test(name) && typeof value === 'function',
) as Array<[string, () => unknown]>;

describe('RepositoryContainer', () => {
  it('expose des accesseurs', () => {
    expect(getters.length).toBeGreaterThan(20);
  });

  it.each(getters)('%s renvoie un repository enregistré', (_name, get) => {
    const repo = get() as Record<string, unknown>;
    expect(repo).toBeTruthy();
    expect(typeof repo['findById']).toBe('function');
  });
});
