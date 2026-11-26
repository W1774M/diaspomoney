/**
 * Réservation introuvable : un refus métier (404 côté routes), pas une panne.
 * Il ne doit plus ouvrir d'issue Sentry (suite de #138, DIASPOMONEY-3D).
 */
import { ObjectId } from 'mongodb';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const captureException = vi.hoisted(() => vi.fn());
vi.mock('@sentry/nextjs', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  captureException,
}));

import { ExpectedDomainError } from '@/lib/errors/expected-domain-error';
import { bookingService } from '@/services/booking/booking.service';

describe('réservation introuvable', () => {
  beforeEach(() => captureException.mockClear());

  it.each([
    ['getBookingById', (id: string) => bookingService.getBookingById(id)],
    ['updateBooking', (id: string) => bookingService.updateBooking(id, { notes: 'x' } as never)],
    ['cancelBooking', (id: string) => bookingService.cancelBooking(id)],
  ])('%s : ExpectedDomainError, rien dans Sentry', async (_name, call) => {
    const missing = new ObjectId().toString();
    await expect(call(missing)).rejects.toBeInstanceOf(ExpectedDomainError);
    await expect(call(missing)).rejects.toThrow('Réservation non trouvée');
    expect(captureException).not.toHaveBeenCalledWith(expect.objectContaining({ message: 'Réservation non trouvée' }), expect.anything());
    expect(captureException.mock.calls.some(([e]) => (e as Error)?.message === 'Réservation non trouvée')).toBe(false);
  });
});
