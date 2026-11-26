import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const stripeState = vi.hoisted(() => ({
  stripe: null as null | { confirmPayment: ReturnType<typeof vi.fn>; retrievePaymentIntent: ReturnType<typeof vi.fn> },
  element: {} as unknown,
  getElement: vi.fn(),
}));

vi.mock('@stripe/stripe-js', () => ({ loadStripe: vi.fn(() => Promise.resolve({})) }));
vi.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: ReactNode }) => <div data-testid="elements">{children}</div>,
  PaymentElement: ({ onReady }: { onReady: () => void }) => (
    <button type="button" onClick={onReady}>
      Formulaire carte prêt
    </button>
  ),
  useStripe: () => stripeState.stripe,
  useElements: () => ({ getElement: stripeState.getElement }),
}));

type Props = import('../../../components/payments/StripeCheckout').StripeCheckoutProps;

async function load(key: string | null = 'pk_test_123') {
  vi.resetModules();
  if (key === null) vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', '');
  else vi.stubEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', key);
  return (await import('../../../components/payments/StripeCheckout')).StripeCheckout;
}

let intentCalls: { body: any }[];
let intentResponse: () => Promise<Partial<Response>>;

beforeEach(() => {
  vi.clearAllMocks();
  intentCalls = [];
  stripeState.stripe = { confirmPayment: vi.fn(), retrievePaymentIntent: vi.fn() };
  stripeState.getElement.mockReturnValue({});
  intentResponse = async () => ({ ok: true, json: async () => ({ clientSecret: 'cs_1', paymentIntentId: 'pi_1' }) });
  vi.mocked(global.fetch).mockImplementation(async (_input, init) => {
    intentCalls.push({ body: JSON.parse(String(init?.body)) });
    return (await intentResponse()) as Response;
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const metadata = { serviceId: 's1' };

async function renderReady(extra: Partial<Props> = {}, key?: string) {
  const StripeCheckout = await load(key);
  const onSuccess = vi.fn();
  const onError = vi.fn();
  render(
    <StripeCheckout
      amountInMinorUnit={4250}
      customerEmail="awa@example.com"
      metadata={metadata}
      onSuccess={onSuccess}
      onError={onError}
      {...extra}
    />,
  );
  fireEvent.click(await screen.findByRole('button', { name: 'Formulaire carte prêt' }));
  await screen.findByRole('button', { name: /Payer 42.5€/ });
  return { onSuccess, onError };
}

const pay = () => act(async () => fireEvent.click(screen.getByRole('button', { name: /Payer 42.5€/ })));

describe('StripeCheckout', () => {
  it('signale l’absence de clé publique', async () => {
    const StripeCheckout = await load(null);
    render(<StripeCheckout amountInMinorUnit={100} onSuccess={vi.fn()} />);
    expect(screen.getByText('Clé publique Stripe manquante')).toBeInTheDocument();
  });

  it('nettoie les guillemets autour de la clé et crée l’intention de paiement', async () => {
    const { loadStripe } = await import('@stripe/stripe-js');
    const StripeCheckout = await load(`"'pk_test_quoted'"`);
    render(<StripeCheckout amountInMinorUnit={4250} currency="xaf" customerEmail="a@x.fr" metadata={metadata} onSuccess={vi.fn()} />);
    expect(screen.getByText('Initialisation du paiement sécurisé…')).toBeInTheDocument();
    expect(await screen.findByTestId('elements')).toBeInTheDocument();
    expect(vi.mocked(loadStripe)).toHaveBeenCalledWith('pk_test_quoted');
    expect(intentCalls[0]!.body).toEqual({ amount: 4250, currency: 'xaf', email: 'a@x.fr', metadata });
    expect(screen.getByRole('button', { name: /Chargement du formulaire…/ })).toBeDisabled();
  });

  it.each([
    ['une erreur HTTP détaillée', async () => ({ ok: false, status: 400, json: async () => ({ error: 'Montant invalide', code: 'amount_too_small' }) }), 'Montant invalide (amount_too_small)'],
    ['une erreur HTTP illisible', async () => ({ ok: false, status: 503, json: async () => { throw new Error('x'); } }), 'Erreur inconnue'],
    ['une réponse sans clientSecret', async () => ({ ok: true, json: async () => ({}) }), "Le serveur n'a pas retourné de clientSecret"],
    ['un bloqueur de publicité', async () => { throw new TypeError('Failed to fetch'); }, 'Le paiement est bloqué par votre navigateur'],
  ])('affiche l’échec d’initialisation sur %s, sans relancer en boucle', async (_label, response, message) => {
    intentResponse = response as () => Promise<Partial<Response>>;
    const StripeCheckout = await load();
    const onError = vi.fn();
    render(<StripeCheckout amountInMinorUnit={4250} metadata={metadata} onSuccess={vi.fn()} onError={onError} />);
    expect(await screen.findByText("Impossible d'initialiser le paiement")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(message.replace(/[()]/g, '\\$&')))).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(expect.stringContaining(message));
    // Une seule tentative : l'erreur ne doit pas relancer la création de l'intention
    await new Promise((r) => setTimeout(r, 50));
    expect(intentCalls).toHaveLength(1);
  });

  it('recharge la page sur « Réessayer »', async () => {
    intentResponse = async () => ({ ok: true, json: async () => ({}) });
    const reload = vi.fn();
    const original = window.location;
    Object.defineProperty(window, 'location', { configurable: true, value: { ...original, reload } });
    const StripeCheckout = await load();
    render(<StripeCheckout amountInMinorUnit={4250} metadata={metadata} onSuccess={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Réessayer' }));
    expect(reload).toHaveBeenCalled();
    Object.defineProperty(window, 'location', { configurable: true, value: original });
  });

  it('confirme un paiement réussi', async () => {
    const { onSuccess } = await renderReady();
    stripeState.stripe!.confirmPayment.mockResolvedValue({ paymentIntent: { id: 'pi_ok', status: 'succeeded' } });
    await pay();
    expect(stripeState.stripe!.confirmPayment).toHaveBeenCalledWith(expect.objectContaining({ redirect: 'if_required' }));
    expect(onSuccess).toHaveBeenCalledWith('pi_ok');
    expect(screen.getByRole('button', { name: /Paiement confirmé/ })).toBeDisabled();
  });

  it.each(['requires_action', 'processing'])('accepte le statut %s comme un succès', async (status) => {
    const { onSuccess } = await renderReady();
    stripeState.stripe!.confirmPayment.mockResolvedValue({ paymentIntent: { id: 'pi_s', status } });
    await pay();
    expect(onSuccess).toHaveBeenCalledWith('pi_s');
  });

  it('refuse un paiement non complété et permet de réessayer', async () => {
    const { onSuccess, onError } = await renderReady();
    stripeState.stripe!.confirmPayment.mockResolvedValue({ paymentIntent: { id: 'pi_x', status: 'canceled' } });
    await pay();
    expect(onError).toHaveBeenCalledWith('Paiement non complété. Statut: canceled');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Payer 42.5€/ })).toBeEnabled();
  });

  it('remonte l’erreur Stripe de confirmation', async () => {
    const { onError } = await renderReady();
    stripeState.stripe!.confirmPayment.mockResolvedValue({
      error: { message: 'Carte refusée', type: 'card_error', code: 'card_declined', decline_code: 'generic', param: 'card', payment_intent: { id: 'pi_e' }, payment_method: 'pm_1' },
    });
    await pay();
    expect(onError).toHaveBeenCalledWith('Carte refusée');
  });

  it('considère comme payé un intent déjà confirmé (état inattendu)', async () => {
    const { onSuccess } = await renderReady();
    stripeState.stripe!.confirmPayment.mockResolvedValue({
      error: { type: 'invalid_request_error', code: 'payment_intent_unexpected_state', payment_intent: 'pi_done', payment_method: { id: 'pm_2' } },
    });
    stripeState.stripe!.retrievePaymentIntent.mockResolvedValue({ paymentIntent: { status: 'succeeded' } });
    await pay();
    expect(stripeState.stripe!.retrievePaymentIntent).toHaveBeenCalledWith('pi_done');
    expect(onSuccess).toHaveBeenCalledWith('pi_done');
  });

  it('retombe sur l’erreur si l’état de l’intent ne peut être relu', async () => {
    const { onError } = await renderReady();
    stripeState.stripe!.confirmPayment.mockResolvedValue({
      error: { type: 'invalid_request_error', code: 'payment_intent_unexpected_state', payment_intent: 'pi_lost' },
    });
    stripeState.stripe!.retrievePaymentIntent.mockRejectedValue(new Error('réseau'));
    await pay();
    expect(onError).toHaveBeenCalledWith('Le paiement a échoué');
  });

  it('signale l’absence d’intent et les erreurs inattendues', async () => {
    const { onError } = await renderReady();
    stripeState.stripe!.confirmPayment.mockResolvedValue({});
    await pay();
    expect(onError).toHaveBeenCalledWith('Aucune information de paiement retournée');

    stripeState.stripe!.confirmPayment.mockRejectedValue(Object.assign(new Error('boom'), { type: 'api_error', code: 'x' }));
    await pay();
    expect(onError).toHaveBeenCalledWith('boom');
  });

  it('réessaie une fois de retrouver le formulaire avant de confirmer', async () => {
    const { onError } = await renderReady();
    stripeState.getElement.mockReturnValueOnce({}).mockReturnValueOnce(null).mockReturnValueOnce(null);
    await pay();
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith("Le formulaire de paiement n'est plus disponible. Veuillez rafraîchir la page."),
    );
    expect(stripeState.stripe!.confirmPayment).not.toHaveBeenCalled();
  });

  it('signale un formulaire introuvable ou en erreur au moment de payer', async () => {
    const { onError } = await renderReady();
    stripeState.getElement.mockReturnValueOnce(null);
    await pay();
    expect(onError).toHaveBeenCalledWith("Le formulaire de paiement n'est pas disponible. Veuillez rafraîchir la page.");

    stripeState.getElement.mockImplementationOnce(() => {
      throw new Error('détruit');
    });
    await pay();
    expect(onError).toHaveBeenCalledWith('Erreur lors de la vérification du formulaire de paiement.');
  });

  it('signale un formulaire carte qui ne se monte pas', async () => {
    const StripeCheckout = await load();
    const onError = vi.fn();
    render(<StripeCheckout amountInMinorUnit={4250} metadata={metadata} onSuccess={vi.fn()} onError={onError} />);
    stripeState.getElement.mockReturnValueOnce(null);
    fireEvent.click(await screen.findByRole('button', { name: 'Formulaire carte prêt' }));
    expect(await screen.findByText("Erreur d'initialisation")).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(expect.stringContaining("n'a pas pu être initialisé"));

    stripeState.getElement.mockImplementationOnce(() => {
      throw new Error('x');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Formulaire carte prêt' }));
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(expect.stringContaining("Erreur lors de l'initialisation du formulaire")),
    );
  });

  it('affiche les actions fournies à côté du bouton payer', async () => {
    const renderActions = vi.fn(({ amount }: { amount: number }) => <button type="button">Retour ({amount})</button>);
    await renderReady({ renderActions });
    expect(screen.getByRole('button', { name: 'Retour (42.5)' })).toBeInTheDocument();
  });

  it('ne fait rien tant que Stripe n’est pas chargé', async () => {
    stripeState.stripe = null;
    const StripeCheckout = await load();
    render(<StripeCheckout amountInMinorUnit={4250} metadata={metadata} onSuccess={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Formulaire carte prêt' }));
    expect(await screen.findByRole('button', { name: /Payer 42.5€/ })).toBeDisabled();
  });
});
