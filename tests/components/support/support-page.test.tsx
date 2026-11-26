/**
 * Page /support : envoi réel vers /api/support/contact (avant : envoi simulé), erreurs
 * sous les champs reliées par aria-describedby, chat vers la messagerie support.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ push: vi.fn(), addNotification: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: h.push }) }));
vi.mock('@/store/notifications', () => ({ useNotificationStore: () => ({ addNotification: h.addNotification }) }));
vi.mock('react-international-phone', () => ({
  PhoneInput: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input aria-label='Téléphone' value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

import SupportPage from '@/app/support/page';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  vi.stubGlobal('fetch', fetchMock);
});

const fill = () => {
  fireEvent.change(screen.getByLabelText("Niveau d'urgence"), { target: { value: 'medium' } });
  fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'account_issue' } });
  fireEvent.change(screen.getByLabelText('Votre email'), { target: { value: 'awa@test.fr' } });
  fireEvent.change(screen.getByLabelText('Description détaillée'), { target: { value: 'Je ne peux plus me connecter à mon compte.' } });
};
const submit = () => fireEvent.click(screen.getByRole('button', { name: /Envoyer ma demande/ }));

describe('Page /support', () => {
  it('formulaire vide : erreurs sous chaque champ, reliées au champ, rien n’est envoyé', async () => {
    render(<SupportPage />);
    submit();
    const email = screen.getByLabelText('Votre email');
    expect(await screen.findByText('Indiquez votre adresse e-mail.')).toBeInTheDocument();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAttribute('aria-describedby', 'support-userEmail-error');
    expect(document.getElementById('support-userEmail-error')).toHaveTextContent('Indiquez votre adresse e-mail.');
    expect(screen.getByText("Choisissez un niveau d'urgence.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envoie vraiment la demande, puis confirme et vide le formulaire', async () => {
    render(<SupportPage />);
    fill();
    submit();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/support/contact', expect.objectContaining({ method: 'POST' })));
    const sent = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(sent).toMatchObject({ urgency: 'medium', category: 'account_issue', userEmail: 'awa@test.fr', website: '' });
    await waitFor(() => expect(h.addNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' })));
    expect(screen.getByLabelText('Votre email')).toHaveValue('');
  });

  it('affiche l’erreur du serveur, et ses erreurs par champ', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Trop de demandes envoyées.', fieldErrors: { message: 'Message refusé.' } }) });
    render(<SupportPage />);
    fill();
    submit();
    expect(await screen.findByText('Message refusé.')).toBeInTheDocument();
    expect(h.addNotification).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', message: 'Trop de demandes envoyées.' }));
    expect(h.addNotification).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
  });

  it('le chat mène à la vraie messagerie support, sans faux « chat activé »', () => {
    render(<SupportPage />);
    fireEvent.click(screen.getByTitle('Chat en direct avec DiaspoMoney'));
    expect(h.push).toHaveBeenCalledWith('/dashboard/messaging/support');
    expect(h.addNotification).not.toHaveBeenCalled();
    expect(screen.queryByText(/support@diaspomoney/)).not.toBeInTheDocument();
  });
});
