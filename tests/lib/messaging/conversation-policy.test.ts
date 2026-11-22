import { describe, expect, it } from 'vitest';
import {
  canPartiesMessage,
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

describe('conversation-policy — canPartiesMessage (lien métier CSM)', () => {
  const csm = { id: 'csm1', roles: ['CSM'], csmPortfolioProviderIds: ['p1'] };
  const providerInPortfolio = { id: 'p1', roles: ['PROVIDER'] };
  const providerOutside = { id: 'p2', roles: ['PROVIDER'] };

  it('autorise un CSM et un prestataire de son portefeuille, dans les deux sens', () => {
    expect(canPartiesMessage(csm, providerInPortfolio)).toBe(true);
    expect(canPartiesMessage(providerInPortfolio, csm)).toBe(true);
  });

  it('refuse un prestataire hors du portefeuille du CSM', () => {
    expect(canPartiesMessage(csm, providerOutside)).toBe(false);
    expect(canPartiesMessage(providerOutside, csm)).toBe(false);
    expect(canPartiesMessage({ id: 'csm2', roles: ['CSM'] }, providerInPortfolio)).toBe(false);
  });

  it('CSM ↔ client / bénéficiaire : seulement ses clients (csmClientIds)', () => {
    const csmWithClients = { ...csm, csmClientIds: ['c1', 'b1'] };
    expect(canPartiesMessage(csmWithClients, { id: 'c1', roles: ['CUSTOMER'] })).toBe(true);
    expect(canPartiesMessage({ id: 'b1', roles: ['BENEFICIARY'] }, csmWithClients)).toBe(true);
    expect(canPartiesMessage(csmWithClients, { id: 'c9', roles: ['CUSTOMER'] })).toBe(false);
    expect(canPartiesMessage({ id: 'b9', roles: ['BENEFICIARY'] }, csmWithClients)).toBe(false);
    // Sans liste de clients calculée : refus
    expect(canPartiesMessage(csm, { id: 'c1', roles: ['CUSTOMER'] })).toBe(false);
  });

  it('laisse les autres paires au niveau des rôles', () => {
    expect(canPartiesMessage(csm, { id: 'a1', roles: ['ADMIN'] })).toBe(true);
    expect(canPartiesMessage(csm, { id: 'csm2', roles: ['CSM'] })).toBe(true);
    expect(canPartiesMessage({ id: 'c1', roles: ['CUSTOMER'] }, providerOutside)).toBe(true);
    expect(canPartiesMessage({ id: 'c1', roles: ['CUSTOMER'] }, { id: 'c2', roles: ['CUSTOMER'] })).toBe(false);
  });

  it('multi-rôles : un prestataire hors portefeuille qui est aussi client du CSM reste joignable', () => {
    const csmWithClients = { ...csm, csmClientIds: ['p2'] };
    expect(canPartiesMessage(csmWithClients, { id: 'p2', roles: ['PROVIDER', 'CUSTOMER'] })).toBe(true);
    expect(canPartiesMessage(csm, { id: 'p2', roles: ['PROVIDER', 'CUSTOMER'] })).toBe(false);
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
