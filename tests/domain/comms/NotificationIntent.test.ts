import { describe, expect, it } from 'vitest';
import {
  EmailDispatch,
  NotificationIntent,
  SupportTicket,
} from '@/domain/comms';

describe('Comms domain', () => {
  it('NotificationIntent valide', () => {
    const n = NotificationIntent.of({
      recipient: 'user@example.com',
      template: 'booking_confirmation',
      channels: ['EMAIL'],
      payload: { bookingId: 'b1' },
    });
    expect(n.template).toBe('booking_confirmation');
  });

  it('EmailDispatch exige contenu', () => {
    expect(() =>
      EmailDispatch.of({ to: 'a@b.com', subject: 'Hi' }),
    ).toThrow();

    const d = EmailDispatch.of({
      to: 'a@b.com',
      subject: 'Hi',
      text: 'Hello',
    });
    expect(d.to).toBe('a@b.com');
  });

  it('SupportTicket cycle de vie', () => {
    const t = SupportTicket.open({
      clientId: 'c1',
      subject: 'Bug login',
    });
    t.startProgress();
    t.resolve();
    expect(t.currentStatus).toBe('RESOLVED');
  });
});
