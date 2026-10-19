import { describe, expect, it } from 'vitest';
import { UserAccount, ACCOUNT_STATUSES } from '@/domain/identity';

describe('UserAccount', () => {
  it('register crée un compte PENDING avec rôle Client', () => {
    const account = UserAccount.register({
      email: 'Jean.Dupont@Example.com',
      firstName: 'Jean',
      lastName: 'Dupont',
      password: 'secret123',
    });

    expect(account.email).toBe('jean.dupont@example.com');
    expect(account.status).toBe(ACCOUNT_STATUSES.PENDING);
    expect(account.roles).toContain('CUSTOMER');
  });

  it('refuse un mot de passe trop court', () => {
    expect(() =>
      UserAccount.register({
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        password: 'short',
      }),
    ).toThrow(/8/);
  });

  it('activate puis assertCanLogin', () => {
    const account = UserAccount.register({
      email: 'a@b.com',
      firstName: 'A',
      lastName: 'B',
      password: 'secret123',
    });
    expect(() => account.assertCanLogin()).toThrow();
    account.activate();
    expect(() => account.assertCanLogin()).not.toThrow();
  });
});
