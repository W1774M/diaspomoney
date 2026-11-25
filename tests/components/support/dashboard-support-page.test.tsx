/**
 * Espace client › Contact support : le message part vraiment dans la conversation support
 * (POST /api/messaging/support). Avant, l'envoi était simulé et rien n'arrivait au support.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks', () => ({ useAuth: () => ({ isAuthenticated: true, isLoading: false }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

import DashboardSupportPage from '@/app/dashboard/settings/support/page';

const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  vi.stubGlobal('fetch', fetchMock);
});

const fillAndSend = () => {
  fireEvent.change(document.getElementById('support-subject')!, { target: { name: 'subject', value: 'Facture introuvable' } });
  fireEvent.change(document.getElementById('support-message')!, { target: { name: 'message', value: 'Je ne trouve pas ma facture de novembre.' } });
  fireEvent.submit(document.getElementById('support-message')!.closest('form')!);
};

describe('Contact support (espace client)', () => {
  it('envoie le message dans la conversation support et l’annonce', async () => {
    render(<DashboardSupportPage />);
    fillAndSend();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/messaging/support', expect.objectContaining({ method: 'POST' })));
    const { text } = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(text).toContain('Facture introuvable');
    expect(text).toContain('Je ne trouve pas ma facture de novembre.');
    expect(await screen.findByRole('link', { name: 'votre conversation avec le support' })).toHaveAttribute('href', '/dashboard/messaging/support');
  });

  it('affiche l’erreur si l’envoi échoue, sans annoncer de succès', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'Service indisponible' }) });
    render(<DashboardSupportPage />);
    fillAndSend();
    expect(await screen.findByRole('alert')).toHaveTextContent('Service indisponible');
    expect(screen.queryByText(/envoyé au support/)).not.toBeInTheDocument();
  });
});
