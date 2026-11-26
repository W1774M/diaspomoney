import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Service, ServiceOption } from '@/hooks/services';

const notify = vi.hoisted(() => ({
  addSuccess: vi.fn(),
  addError: vi.fn(),
  addWarning: vi.fn(),
  addInfo: vi.fn(),
}));
const state = vi.hoisted(() => ({
  roles: ['ADMIN'] as string[],
  services: [] as unknown[],
  options: [] as unknown[],
  loading: false,
  error: null as string | null,
  confirm: true,
  refetchServices: vi.fn(async () => {}),
  refetchOptions: vi.fn(async () => {}),
}));

vi.mock('@/components/ui/Notification', () => ({ useNotificationManager: () => notify }));
vi.mock('@/components/ui/ConfirmProvider', () => ({ useConfirm: () => async () => state.confirm }));
vi.mock('@/components/auth', () => ({
  AuthorizedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', roles: state.roles } }),
}));
vi.mock('@/hooks/services', () => ({
  useServices: () => ({
    services: state.services,
    loading: state.loading,
    error: state.error,
    refetch: state.refetchServices,
  }),
  useServiceOptions: () => ({
    options: state.options,
    loading: false,
    error: null,
    refetch: state.refetchOptions,
  }),
}));

import ServicesManagementPage from '../../../app/dashboard/services/page';

type Call = { url: string; method: string; body: any };
let calls: Call[];
let respond: (call: Call) => { ok?: boolean; status?: number; data?: unknown; text?: string } | undefined;

function svc(id: string, extra: Partial<Service> = {}): Service {
  return {
    id,
    _id: `mongo-${id}`,
    category: 'HEALTH',
    label: `Service ${id}`,
    description: `Description ${id}`,
    price: 50,
    isActive: true,
    important: false,
    optional: false,
    ...extra,
  };
}

