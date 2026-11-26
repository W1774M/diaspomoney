// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const captureException = vi.hoisted(() => vi.fn());
vi.mock('@sentry/nextjs', () => ({ captureException }));

import { ExpectedDomainError, captureUnexpected } from '@/lib/errors/expected-domain-error';

describe('captureUnexpected', () => {
  beforeEach(() => captureException.mockClear());

  it('n’envoie pas un refus métier prévu', () => {
    captureUnexpected(new ExpectedDomainError('Réservation non trouvée'));
    expect(captureException).not.toHaveBeenCalled();
  });

  it('envoie une vraie panne, avec son contexte', () => {
    const panne = new Error('mongo HS');
    captureUnexpected(panne, { tags: { component: 'BookingService' } });
    expect(captureException).toHaveBeenCalledWith(panne, { tags: { component: 'BookingService' } });
  });

  it('un refus métier reste une Error (les routes testent toujours le message)', () => {
    const e = new ExpectedDomainError('Réservation non trouvée');
    expect(e).toBeInstanceOf(Error);
    expect(e.message.includes('non trouvée')).toBe(true);
  });
});
