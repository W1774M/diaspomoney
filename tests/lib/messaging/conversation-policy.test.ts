import { describe, expect, it } from 'vitest';
import {
  canUsersMessage,
  isPersonToPersonConversation,
  normalizeMessagingRoles,
} from '@/lib/messaging/conversation-policy';

describe('conversation-policy — canUsersMessage', () => {
  it.each([
    [['CUSTOMER'], ['PROVIDER']],
    [['BENEFICIARY'], ['PROVIDER']],
    [['CUSTOMER'], ['BENEFICIARY']],
    [['CUSTOMER'], ['ADMIN']],
    [['BENEFICIARY'], ['SUPERADMIN']],
    [['PROVIDER'], ['ADMIN']],
    [['CSM'], ['PROVIDER']],
    [['CSM'], ['CUSTOMER']],
    [['CSM'], ['ADMIN']],
    [['ADMIN'], ['SUPERADMIN']],
  ])('autorise %j ↔ %j dans les deux sens', (a, b) => {
    expect(canUsersMessage(a, b)).toBe(true);
    expect(canUsersMessage(b, a)).toBe(true);
  });

  it.each([
    [['CUSTOMER'], ['CUSTOMER']],
    [['PROVIDER'], ['PROVIDER']],
    [['BENEFICIARY'], ['BENEFICIARY']],
  ])('refuse %j ↔ %j', (a, b) => {
    expect(canUsersMessage(a, b)).toBe(false);
  });

  it('autorise si au moins un couple de rôles est permis (multi-rôles)', () => {
    expect(canUsersMessage(['CUSTOMER', 'PROVIDER'], ['CUSTOMER'])).toBe(true);
  });

  it('refuse si les rôles sont absents ou inconnus', () => {
    expect(canUsersMessage([], ['ADMIN'])).toBe(false);
    expect(canUsersMessage(undefined, ['ADMIN'])).toBe(false);
    expect(canUsersMessage(['SYSTEM'], ['ADMIN'])).toBe(false);
  });

  it('normalise la casse', () => {
    expect(normalizeMessagingRoles(['customer', ' Provider ', 'x'])).toEqual([
      'CUSTOMER',
      'PROVIDER',
    ]);
    expect(canUsersMessage(['customer'], ['provider'])).toBe(true);
  });
});

describe('conversation-policy — isPersonToPersonConversation', () => {
  it('accepte une conversation « user » à deux participants', () => {
    expect(
      isPersonToPersonConversation({ type: 'user', participants: ['a', 'b'] }),
    ).toBe(true);
  });

  it('accepte des participants peuplés (documents avec _id)', () => {
    expect(
      isPersonToPersonConversation({
        type: 'user',
        participants: [
          { _id: { toString: () => 'a' } },
          { _id: { toString: () => 'b' } },
        ],
      }),
    ).toBe(true);
  });

  it('refuse les tickets support (gérés par le chat support)', () => {
    expect(
      isPersonToPersonConversation({
        type: 'support',
        participants: ['a', 'b'],
      }),
    ).toBe(false);
  });

  it('refuse une conversation sans interlocuteur réel', () => {
    expect(
      isPersonToPersonConversation({ type: 'user', participants: ['a', 'a'] }),
    ).toBe(false);
    expect(
      isPersonToPersonConversation({ type: 'user', participants: ['a', null] }),
    ).toBe(false);
  });
});
