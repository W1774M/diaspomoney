import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppointmentsScreen } from '@/components/provider-health/AppointmentsScreen';
import { PatientsScreen } from '@/components/provider-health/PatientsScreen';

const state = vi.hoisted(() => ({
  value: {
    bookings: [] as any[],
    isLoading: false,
    loading: false,
    error: null as string | null,
    total: 0,
    refetch: vi.fn(),
  },
  lastOptions: undefined as unknown,
}));

vi.mock('@/hooks/bookings/useBookings', () => ({
  useBookings: (options: unknown) => {
    state.lastOptions = options;
    return state.value;
  },
}));

const DAY = 86_400_000;
const iso = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * DAY).toISOString();

let seq = 0;
const booking = (over: Record<string, any> = {}) => ({
  id: `b${++seq}`,
  _id: `b${seq}`,
  reservationNumber: `RES-${seq}`,
  requesterId: 'c1',
  providerId: 'p1',
  serviceId: 's1',
  serviceType: 'HEALTH',
  status: 'CONFIRMED',
  createdAt: iso(-30),
  updatedAt: iso(-30),
  recipient: { firstName: 'Awa', lastName: 'Diallo', phone: '+221770000000' },
  ...over,
});

const setBookings = (bookings: any[], extra: Record<string, unknown> = {}) => {
  state.value = {
    ...state.value,
    bookings,
    total: bookings.length,
    error: null,
    isLoading: false,
    ...extra,
  };
};

beforeEach(() => setBookings([]));

describe('AppointmentsScreen', () => {
  it('charge les réservations du prestataire triées par date de RDV', () => {
    render(<AppointmentsScreen />);
    expect(state.lastOptions).toMatchObject({
      roleFilter: 'PROVIDER',
      sortBy: 'appointmentDate',
    });
    expect(screen.getByText('Aucun rendez-vous à venir')).toBeInTheDocument();
  });

  it('liste les RDV à venir puis l’historique via les onglets', () => {
    setBookings([
      booking({ appointmentDate: iso(3), selectedService: { name: 'Bilan', type: 'health' } }),
      booking({
        appointmentDate: iso(-3),
        status: 'FINISHED',
        recipient: { firstName: 'Moussa', lastName: 'Ba', phone: '1' },
      }),
    ]);
    render(<AppointmentsScreen />);

    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Awa Diallo')).toBeInTheDocument();
    expect(within(panel).queryByText('Moussa Ba')).not.toBeInTheDocument();
    expect(within(panel).getByRole('link')).toHaveAttribute('href', '/dashboard/bookings/b' + (seq - 1));

    fireEvent.click(screen.getByRole('tab', { name: /Passés/ }));
    expect(screen.getByText('Moussa Ba')).toBeInTheDocument();
    expect(screen.getByText('Terminé')).toBeInTheDocument();
  });

  it('affiche l’erreur avec un bouton Réessayer', () => {
    setBookings([], { error: 'Boom' });
    render(<AppointmentsScreen />);
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(state.value.refetch).toHaveBeenCalled();
  });
});

describe('PatientsScreen', () => {
  it('regroupe par patient, filtre par recherche et déplie l’historique', () => {
    setBookings([
      booking({ appointmentDate: iso(-10), status: 'FINISHED' }),
      booking({ appointmentDate: iso(5) }),
      booking({
        appointmentDate: iso(-2),
        status: 'FINISHED',
        recipient: { firstName: 'Élodie', lastName: 'Ba', phone: '0600', email: 'e@x.fr' },
      }),
    ]);
    render(<PatientsScreen />);

    expect(screen.getAllByRole('listitem').filter((li) => li.closest('ul.space-y-3'))).toHaveLength(2);
    expect(screen.getByText('Awa Diallo')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'elodie' } });
    expect(screen.queryByText('Awa Diallo')).not.toBeInTheDocument();
    expect(screen.getByText('Élodie Ba')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Historique/ }));
    expect(screen.getByRole('link', { name: /Consultation/ })).toBeInTheDocument();
  });

  it('signale un état vide', () => {
    render(<PatientsScreen />);
    expect(screen.getByText('Aucun patient pour le moment')).toBeInTheDocument();
  });

  it('prévient quand toutes les réservations ne sont pas chargées', () => {
    setBookings([booking({ appointmentDate: iso(1) })], { total: 800 });
    render(<PatientsScreen />);
    expect(screen.getByText(/sur 800/)).toBeInTheDocument();
  });
});
