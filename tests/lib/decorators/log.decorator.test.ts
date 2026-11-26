import * as Sentry from '@sentry/nextjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Log } from '@/lib/decorators/log.decorator';
import { ExpectedDomainError } from '@/lib/errors/expected-domain-error';

class Sample {
  @Log()
  async refuse() {
    throw new ExpectedDomainError("L'étape 3 est déjà complétée. Vous pouvez valider l'étape suivante (4).");
  }

  @Log()
  async crash() {
    throw new Error('base cassée');
  }
}

describe('Log decorator', () => {
  beforeEach(() => {
    vi.mocked(Sentry.captureException).mockClear();
  });

  it('laisse passer un refus métier sans l’envoyer à Sentry', async () => {
    await expect(new Sample().refuse()).rejects.toThrow(/déjà complétée/);
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it('envoie une vraie panne à Sentry', async () => {
    await expect(new Sample().crash()).rejects.toThrow('base cassée');
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
  });
});
