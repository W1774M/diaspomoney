import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

import Breadcrumb from '@/components/ui/Breadcrumb';

describe('Breadcrumb', () => {
  it('ne s’affiche pas sur l’accueil', () => {
    nav.pathname = '/';
    const { container } = render(<Breadcrumb />);
    expect(container).toBeEmptyDOMElement();
  });

  it('nomme l’écran institution', () => {
    nav.pathname = '/dashboard/institution/classes';
    render(<Breadcrumb />);
    expect(screen.getByRole('navigation', { name: "Fil d'Ariane" })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: 'Institution' })).toHaveAttribute('href', '/dashboard/institution');
    expect(screen.getByText('Classes')).toHaveAttribute('aria-current', 'page');
  });

  it('marque un identifiant avec les six derniers caractères', () => {
    nav.pathname = '/dashboard/users/507f1f77bcf86cd799439011';
    render(<Breadcrumb />);
    expect(screen.getByText('Utilisateurs #439011')).toHaveAttribute('aria-current', 'page');
  });
});
