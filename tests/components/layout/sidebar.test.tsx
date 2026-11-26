/**
 * Barre latérale du tableau de bord : le menu dépend du rôle,
 * du type de prestataire, et du tiroir mobile.
 */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { ROLES } from '@/lib/constants';

const nav = vi.hoisted(() => ({ pathname: '/dashboard' }));
const signOut = vi.hoisted(() => vi.fn());
const auth = vi.hoisted(() => ({
  current: {
    user: null as Record<string, unknown> | null,
    isAuthenticated: false,
    isLoading: false,
    signOut,
    isSigningOut: false,
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { loader: _loader, unoptimized: _unoptimized, ...rest } = props;
    return <img alt={String(rest['alt'] ?? '')} src={String(rest['src'] ?? '')} onError={rest['onError'] as (() => void) | undefined} />;
  },
}));

vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => auth.current,
}));

import Sidebar from '@/components/layout/Sidebar';

function OpenDrawer() {
  const { open } = useSidebar();
  return <button type="button" onClick={open}>Ouvrir le menu</button>;
}

function session(user: Record<string, unknown> | null, extra: Partial<typeof auth.current> = {}) {
  auth.current = {
    user,
    isAuthenticated: user !== null,
    isLoading: false,
    signOut,
    isSigningOut: false,
    ...extra,
  };
}

const person = (roles: string[], extra: Record<string, unknown> = {}) => ({
  id: 'u1',
  name: 'Awa Diallo',
  email: 'awa@example.com',
  roles,
  ...extra,
});

function renderBar() {
  return render(
    <SidebarProvider>
      <OpenDrawer />
      <Sidebar />
    </SidebarProvider>,
  );
}

function desktopMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