function opt(id: string, extra: Partial<ServiceOption> = {}): ServiceOption {
  return {
    id,
    category: 'HEALTH',
    label: `Option ${id}`,
    description: `Détail ${id}`,
    price: 10,
    optional: true,
    isActive: true,
    ...extra,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  state.roles = ['ADMIN'];
  state.loading = false;
  state.error = null;
  state.confirm = true;
  state.services = [
    svc('s1', { important: true, associatedOptions: ['o1'] }),
    svc('s2', { category: 'EDUCATION', price: 0 }),
    svc('s3', { category: 'BTP' }),
  ];
  state.options = [
    opt('o1', { associatedServices: ['s1'] }),
    opt('o2', { isActive: false, category: '' }),
  ];
  calls = [];
  respond = () => undefined;
  vi.mocked(global.fetch).mockImplementation(async (input, init) => {
    const call: Call = {
      url: String(input),
      method: init?.method ?? 'GET',
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    const r = respond(call) ?? {};
    const data = r.data ?? { success: true };
    return {
      ok: r.ok ?? true,
      status: r.status ?? (r.ok === false ? 400 : 200),
      statusText: '',
      json: async () => data,
      text: async () => r.text ?? JSON.stringify(data),
    } as Response;
  });
});

const renderPage = () => render(<ServicesManagementPage />);
const tab = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const inForm = (name: string) => within(document.querySelector('form')!).getByRole('button', { name });

describe('Tableau de bord — gestion des services', () => {
  it('liste les services avec catégorie, prix, badge « Important » et statistiques', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /Gestion des services et options/ })).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Liste des services' });
    expect(within(table).getByText('Service s1')).toBeInTheDocument();
    expect(within(table).getByText('Important')).toBeInTheDocument();
    expect(within(table).getByText('Gratuit')).toBeInTheDocument();
    expect(within(table).getAllByText('50 €')).toHaveLength(2);
    expect(within(table).getByText('Immobilier & BTP')).toBeInTheDocument();
    expect(screen.getByText('Total services').nextSibling).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: /Services \(3\)/ })).toBeInTheDocument();
  });

  it('affiche le chargement, puis la liste vide', () => {
    state.loading = true;
    const { unmount } = renderPage();
    expect(screen.getByText('Chargement des services...')).toBeInTheDocument();
    unmount();
    state.loading = false;
    state.services = [];
    renderPage();
    expect(screen.getByText('Aucun service trouvé')).toBeInTheDocument();
  });

  it('remonte l’erreur de chargement dans une notification', () => {
    state.error = 'Erreur réseau';
    renderPage();
    expect(notify.addError).toHaveBeenCalledWith('Erreur réseau');
  });

  it('filtre par texte et par catégorie', () => {
    renderPage();
    fireEvent.change(screen.getByPlaceholderText('Rechercher un service...'), { target: { value: 'description s2' } });
    expect(screen.queryByText('Service s1')).not.toBeInTheDocument();
    expect(screen.getByText('Service s2')).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('Rechercher un service...'), { target: { value: '' } });
    fireEvent.change(screen.getByTitle('Filtrer par catégorie'), { target: { value: 'BTP' } });
    expect(screen.getByText('Service s3')).toBeInTheDocument();
    expect(screen.queryByText('Service s2')).not.toBeInTheDocument();
  });

  it('découpe la liste en pages de 6 services', () => {
    state.services = Array.from({ length: 8 }, (_, i) => svc(`p${i + 1}`, { category: 'UNKNOWN' }));
    window.scrollTo = vi.fn();
    renderPage();
    expect(screen.getByText('Service p6')).toBeInTheDocument();
    expect(screen.queryByText('Service p7')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: '2' })[0]!);
    expect(screen.getByText('Service p7')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalled();
    // Catégorie inconnue : le libellé brut est affiché
    expect(screen.getAllByText('UNKNOWN').length).toBeGreaterThan(0);
  });

  it('crée un service via le formulaire, après les contrôles de saisie', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Nouveau service/ }));
    expect(screen.getByRole('heading', { name: 'Créer un nouveau service' })).toBeInTheDocument();

    const form = screen.getByRole('button', { name: 'Créer' }).closest('form')!;
    fireEvent.submit(form);
    expect(notify.addWarning).toHaveBeenCalledWith("L'ID du service est requis");
    fireEvent.change(screen.getByLabelText(/ID du service/), { target: { value: 'nouveau' } });
    fireEvent.submit(form);
    expect(notify.addWarning).toHaveBeenCalledWith('Le libellé est requis');
    fireEvent.change(screen.getByLabelText(/Libellé/), { target: { value: 'Nouveau' } });
    fireEvent.submit(form);
    expect(notify.addWarning).toHaveBeenCalledWith('La description est requise');
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Texte' } });
    fireEvent.change(screen.getByLabelText('Catégorie du service'), { target: { value: 'BTP' } });
    expect(screen.getByText('0€ = Sur devis')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Prix/), { target: { value: '-3' } });
    fireEvent.submit(form);
    expect(notify.addWarning).toHaveBeenCalledWith('Le prix doit être positif');
    fireEvent.change(screen.getByLabelText(/Prix/), { target: { value: '30' } });
    fireEvent.click(screen.getByLabelText(/Service actif/));
    fireEvent.click(screen.getByLabelText(/Service important/));

    await act(async () => fireEvent.submit(form));

    expect(calls).toContainEqual(
      expect.objectContaining({
        url: '/api/services',
        method: 'POST',
        body: expect.objectContaining({ id: 'nouveau', category: 'BTP', price: 30, isActive: false, important: true }),
      }),
    );
    expect(state.refetchServices).toHaveBeenCalled();
    expect(notify.addSuccess).toHaveBeenCalledWith('Service créé avec succès');
    expect(screen.queryByRole('heading', { name: 'Créer un nouveau service' })).not.toBeInTheDocument();
  });

  it('modifie un service par son identifiant MongoDB', async () => {
    renderPage();
    fireEvent.click(screen.getAllByTitle('Modifier')[0]!);
    expect(screen.getByRole('heading', { name: 'Modifier le service' })).toBeInTheDocument();
    expect(screen.getByText("L'ID ne peut pas être modifié")).toBeInTheDocument();
    await act(async () => fireEvent.click(inForm('Modifier')));
    expect(calls[0]).toMatchObject({ url: '/api/services/mongo-s1', method: 'PUT' });
    expect(notify.addSuccess).toHaveBeenCalledWith('Service modifié avec succès');
  });

  it('ferme le formulaire de service par Annuler et par la croix', () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /Nouveau service/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('heading', { name: 'Créer un nouveau service' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Nouveau service/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le formulaire' }));
    expect(screen.queryByRole('heading', { name: 'Créer un nouveau service' })).not.toBeInTheDocument();
  });

  it.each([
    [{ ok: false, status: 403, text: '' }, 'Accès refusé. Vous devez être administrateur pour effectuer cette action.'],
    [{ ok: false, status: 400, text: '{"error":"ID déjà pris"}' }, 'ID déjà pris'],
    [{ ok: false, status: 500, text: 'panne' }, 'Erreur HTTP: 500'],
  ])('signale l’échec de l’enregistrement d’un service (%o)', async (r, message) => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    respond = () => r;
    renderPage();
    fireEvent.click(screen.getAllByTitle('Modifier')[0]!);
    await act(async () => fireEvent.click(inForm('Modifier')));
    expect(notify.addError).toHaveBeenCalledWith(message);
    expect(screen.getByRole('heading', { name: 'Modifier le service' })).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('refuse l’enregistrement à un compte non admin', async () => {
    state.roles = ['CSM'];
    renderPage();
    fireEvent.click(screen.getAllByTitle('Modifier')[0]!);
    await act(async () => fireEvent.click(inForm('Modifier')));
    expect(calls).toEqual([]);
    expect(notify.addError).toHaveBeenCalledWith('Vous devez être administrateur pour effectuer cette action');
  });

  it('supprime un service après confirmation, et pas sans', async () => {
    renderPage();
    state.confirm = false;
    await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
    expect(calls).toEqual([]);

    state.confirm = true;
    await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
    expect(calls[0]).toMatchObject({ url: '/api/services/mongo-s1', method: 'DELETE' });
    expect(notify.addSuccess).toHaveBeenCalledWith('Service supprimé avec succès');

    respond = () => ({ ok: false, data: { message: 'Service utilisé' } });
    await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
    expect(notify.addError).toHaveBeenCalledWith('Service utilisé');
  });

  it('refuse la suppression à un compte non admin', async () => {
    state.roles = [];
    renderPage();
    await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
    expect(calls).toEqual([]);
    expect(notify.addError).toHaveBeenCalledWith('Vous devez être administrateur pour effectuer cette action');
  });

  describe('options', () => {
    it('affiche les options, leurs services et leur statut', () => {
      renderPage();
      tab(/Options \(2\)/);
      expect(screen.getByText('Option o1')).toBeInTheDocument();
      expect(screen.getByText('1 service')).toBeInTheDocument();
      expect(screen.getByText('0 services')).toBeInTheDocument();
      expect(screen.getByText('Actif')).toBeInTheDocument();
      expect(screen.getByText('Inactif')).toBeInTheDocument();
      expect(screen.getByText('Multi-catégories')).toBeInTheDocument();
    });

    it('affiche un état vide sans option', () => {
      state.options = [];
      renderPage();
      tab(/Options \(0\)/);
      expect(screen.getByText('Aucune option disponible')).toBeInTheDocument();
    });

    it('masque les actions d’édition à un compte non admin', () => {
      state.roles = ['CSM'];
      renderPage();
      tab(/Options/);
      expect(screen.queryByTitle('Supprimer')).not.toBeInTheDocument();
    });

    it('crée une option, avec contrôles de saisie', async () => {
      renderPage();
      tab(/Options/);
      fireEvent.click(screen.getByRole('button', { name: /Nouvelle option/ }));
      const form = screen.getByRole('button', { name: 'Créer' }).closest('form')!;
      fireEvent.submit(form);
      expect(notify.addWarning).toHaveBeenCalledWith('Le libellé est requis');
      fireEvent.change(screen.getByLabelText(/Libellé/), { target: { value: 'Urgence' } });
      fireEvent.submit(form);
      expect(notify.addWarning).toHaveBeenCalledWith('La description est requise');
      fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Rapide' } });
      fireEvent.change(screen.getByLabelText(/Prix/), { target: { value: '-1' } });
      fireEvent.submit(form);
      expect(notify.addWarning).toHaveBeenCalledWith('Le prix doit être positif');
      fireEvent.change(screen.getByLabelText(/Prix/), { target: { value: '15' } });
      fireEvent.click(screen.getByLabelText(/Option facultative/));
      fireEvent.click(screen.getByLabelText(/Option active/));
      await act(async () => fireEvent.submit(form));
      expect(calls[0]).toMatchObject({
        url: '/api/service-options',
        method: 'POST',
        body: { label: 'Urgence', price: 15, optional: false, isActive: false },
      });
      expect(state.refetchOptions).toHaveBeenCalled();
      expect(notify.addSuccess).toHaveBeenCalledWith('Option créée avec succès');
    });

    it('modifie une option et signale un échec', async () => {
      renderPage();
      tab(/Options/);
      fireEvent.click(screen.getAllByTitle('Modifier')[0]!);
      expect(screen.getByRole('heading', { name: "Modifier l'option" })).toBeInTheDocument();
      await act(async () => fireEvent.click(inForm('Modifier')));
      expect(calls[0]).toMatchObject({ url: '/api/service-options/o1', method: 'PUT' });
      expect(notify.addSuccess).toHaveBeenCalledWith('Option modifiée avec succès');

      respond = () => ({ ok: false, status: 422, data: {} });
      fireEvent.click(screen.getAllByTitle('Modifier')[0]!);
      await act(async () => fireEvent.click(inForm('Modifier')));
      expect(notify.addError).toHaveBeenCalledWith('Erreur HTTP: 422');
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(screen.queryByRole('heading', { name: "Modifier l'option" })).not.toBeInTheDocument();
    });

    it('supprime une option après confirmation', async () => {
      renderPage();
      tab(/Options/);
      await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
      expect(calls[0]).toMatchObject({ url: '/api/service-options/o1', method: 'DELETE' });
      expect(notify.addSuccess).toHaveBeenCalledWith('Option supprimée avec succès');

      respond = () => ({ ok: false, data: { error: 'Option utilisée' } });
      await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
      expect(notify.addError).toHaveBeenCalledWith('Option utilisée');

      state.confirm = false;
      calls = [];
      await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
      expect(calls).toEqual([]);
    });

    it('ouvre les associations depuis une option', () => {
      renderPage();
      tab(/Options/);
      fireEvent.click(screen.getAllByTitle('Gérer les services')[0]!);
      expect(screen.getByRole('heading', { name: /Services associés à "Option o1"/ })).toBeInTheDocument();
      expect(screen.getByText('Service s1', { selector: 'p' })).toBeInTheDocument();
    });
  });

  describe('associations', () => {
    it('associe une option à un service, puis la dissocie', async () => {
      renderPage();
      tab(/Associations/);
      fireEvent.change(screen.getByLabelText('Sélectionner un service'), { target: { value: 's2' } });
      expect(screen.getByText('Aucune option associée à ce service')).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Sélectionner une option'), { target: { value: 'o2' } });
      expect(screen.getByText("Cette option n'est associée à aucun service")).toBeInTheDocument();

      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Associer' })));
      expect(calls[0]).toMatchObject({
        url: '/api/services/associations',
        method: 'POST',
        body: { serviceId: 's2', optionId: 'o2' },
      });
      expect(notify.addSuccess).toHaveBeenCalledWith('Option associée au service avec succès');

      respond = () => ({ ok: false, data: {} });
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Associer' })));
      expect(notify.addError).toHaveBeenCalledWith("Erreur lors de l'association");
    });

    it('dissocie une option déjà liée, depuis le bandeau et depuis la liste', async () => {
      renderPage();
      fireEvent.click(screen.getAllByTitle('Gérer les options')[0]!);
      expect(screen.getByRole('heading', { name: /Options associées à "Service s1"/ })).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText('Sélectionner une option'), { target: { value: 'o1' } });

      await act(async () => fireEvent.click(screen.getByText('Dissocier', { selector: 'button' })));
      expect(calls[0]).toMatchObject({ method: 'DELETE', body: { serviceId: 's1', optionId: 'o1' } });
      expect(notify.addSuccess).toHaveBeenCalledWith('Option dissociée du service avec succès');

      respond = () => ({ ok: false, data: { error: 'Lien introuvable' } });
      await act(async () => fireEvent.click(screen.getAllByTitle('Dissocier')[0]!));
      await act(async () => fireEvent.click(screen.getAllByTitle('Dissocier')[1]!));
      expect(notify.addError).toHaveBeenCalledWith('Lien introuvable');

      // Désélection
      fireEvent.change(screen.getByLabelText('Sélectionner un service'), { target: { value: '' } });
      fireEvent.change(screen.getByLabelText('Sélectionner une option'), { target: { value: '' } });
      expect(screen.queryByRole('heading', { name: /associé/ })).not.toBeInTheDocument();
    });
  });

  describe('codes promotionnels', () => {
    const future = new Date(Date.now() + 86400000 * 30).toISOString();
    const past = new Date(Date.now() - 86400000).toISOString();

    beforeEach(() => {
      respond = ({ url, method }) =>
        url === '/api/promotion-codes' && method === 'GET'
          ? {
              data: {
                success: true,
                codes: [
                  { _id: 'c1', label: 'PROMO10', percentage: 10, status: 'valid', validFrom: past, validUntil: future, usageCount: 1, maxUsage: 5 },
                  { _id: 'c2', label: 'VIEUX', percentage: 20, calculatedStatus: 'expired', validUntil: past, usageCount: 0 },
                  { _id: 'c3', label: 'OFF', percentage: 5, status: 'invalid', usageCount: 0 },
                ],
              },
            }
          : undefined;
    });

    it('liste les codes en cartes et en tableau', async () => {
      renderPage();
      tab(/Codes promotionnels/);
      const table = await screen.findByRole('table', { name: 'Codes promotionnels' });
      expect(within(table).getByText('PROMO10')).toBeInTheDocument();
      expect(within(table).getByText('Valide')).toBeInTheDocument();
      expect(within(table).getByText('Expiré')).toBeInTheDocument();
      expect(within(table).getByText('Invalide')).toBeInTheDocument();
      expect(within(table).getByText('1 / 5')).toBeInTheDocument();
      expect(within(table).getAllByText('0 (illimité)')).toHaveLength(2);
      // Vue cartes (mobile) rendue aussi
      expect(screen.getAllByText('PROMO10')).toHaveLength(2);
    });

    it('affiche une liste vide et signale un chargement en échec', async () => {
      respond = () => ({ data: { success: false } });
      renderPage();
      tab(/Codes promotionnels/);
      expect(await screen.findByText('Aucun code promotionnel')).toBeInTheDocument();
      expect(notify.addError).toHaveBeenCalledWith('Erreur lors du chargement des codes promotionnels');
    });

    it('signale une panne réseau au chargement', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('offline'));
      renderPage();
      tab(/Codes promotionnels/);
      await waitFor(() =>
        expect(notify.addError).toHaveBeenCalledWith('Erreur lors du chargement des codes promotionnels'),
      );
    });

    it('ne charge pas les codes pour un compte non admin', () => {
      state.roles = ['CSM'];
      renderPage();
      tab(/Codes promotionnels/);
      expect(calls).toEqual([]);
    });

    it('crée un code', async () => {
      renderPage();
      tab(/Codes promotionnels/);
      await screen.findByRole('table', { name: 'Codes promotionnels' });
      fireEvent.click(screen.getByRole('button', { name: /Nouveau code/ }));
      expect(screen.getByRole('heading', { name: 'Nouveau code promotionnel' })).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/Label/), { target: { value: 'NOEL' } });
      fireEvent.change(screen.getByLabelText(/Pourcentage/), { target: { value: '25' } });
      fireEvent.change(screen.getByLabelText(/Date de début/), { target: { value: '2026-12-01' } });
      fireEvent.change(screen.getByLabelText(/Date de fin/), { target: { value: '2026-12-31' } });
      fireEvent.change(screen.getByLabelText(/Usage maximum/), { target: { value: '100' } });
      calls = [];
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Créer' })));
      expect(calls[0]).toMatchObject({
        url: '/api/promotion-codes',
        method: 'POST',
        body: { label: 'NOEL', percentage: 25, maxUsage: 100 },
      });
      expect(calls[0]!.body.validUntil).toMatch(/^2026-12-31/);
      expect(notify.addSuccess).toHaveBeenCalledWith('Code promotionnel créé avec succès');
    });

    it('signale un refus et une panne à l’enregistrement d’un code', async () => {
      renderPage();
      tab(/Codes promotionnels/);
      await screen.findByRole('table', { name: 'Codes promotionnels' });
      fireEvent.click(screen.getByRole('button', { name: /Nouveau code/ }));
      fireEvent.change(screen.getByLabelText(/Date de fin/), { target: { value: '2026-12-31' } });
      fireEvent.change(screen.getByLabelText(/Date de début/), { target: { value: '' } });
      respond = () => ({ data: { success: false, error: 'Label déjà pris' } });
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Créer' })));
      expect(notify.addError).toHaveBeenCalledWith('Label déjà pris');

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('offline'));
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Créer' })));
      expect(notify.addError).toHaveBeenCalledWith('Erreur lors de la sauvegarde');

      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(screen.queryByRole('heading', { name: 'Nouveau code promotionnel' })).not.toBeInTheDocument();
    });

    it('modifie un code et change son statut', async () => {
      renderPage();
      tab(/Codes promotionnels/);
      const table = await screen.findByRole('table', { name: 'Codes promotionnels' });
      fireEvent.click(within(table).getAllByTitle('Modifier')[0]!);
      expect(screen.getByRole('heading', { name: 'Modifier le code' })).toBeInTheDocument();
      expect(screen.getByLabelText(/Label/)).toHaveValue('PROMO10');
      expect(screen.getByLabelText(/Usage maximum/)).toHaveValue(5);

      calls = [];
      await act(async () => fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'expired' } }));
      expect(calls[0]).toMatchObject({ url: '/api/promotion-codes/c1', method: 'PATCH', body: { status: 'expired' } });
      expect(notify.addSuccess).toHaveBeenCalledWith('Statut mis à jour');

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('offline'));
      await act(async () => fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'invalid' } }));
      expect(notify.addError).toHaveBeenCalledWith('Erreur lors de la mise à jour');

      calls = [];
      await act(async () => fireEvent.click(inForm('Modifier')));
      expect(calls[0]).toMatchObject({ url: '/api/promotion-codes/c1', method: 'PATCH' });
      expect(notify.addSuccess).toHaveBeenCalledWith('Code promotionnel modifié avec succès');
    });

    it('ouvre l’édition depuis une carte mobile, puis ferme par la croix', async () => {
      renderPage();
      tab(/Codes promotionnels/);
      await screen.findByRole('table', { name: 'Codes promotionnels' });
      fireEvent.click(screen.getAllByRole('button', { name: /^Modifier$/ })[1]!);
      expect(screen.getByLabelText(/Label/)).toHaveValue('VIEUX');
      expect(screen.getByLabelText(/Usage maximum/)).toHaveValue(null);
      const heading = screen.getByRole('heading', { name: 'Modifier le code' });
      fireEvent.click(within(heading.parentElement!).getByRole('button'));
      expect(screen.queryByRole('heading', { name: 'Modifier le code' })).not.toBeInTheDocument();
    });

    it('supprime un code depuis le tableau et depuis une carte', async () => {
      renderPage();
      tab(/Codes promotionnels/);
      const table = await screen.findByRole('table', { name: 'Codes promotionnels' });

      calls = [];
      await act(async () => fireEvent.click(within(table).getAllByTitle('Supprimer')[0]!));
      expect(calls[0]).toMatchObject({ url: '/api/promotion-codes/c1', method: 'DELETE' });
      expect(notify.addSuccess).toHaveBeenCalledWith('Code promotionnel supprimé');

      respond = () => ({ ok: false, data: { success: false, error: 'Code utilisé' } });
      await act(async () => fireEvent.click(screen.getAllByRole('button', { name: /^Supprimer$/ })[0]!));
      expect(notify.addError).toHaveBeenCalledWith('Code utilisé');

      state.confirm = false;
      calls = [];
      await act(async () => fireEvent.click(within(table).getAllByTitle('Supprimer')[1]!));
      await act(async () => fireEvent.click(screen.getAllByRole('button', { name: /^Supprimer$/ })[1]!));
      expect(calls).toEqual([]);
    });
  });

  describe('packs', () => {
    const packs = [
      { id: 'pk1', label: 'Pack Santé', description: 'Bilan complet', category: 'HEALTH', serviceIds: ['s1'], isActive: true },
      { _id: 'm2', id: 'pk2', label: 'Pack École', category: 'EDUCATION', serviceIds: 'oups', isActive: false },
    ];

    beforeEach(() => {
      respond = ({ url, method }) =>
        url === '/api/packs' && method === 'GET' ? { data: { success: true, data: packs } } : undefined;
    });

    it('liste les packs et les filtre', async () => {
      renderPage();
      tab(/Packs/);
      expect(await screen.findByText('Pack Santé')).toBeInTheDocument();
      expect(screen.getByText('Bilan complet')).toBeInTheDocument();
      expect(screen.getByText('Inactif')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Packs \(2\)/ })).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText('Rechercher un pack...'), { target: { value: 'pk2' } });
      expect(screen.queryByText('Pack Santé')).not.toBeInTheDocument();
      fireEvent.change(screen.getByPlaceholderText('Rechercher un pack...'), { target: { value: '' } });
      fireEvent.change(screen.getByTitle('Filtrer par catégorie'), { target: { value: 'BTP' } });
      expect(screen.getByText('Aucun pack')).toBeInTheDocument();
    });

    it('signale un chargement en échec', async () => {
      respond = () => ({ data: { success: false, error: 'Packs indisponibles' } });
      renderPage();
      tab(/Packs/);
      await waitFor(() => expect(notify.addError).toHaveBeenCalledWith('Packs indisponibles'));

      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('offline'));
      tab(/Services/);
      tab(/Packs/);
      await waitFor(() => expect(notify.addError).toHaveBeenCalledWith('Erreur lors du chargement des packs'));
    });

    it('crée un pack avec ses services', async () => {
      renderPage();
      tab(/Packs/);
      await screen.findByText('Pack Santé');
      fireEvent.click(screen.getByRole('button', { name: /Nouveau pack/ }));
      const form = screen.getByRole('button', { name: 'Créer' }).closest('form')!;
      fireEvent.submit(form);
      expect(notify.addWarning).toHaveBeenCalledWith('Le nom du pack est requis');
      fireEvent.change(screen.getByLabelText(/Nom du pack/), { target: { value: ' Pack BTP ' } });
      fireEvent.submit(form);
      expect(notify.addWarning).toHaveBeenCalledWith('Sélectionnez au moins un service');

      fireEvent.change(screen.getByTitle('Catégorie du pack'), { target: { value: 'BTP' } });
      fireEvent.click(screen.getByRole('checkbox', { name: /Service s3/ }));
      fireEvent.click(screen.getByLabelText(/Pack actif/));
      calls = [];
      await act(async () => fireEvent.submit(form));
      expect(calls[0]).toMatchObject({
        url: '/api/packs',
        method: 'POST',
        body: { label: 'Pack BTP', category: 'BTP', serviceIds: ['s3'], isActive: false },
      });
      expect(notify.addSuccess).toHaveBeenCalledWith('Pack créé avec succès');
    });

    it('modifie un pack, désélectionne un service, et signale un échec', async () => {
      renderPage();
      tab(/Packs/);
      await screen.findByText('Pack Santé');
      fireEvent.click(screen.getAllByTitle('Modifier')[0]!);
      expect(screen.getByRole('heading', { name: 'Modifier le pack' })).toBeInTheDocument();
      const box = screen.getByRole('checkbox', { name: /Service s1/ });
      fireEvent.click(box);
      fireEvent.click(box);
      calls = [];
      await act(async () => fireEvent.click(inForm('Modifier')));
      expect(calls[0]).toMatchObject({ url: '/api/packs/pk1', method: 'PATCH', body: { serviceIds: ['s1'] } });
      expect(notify.addSuccess).toHaveBeenCalledWith('Pack modifié avec succès');

      fireEvent.click(screen.getAllByTitle('Modifier')[1]!);
      fireEvent.change(screen.getByTitle('Catégorie du pack'), { target: { value: 'BTP' } });
      fireEvent.change(screen.getByTitle('Catégorie du pack'), { target: { value: 'EDUCATION' } });
      expect(screen.getByText('Service s2')).toBeInTheDocument();
      respond = () => ({ ok: false, status: 409, data: {} });
      fireEvent.click(screen.getByRole('checkbox', { name: /Service s2/ }));
      await act(async () => fireEvent.click(inForm('Modifier')));
      expect(notify.addError).toHaveBeenCalledWith('Erreur HTTP: 409');
      fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
      expect(screen.queryByRole('heading', { name: 'Modifier le pack' })).not.toBeInTheDocument();
    });

    it('indique qu’aucun service n’existe dans une catégorie vide', async () => {
      state.services = [svc('s1')];
      renderPage();
      tab(/Packs/);
      await screen.findByText('Pack Santé');
      fireEvent.click(screen.getByRole('button', { name: /Nouveau pack/ }));
      fireEvent.change(screen.getByTitle('Catégorie du pack'), { target: { value: 'BTP' } });
      expect(screen.getByText('Aucun service disponible dans cette catégorie.')).toBeInTheDocument();
    });

    it('supprime un pack après confirmation', async () => {
      renderPage();
      tab(/Packs/);
      await screen.findByText('Pack Santé');
      calls = [];
      await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
      expect(calls[0]).toMatchObject({ url: '/api/packs/pk1', method: 'DELETE' });
      expect(notify.addSuccess).toHaveBeenCalledWith('Pack supprimé avec succès');

      respond = () => ({ ok: false, data: { message: 'Pack vendu' } });
      await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
      expect(notify.addError).toHaveBeenCalledWith('Pack vendu');

      state.confirm = false;
      calls = [];
      await act(async () => fireEvent.click(screen.getAllByTitle('Supprimer')[0]!));
      expect(calls).toEqual([]);
    });
  });
});
