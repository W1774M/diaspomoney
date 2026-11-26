/**
 * Prestataire attribué : un identifiant de service (« consultation-medical ») ou le marqueur
 * « admin-draft » n'est pas un prestataire — la réservation s'affiche « Non attribué ».
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/bookings/useBookingSharedElements', () => ({
  useBookingSharedElements: () => ({ isElementAllowed: () => true }),
}));
vi.mock('@/hooks/users/useUser', () => ({ useUser: () => ({ user: null, fetchUser: vi.fn() }) }));

import BookingInfoSidebar from '@/components/bookings/BookingInfoSidebar';

const booking = (providerId: string) =>
  ({ id: 'b1', providerId, status: 'PENDING', metadata: {}, createdAt: new Date(), updatedAt: new Date() }) as never;

describe('BookingInfoSidebar — prestataire attribué', () => {
  it.each(['consultation-medical', 'admin-draft', ''])('« %s » s’affiche « Non attribué »', (providerId) => {
    render(<BookingInfoSidebar booking={booking(providerId)} formattedReservationNumber='RES-1' />);
    expect(screen.getByText('Non attribué')).toBeInTheDocument();
    expect(screen.queryByText('Prestataire enregistré')).not.toBeInTheDocument();
  });

  it('un vrai prestataire reste affiché', () => {
    render(<BookingInfoSidebar booking={booking('6b0300000000000000000001')} formattedReservationNumber='RES-1' />);
    expect(screen.getByText('Prestataire enregistré')).toBeInTheDocument();
    expect(screen.getByText('6b0300000000000000000001')).toBeInTheDocument();
  });
});