beforeEach(() => {
  nav.pathname = '/dashboard';
  signOut.mockReset();
  session(null);
  desktopMedia(true);
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: string) => ({
    json: async () => (
      String(url).includes('pending-count')
        ? { success: true, pendingCount: 3 }
        : { success: true, unreadCount: 12 }
    ),
  })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('Sidebar', () => {
  it('ne rend rien tant que personne n’est connecté', () => {
    renderBar();
    expect(screen.queryByRole('navigation', { name: 'Rubriques' })).not.toBeInTheDocument();
  });

  it('affiche le menu client : ses réservations, le support, pas les outils admin', async () => {
    session(person([ROLES.CUSTOMER]));
    renderBar();

    expect(screen.getByRole('navigation', { name: 'Rubriques' })).toBeInTheDocument();
    expect(screen.getByText('AD')).toBeInTheDocument();
    expect(screen.getByText('Awa Diallo')).toBeInTheDocument();
    expect(screen.getByText('CUSTOMER')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mes réservations' })).toHaveAttribute('href', '/dashboard/bookings');
    expect(screen.getByRole('link', { name: 'Mes bénéficiaires' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Commandes' })).not.toBeInTheDocument();
    expect(screen.queryByText('ADMIN GESTION')).not.toBeInTheDocument();
    expect(screen.queryByText('OUTILS PRESTATAIRE')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Messagerie Interne' }));
    expect(screen.getByRole('link', { name: 'Chat avec support' })).toHaveAttribute('href', '/dashboard/messaging/support');
    await waitFor(() => expect(screen.getByText('9+')).toBeInTheDocument());
  });

  it('donne à l’admin la gestion, sans les outils super-admin, et cache le chat support', async () => {
    session(person([ROLES.ADMIN]));
    renderBar();

    expect(screen.getByRole('link', { name: 'Commandes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Utilisateurs' })).toHaveAttribute('href', '/dashboard/users');
    // Super-admin : rôle SUPERADMIN explicite, comme les pages et /api/admin/tools
    expect(screen.queryByRole('link', { name: 'Santé & métriques' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Outils & accès' })).not.toBeInTheDocument();
    expect(screen.queryByText('OUTILS CSM')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Messagerie Interne' }));
    expect(screen.queryByRole('link', { name: 'Chat avec support' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute('aria-current', 'page');
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
  });

  it.each([
    ['un admin avec d’autres rôles (ancienne règle)', [ROLES.ADMIN, ROLES.CUSTOMER, ROLES.PROVIDER]],
  ] as const)('refuse les outils super-admin à %s', (_label, roles) => {
    session(person([...roles]));
    renderBar();
    expect(screen.getByRole('link', { name: 'Utilisateurs' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Outils & accès' })).not.toBeInTheDocument();
  });

  it('montre les outils super-admin au rôle SUPERADMIN explicite', () => {
    session(person([ROLES.SUPERADMIN]));
    renderBar();
    expect(screen.getByRole('link', { name: 'Santé & métriques' })).toHaveAttribute('href', '/dashboard/superadmin');
    expect(screen.getByRole('link', { name: 'Outils & accès' })).toHaveAttribute('href', '/dashboard/superadmin/outils');
  });

  it('réserve le portefeuille au rôle CSM porté par le compte', () => {
    session(person([ROLES.CSM]));
    renderBar();
    expect(screen.getByRole('link', { name: 'Mon portefeuille' })).toHaveAttribute('href', '/dashboard/csm/portfolio');
    expect(screen.queryByRole('link', { name: 'Utilisateurs' })).not.toBeInTheDocument();
  });

  it.each([
    ['HEALTH', 'Mes patients'],
    ['BTP', 'Mes missions'],
    ['EDUCATION', 'Mes élèves'],
  ] as const)('ouvre le calendrier d’un indépendant %s', (category, label) => {
    nav.pathname = '/dashboard/availabilities';
    session(person([ROLES.PROVIDER], { providerInfo: { type: 'INDIVIDUAL', category } }));
    renderBar();
    expect(screen.getByText('OUTILS PRESTATAIRE')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Institution/ })).not.toBeInTheDocument();
  });

  it('propose le calendrier par défaut sans catégorie, et le replie au clic', () => {
    nav.pathname = '/dashboard/calendar/reminders';
    session(person([ROLES.PROVIDER], { providerInfo: { type: 'INDIVIDUAL' } }));
    renderBar();
    expect(screen.getByRole('link', { name: 'Rappels importants' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '📅 Calendrier' }));
    expect(screen.queryByRole('link', { name: 'Rappels importants' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '📅 Calendrier' }));
    expect(screen.getByRole('link', { name: 'Rappels importants' })).toBeInTheDocument();
  });

  // Clés calendar-institution-* ouvertes automatiquement (#143), pour chaque catégorie
  it.each([
    ['HEALTH', '/dashboard/availabilities'],
    ['BTP', '/dashboard/missions'],
    ['EDUCATION', '/dashboard/students'],
    [undefined, '/dashboard/calendar'],
  ] as const)('ouvre le calendrier d’une institution %s sur %s', (category, path) => {
    nav.pathname = path;
    session(person([ROLES.PROVIDER], { providerInfo: { type: 'INSTITUTION', ...(category ? { category } : {}) } }));
    renderBar();
    expect(screen.getByRole('button', { name: '📅 Calendrier' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Mes disponibilités' })).toBeInTheDocument();
  });

  it.each([
    ['HEALTH', '🏥 Institution', '/dashboard/institution/doctors', [
      ['Mes médecins', '/dashboard/institution/doctors'],
      ['Mes infirmiers', '/dashboard/institution/nurses'],
      ['Mes patients', '/dashboard/institution/patients'],
      ['Mes rendez-vous', '/dashboard/institution/appointments'],
    ]],
    ['BTP', '🏗️ Institution', '/dashboard/institution/freelancers', [
      ['Mes indépendants', '/dashboard/institution/freelancers'],
      ['Mes clients', '/dashboard/institution/clients'],
      ['Mes missions', '/dashboard/institution/missions'],
    ]],
    ['EDUCATION', '🎓 Institution', '/dashboard/institution/teachers', [
      ['Mes professeurs', '/dashboard/institution/teachers'],
      ['Mes élèves', '/dashboard/institution/students'],
      ['Mes classes', '/dashboard/institution/classes'],
    ]],
    [undefined, '🏢 Institution', '/dashboard/institution/teams', [
      ['Mes équipes', '/dashboard/institution/teams'],
      ['Mes clients', '/dashboard/institution/clients'],
    ]],
  ] as const)('affiche le menu institution %s et ouvre ses écrans', (category, menu, path, links) => {
    nav.pathname = '/dashboard';
    session(person([ROLES.PROVIDER], { providerInfo: { type: 'INSTITUTION', ...(category ? { category } : {}) } }));
    renderBar();
    const button = screen.getByRole('button', { name: menu });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    for (const [label, href] of links) {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute('href', href);
    }
    cleanup();

    nav.pathname = path;
    renderBar();
    expect(screen.getByRole('button', { name: menu })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: links[0][0] })).toHaveAttribute('aria-current', 'page');
  });

  it('garde un calendrier pour un prestataire sans type de profil', () => {
    nav.pathname = '/dashboard/availabilities';
    session(person([ROLES.PROVIDER]));
    renderBar();
    expect(screen.getByRole('link', { name: 'Réservations clients' })).toBeInTheDocument();
  });

  it('déplie les paramètres sur une page de paiement, bascule les onglets et déconnecte', () => {
    nav.pathname = '/dashboard/payments';
    session(person([ROLES.CUSTOMER], { name: 'Bo', email: '' }));
    renderBar();

    expect(screen.getByText('BO')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Paiements & Facturation' })).toHaveAttribute('aria-current', 'page');
    const tabs = screen.getByRole('switch', { name: /Onglets/ });
    expect(tabs).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(tabs);
    expect(tabs).toHaveAttribute('aria-checked', 'false');
    expect(localStorage.getItem('sidebar-tabs-enabled')).toBe('false');
    expect(screen.getByText('Désactivés')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Se déconnecter' }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('affiche les initiales de l’e-mail, puis l’avatar, et retombe sur les initiales s’il casse', () => {
    session(person([ROLES.CUSTOMER], { name: '', email: 'bo@example.com', avatar: 'https://cdn.example/a.png' }));
    const { unmount } = renderBar();
    const image = screen.getByRole('img', { name: 'Utilisateur' });
    expect(image).toHaveAttribute('src', 'https://cdn.example/a.png');
    fireEvent.error(image);
    expect(screen.getByText('BO')).toBeInTheDocument();
    unmount();

    session(person([ROLES.CUSTOMER], { avatar: { image: 'https://cdn.example/b.png', name: 'Awa' } }));
    renderBar();
    expect(screen.getByRole('img', { name: 'Awa Diallo' })).toHaveAttribute('src', 'https://cdn.example/b.png');
  });

  it('indique la déconnexion en cours et survit à un compteur illisible', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('réseau')));
    session(person([ROLES.ADMIN]), { isSigningOut: true });
    renderBar();
    const button = screen.getByRole('button', { name: 'Déconnexion…' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(signOut).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByText('9+')).not.toBeInTheDocument());
  });

  it('ouvre le tiroir sous 1024 px, le ferme avec Échap et au clic d’un lien', async () => {
    desktopMedia(false);
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });
    session(person([ROLES.CUSTOMER]));
    renderBar();

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    const dialog = await waitFor(() => screen.getByRole('dialog', { name: 'Navigation du tableau de bord' }));
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('link', { name: 'Tableau de bord' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le menu' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
