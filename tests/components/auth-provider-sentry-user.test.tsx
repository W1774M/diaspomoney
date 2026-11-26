/**
 * Les erreurs Sentry du navigateur sont rattachées à l'utilisateur connecté, par son
 * identifiant interne seulement (pas d'e-mail ni de nom).
 */
import { render } from '@testing-library/react';
import * as Sentry from '@sentry/nextjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const session = vi.hoisted(() => ({ data: null as unknown }));
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: () => ({ data: session.data }),
}));

import { AuthProvider } from '@/components/features/providers/AuthProvider';

describe('AuthProvider → utilisateur Sentry', () => {
  beforeEach(() => vi.mocked(Sentry.setUser).mockClear());

  it('identifiant seul quand on est connecté', () => {
    session.data = { user: { id: 'u42', email: 'awa@test.fr', name: 'Awa' } };
    render(<AuthProvider><p>contenu</p></AuthProvider>);
    expect(Sentry.setUser).toHaveBeenLastCalledWith({ id: 'u42' });
  });

  it('aucun utilisateur sans session', () => {
    session.data = null;
    render(<AuthProvider><p>contenu</p></AuthProvider>);
    expect(Sentry.setUser).toHaveBeenLastCalledWith(null);
  });
});
