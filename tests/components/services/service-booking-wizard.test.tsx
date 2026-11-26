import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notify = vi.hoisted(() => ({
  addSuccess: vi.fn(),
  addError: vi.fn(),
  addWarning: vi.fn(),
  addInfo: vi.fn(),
}));
const state = vi.hoisted(() => ({
  user: null as null | { name?: string; email?: string; phone?: string },
  services: [] as unknown[],
  servicesLoading: false,
  servicesError: null as string | null,
  options: [] as unknown[],
  optionsLoading: false,
  optionsError: null as string | null,
  refetchServices: vi.fn(),
  refetchOptions: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@/components/ui/Notification', () => ({ useNotificationManager: () => notify }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: state.push }) }));
vi.mock('@/hooks/auth/useAuth', () => ({
  useAuth: () => ({ user: state.user, isAuthenticated: !!state.user }),
}));
vi.mock('@/hooks/services/useServices', () => ({
  useServices: () => ({
    services: state.services,
    loading: state.servicesLoading,
    error: state.servicesError,
    refetch: state.refetchServices,
  }),
}));
vi.mock('@/hooks/services/useServiceOptions', () => ({
  useServiceOptions: () => ({
    options: state.options,
    loading: state.optionsLoading,
    error: state.optionsError,
    refetch: state.refetchOptions,
  }),
}));
// Saisie téléphone simplifiée : la bibliothèque n'est pas l'objet du test.
vi.mock('react-international-phone', () => ({
  PhoneInput: ({ value, onChange, ...rest }: { value: string; onChange: (v: string) => void; 'aria-label'?: string }) => (
    <input aria-label={rest['aria-label']} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
// Stripe remplacé par deux boutons qui simulent l'issue du paiement.
vi.mock('@/components/payments/StripeCheckout', () => ({
  StripeCheckout: ({
    amountInMinorUnit,
    onSuccess,
    onError,
    renderActions,
  }: {
    amountInMinorUnit: number;
    onSuccess: (id: string) => void;
    onError: (e: string) => void;
    renderActions: (a: { submitting: boolean }) => React.ReactNode;
  }) => (
    <div>
      <p>Montant Stripe : {amountInMinorUnit}</p>
      <button type="button" onClick={() => onSuccess('pi_123')}>Payer</button>
      <button type="button" onClick={() => onError('carte refusée')}>Échec carte</button>
      {renderActions({ submitting: false })}
    </div>
  ),
}));

import { ServiceBookingWizard } from '../../../components/services/ServiceBookingWizard';

const STORAGE_KEY = 'serviceBookingData';

type Call = { url: string; method: string; body: any };
let calls: Call[];
let respond: (call: Call) => { ok?: boolean; status?: number; data?: unknown; badJson?: boolean } | undefined;

const clinic = {
  id: 'cl1',
  name: 'Clinique du Port',
  image: '/c.png',
  location: 'Douala',
  specialties: ['Cardiologie', 'Pédiatrie'],
  generalistPrice: '20',
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  state.user = null;
  state.servicesLoading = false;
  state.servicesError = null;
  state.optionsLoading = false;
  state.optionsError = null;
  state.services = [
    { id: 'svc-a', category: 'EDUCATION', label: 'Frais de scolarité', description: 'Paiement de l’école', price: 100, important: false, optional: true },
    { id: 'svc-b', category: 'EDUCATION', label: 'Cours particuliers', description: 'Soutien', price: 40, important: true },
    { id: 'svc-c', category: 'EDUCATION', label: 'Sur mesure', description: 'Devis', price: 0, important: false },
  ];
  state.options = [
    { id: 'opt-1', category: 'EDUCATION', label: 'Fournitures', description: 'Cahiers', price: 15, associatedServices: [] },
    { id: 'opt-2', category: 'EDUCATION', label: 'Uniforme', description: 'Tenue', price: 25, associatedServices: ['svc-a'] },
    { id: 'opt-3', category: 'EDUCATION', label: 'Cantine', description: 'Repas', price: 30, associatedServices: ['svc-b'] },
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
    const data = r.data ?? (call.url.includes('track-progress') ? { bookingId: 'draft-1' } : { success: true });
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      statusText: r.ok === false ? 'Bad Request' : 'OK',
      json: async () => {
        if (r.badJson) throw new Error('not json');
        return data;
      },
      text: async () => 'texte brut',
    } as Response;
  });
});

const next = () => act(async () => fireEvent.click(screen.getByRole('button', { name: /Suivant/ })));
const type = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fillPeople() {
  type('Prénom du client', 'Awa');
  type('Nom du client', 'Diallo');
  type('Téléphone du client', '+33600000000');
  type('Email du client', 'awa@example.com');
  type('Prénom du bénéficiaire', 'Moussa');
  type('Nom du bénéficiaire', 'Diallo');
  type('Téléphone du bénéficiaire', '+237600000000');
  type('Email du bénéficiaire', 'moussa@example.com');
  type('Localisation du bénéficiaire', 'Yaoundé');
}

async function toPayment(serviceLabel = 'Frais de scolarité', options: string[] = []) {
  fillPeople();
  await next();
  fireEvent.click(screen.getByRole('button', { name: new RegExp(serviceLabel) }));
  for (const o of options) fireEvent.click(screen.getByRole('button', { name: new RegExp(o) }));
  await next();
}

describe('Assistant de réservation de service', () => {
  it('présente l’en-tête du type de service et les étapes', () => {
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    expect(screen.getByRole('heading', { name: 'Réservation - Service Éducation' })).toBeInTheDocument();
    expect(screen.getByText(/Paiement direct et sécurisé des frais d'éducation/)).toBeInTheDocument();
    expect(screen.getByText('Informations du bénéficiaire ou Élève')).toBeInTheDocument();
    expect(screen.getByText('Vous faites')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Suivant/ })).toBeDisabled();
  });

  it.each([
    ['BTP', 'Réservation - Service Immobilier', 'ou Contact Local'],
    ['HEALTH', 'Réservation - Service Santé', 'Disponibilités du bénéficiaire'],
  ] as const)('adapte l’écran au type %s', (type, title, extra) => {
    render(<ServiceBookingWizard initialServiceType={type} />);
    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(extra))).toBeInTheDocument();
  });

  it('n’affiche ni en-tête ni étapes sans type de service', () => {
    render(<ServiceBookingWizard />);
    expect(screen.queryByRole('heading', { name: /Réservation - Service/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Vous faites')).not.toBeInTheDocument();
  });

  it('pré-remplit le client connecté et annule à la première étape', () => {
    state.user = { name: 'Awa Marie Diallo', email: 'awa@example.com', phone: '+33611111111' };
    const onCancel = vi.fn();
    render(<ServiceBookingWizard initialServiceType="EDUCATION" onCancel={onCancel} />);
    expect(screen.getByLabelText('Prénom du client')).toHaveValue('Awa');
    expect(screen.getByLabelText('Nom du client')).toHaveValue('Marie Diallo');
    expect(screen.getByLabelText('Email du client')).toHaveValue('awa@example.com');
    fireEvent.click(screen.getByRole('button', { name: /Annuler/ }));
    expect(onCancel).toHaveBeenCalled();
  });

  it('parcourt le choix du service et des options, puis revient en arrière', async () => {
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    fillPeople();
    await next();

    expect(calls[0]).toMatchObject({ url: '/api/bookings/track-progress', method: 'POST', body: { step: 1 } });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).clientInfo.firstName).toBe('Awa');

    expect(screen.getByRole('heading', { name: 'Sélectionnez le service' })).toBeInTheDocument();
    // Le service important passe en tête
    const cards = screen.getAllByRole('button').filter((b) => b.querySelector('h3'));
    expect(cards[0]).toHaveTextContent('Cours particuliers');
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('Sur devis')).toBeInTheDocument();
    expect(screen.getByText('Optionnel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Suivant/ })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /Frais de scolarité/ }));
    expect(screen.getByRole('heading', { name: 'Options supplémentaires' })).toBeInTheDocument();
    // Options globales + liées au service ; pas celles d'un autre service
    expect(screen.getByRole('button', { name: /Fournitures/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Uniforme/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Cantine/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Fournitures/ }));
    fireEvent.click(screen.getByRole('button', { name: /Uniforme/ }));
    expect(screen.getByText('Frais de scolarité + 2 options')).toBeInTheDocument();
    expect(screen.getByText('140€')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Uniforme/ }));
    expect(screen.getByText('Frais de scolarité + 1 option')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Précédent/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Informations' })).toBeInTheDocument();
  });

  it('gère le chargement, l’erreur et l’absence de services', async () => {
    state.servicesLoading = true;
    const { unmount } = render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    fillPeople();
    await next();
    expect(screen.getByText('Chargement des services...')).toBeInTheDocument();
    unmount();

    state.servicesLoading = false;
    state.servicesError = 'Base injoignable';
    const second = render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await next();
    expect(screen.getByText('Base injoignable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(state.refetchServices).toHaveBeenCalled();
    second.unmount();

    state.servicesError = null;
    state.services = [];
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await next();
    expect(screen.getByText('Aucun service disponible pour ce type')).toBeInTheDocument();
  });

  it('gère le chargement, l’erreur et l’absence d’options', async () => {
    state.optionsLoading = true;
    const first = render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    fillPeople();
    await next();
    fireEvent.click(screen.getByRole('button', { name: /Frais de scolarité/ }));
    expect(screen.getByText('Chargement des options...')).toBeInTheDocument();
    first.unmount();

    state.optionsLoading = false;
    state.optionsError = 'Options KO';
    const second = render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await next();
    fireEvent.click(screen.getByRole('button', { name: /Frais de scolarité/ }));
    expect(screen.getByText('Options KO')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(state.refetchOptions).toHaveBeenCalled();
    second.unmount();

    state.optionsError = null;
    state.options = [{ id: 'x', label: 'Autre', description: '', price: 5, associatedServices: ['svc-z'] }];
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await next();
    fireEvent.click(screen.getByRole('button', { name: /Frais de scolarité/ }));
    expect(screen.getByText('Aucune option supplémentaire disponible pour ce service')).toBeInTheDocument();
  });

  it('applique un code promotionnel, puis le retire', async () => {
    render(<ServiceBookingWizard initialServiceType="EDUCATION" initialClinic={clinic} />);
    await toPayment();
    expect(screen.getByRole('heading', { level: 2, name: 'Paiement sécurisé' })).toBeInTheDocument();
    expect(screen.getByText('Clinique du Port')).toBeInTheDocument();
    expect(screen.getByText('Montant Stripe : 10000')).toBeInTheDocument();

    respond = ({ url }) =>
      url === '/api/promotion-codes/validate'
        ? { data: { success: true, valid: true, code: { _id: 'pc1', label: 'ECOLE', percentage: 10 }, discount: { amount: 10, percentage: 10 } } }
        : undefined;
    const input = screen.getByPlaceholderText('Entrez votre code promotionnel');
    fireEvent.change(input, { target: { value: 'ecole' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Appliquer' })));
    expect(calls.at(-1)).toMatchObject({ body: { label: 'ECOLE', amount: 100 } });
    expect(screen.getByText(/Code appliqué : 10% de réduction/)).toBeInTheDocument();
    expect(screen.getByText('Réduction (10%)')).toBeInTheDocument();
    expect(screen.getByText('Code: ECOLE')).toBeInTheDocument();
    expect(screen.getByText('Montant Stripe : 9000')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByText(/Code appliqué/)).not.toBeInTheDocument();
    expect(screen.getByText('Montant Stripe : 10000')).toBeInTheDocument();
  });

  it('signale un code refusé, validé à la sortie du champ', async () => {
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await toPayment();
    respond = () => ({ data: { success: true, valid: false, error: 'Code expiré' } });
    const input = screen.getByPlaceholderText('Entrez votre code promotionnel');
    fireEvent.change(input, { target: { value: 'VIEUX' } });
    await act(async () => fireEvent.blur(input));
    expect(screen.getByText('Code expiré')).toBeInTheDocument();
    expect(notify.addError).toHaveBeenCalledWith('Code expiré');
  });

  it('signale une erreur de paiement et permet de revenir au choix du service', async () => {
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await toPayment();
    fireEvent.click(screen.getByRole('button', { name: 'Échec carte' }));
    expect(notify.addError).toHaveBeenCalledWith('Erreur de paiement: carte refusée');
    fireEvent.click(screen.getByRole('button', { name: /Précédent/ }));
    expect(screen.getByRole('heading', { name: 'Sélectionnez le service' })).toBeInTheDocument();
  });

  it('bloque le paiement d’un service sur devis (montant nul)', async () => {
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await toPayment('Sur mesure');
    expect(screen.getByText('Montant invalide')).toBeInTheDocument();
  });

  it('confirme la réservation après paiement, puis mène au détail et à la liste', async () => {
    const onComplete = vi.fn();
    respond = ({ url }) =>
      url === '/api/services/book'
        ? { data: { success: true, booking: { _id: 'bk-9', reservationNumber: 'RES-001' } } }
        : undefined;
    render(<ServiceBookingWizard initialServiceType="EDUCATION" initialClinic={clinic} onComplete={onComplete} />);
    await toPayment('Frais de scolarité', ['Fournitures']);
    expect(screen.getByText('Options supplémentaires:')).toBeInTheDocument();

    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Payer' })));

    const book = calls.find((c) => c.url === '/api/services/book')!;
    expect(book.body).toMatchObject({
      serviceType: 'EDUCATION',
      paymentIntentId: 'pi_123',
      clientInfo: { firstName: 'Awa', email: 'awa@example.com' },
      beneficiaryInfo: { firstName: 'Moussa', email: 'moussa@example.com', location: { address: 'Yaoundé' } },
      selectedService: { serviceId: 'svc-a', price: 100 },
      metadata: { draftBookingId: 'draft-1', clinicId: 'cl1', clinicSpecialties: 'Cardiologie, Pédiatrie' },
    });
    expect(book.body.appointmentDate).toBeUndefined();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(onComplete).toHaveBeenCalledWith('bk-9');
    expect(notify.addSuccess).toHaveBeenCalledWith('Réservation confirmée ! Numéro: RES-001');

    expect(screen.getByRole('heading', { name: 'Réservation confirmée !' })).toBeInTheDocument();
    expect(screen.getByText('RES-001')).toBeInTheDocument();
    expect(screen.getByText('Cardiologie, Pédiatrie')).toBeInTheDocument();
    expect(screen.getByText('Moussa Diallo')).toBeInTheDocument();
    expect(screen.getByText(/Une notification a également été envoyée à/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Voir les détails' }));
    expect(state.push).toHaveBeenCalledWith('/dashboard/bookings/bk-9');
    fireEvent.click(screen.getByRole('button', { name: 'Voir mes réservations' }));
    expect(state.push).toHaveBeenCalledWith('/dashboard/bookings');
  });

  it('confirme même sans identifiant de réservation dans la réponse', async () => {
    respond = ({ url }) => (url === '/api/services/book' ? { data: { success: true } } : undefined);
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await toPayment();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Payer' })));
    expect(notify.addSuccess).toHaveBeenCalledWith('Réservation confirmée !');
    expect(screen.queryByRole('button', { name: 'Voir les détails' })).not.toBeInTheDocument();
  });

  it.each([
    ['une erreur HTTP', { ok: false, status: 422, data: { errors: [{ path: ['clientInfo', 'email'], message: 'invalide' }, 'autre'] } }],
    ['une réponse non JSON', { ok: false, status: 502, badJson: true }],
    ['success=false', { data: { success: false, error: 'Stock épuisé' } }],
  ])('passe à la confirmation avec un avertissement après paiement malgré %s', async (_label, r) => {
    respond = ({ url }) => (url === '/api/services/book' ? r : undefined);
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await toPayment();
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Payer' })));
    expect(notify.addWarning).toHaveBeenCalledWith(expect.stringContaining('Paiement confirmé, mais erreur'));
    expect(screen.getByRole('heading', { name: 'Réservation confirmée !' })).toBeInTheDocument();
  });

  it('signale une panne réseau à l’envoi de la réservation', async () => {
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    await toPayment();
    vi.mocked(global.fetch).mockImplementation(async (input) => {
      if (String(input) === '/api/services/book') throw new Error('offline');
      return { ok: false, status: 500, json: async () => ({}) } as Response;
    });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Payer' })));
    expect(notify.addError).toHaveBeenCalledWith(
      'Une erreur est survenue lors de la soumission: offline. Veuillez réessayer.',
    );
  });

  describe('santé : créneaux', () => {
    it('charge les créneaux du jour et exige un créneau', async () => {
      respond = ({ url }) =>
        url.startsWith('/api/scheduling/slots')
          ? { data: { success: true, slots: [{ start: '2026-12-02T09:00', end: '2026-12-02T09:30', time: '09:00' }] } }
          : url === '/api/services/book'
            ? { data: { success: true, bookingId: 'bk-h' } }
            : undefined;
      state.services = [{ id: 'h1', category: 'HEALTH', label: 'Consultation', description: 'Généraliste', price: 30 }];
      state.options = [];
      render(<ServiceBookingWizard initialServiceType="HEALTH" />);
      fillPeople();
      expect(screen.getByLabelText('Créneau de disponibilité')).toBeDisabled();
      type('Date de disponibilité', '2026-12-02');
      await waitFor(() => expect(screen.getByLabelText('Créneau de disponibilité')).toBeEnabled());
      expect(calls.find((c) => c.url.startsWith('/api/scheduling/slots'))!.url).toBe('/api/scheduling/slots?date=2026-12-02');
      expect(screen.getByRole('button', { name: /Suivant/ })).toBeDisabled();
      type('Créneau de disponibilité', '2026-12-02T09:00');
      expect(screen.getByRole('button', { name: /Suivant/ })).toBeEnabled();

      await next();
      fireEvent.click(screen.getByRole('button', { name: /Consultation/ }));
      await next();
      await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Payer' })));

      const book = calls.find((c) => c.url === '/api/services/book')!;
      expect(book.body).toMatchObject({
        appointmentDate: '2026-12-02',
        appointmentTime: '09:00',
        metadata: { cossSlotStart: '2026-12-02T09:00' },
      });
      expect(screen.getByText('Rendez-vous')).toBeInTheDocument();
      expect(screen.getByText('09:00')).toBeInTheDocument();
    });

    it('affiche l’erreur de chargement des créneaux', async () => {
      respond = () => ({ ok: false, data: { success: false, error: 'Agenda indisponible' } });
      render(<ServiceBookingWizard initialServiceType="HEALTH" />);
      type('Date de disponibilité', '2026-12-03');
      expect(await screen.findByText('Agenda indisponible')).toBeInTheDocument();
      expect(screen.getByText('Aucun créneau')).toBeInTheDocument();
    });
  });

  describe('brouillon', () => {
    it('reprend l’étape enregistrée et l’identifiant de brouillon', async () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentStep: 2,
          serviceType: 'EDUCATION',
          clientInfo: { firstName: 'Awa', lastName: 'D', phone: '1', email: 'a@x.fr' },
          beneficiaryInfo: { firstName: 'M', lastName: 'D', phone: '2' },
          selectedService: null,
          additionalOptions: 'cassé',
          paymentIntentId: null,
          paymentConfirmed: false,
          availability: { selectedDate: null, selectedTime: null },
          totalAmount: 0,
          draftBookingId: 'draft-old',
        }),
      );
      render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
      expect(screen.getByRole('heading', { name: 'Sélectionnez le service' })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Cours particuliers/ }));
      await next();
      expect(calls[0]!.body.bookingId).toBe('draft-old');
    });

    it('repart de zéro si le brouillon a déjà été payé', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          currentStep: 3,
          serviceType: 'EDUCATION',
          clientInfo: { firstName: 'Ancien' },
          beneficiaryInfo: {},
          additionalOptions: [],
          paymentIntentId: 'pi_old',
          paymentConfirmed: true,
          availability: { selectedDate: null, selectedTime: null },
          totalAmount: 10,
        }),
      );
      render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
      expect(screen.getByRole('heading', { level: 2, name: 'Informations' })).toBeInTheDocument();
      expect(screen.getByLabelText('Prénom du client')).toHaveValue('');
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('ignore un brouillon d’un autre type de service', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentStep: 2, serviceType: 'BTP', clientInfo: {} }));
      render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
      expect(screen.getByRole('heading', { level: 2, name: 'Informations' })).toBeInTheDocument();
    });
  });

  it('continue si le suivi de progression échoue', async () => {
    respond = ({ url }) => (url.includes('track-progress') ? { ok: false, status: 500, data: {} } : undefined);
    render(<ServiceBookingWizard initialServiceType="EDUCATION" />);
    fillPeople();
    await next();
    expect(screen.getByRole('heading', { name: 'Sélectionnez le service' })).toBeInTheDocument();

    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('offline'));
    fireEvent.click(screen.getByRole('button', { name: /Cours particuliers/ }));
    await next();
    expect(screen.getByRole('heading', { level: 2, name: 'Paiement sécurisé' })).toBeInTheDocument();
  });
});
