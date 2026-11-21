import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import BookingServiceInfo from '../../components/bookings/BookingServiceInfo';
import type { BookingResponse } from '../../lib/mappers/booking.mapper';

vi.mock('../../hooks/bookings/useBookingSharedElements', () => ({
  useBookingSharedElements: () => ({
    isElementAllowed: () => true,
  }),
}));

describe('BookingServiceInfo', () => {
  it('affiche la clinique sélectionnée depuis les métadonnées', () => {
    const booking = {
      id: 'booking-1',
      _id: 'booking-1',
      reservationNumber: 'DM-001',
      requesterId: 'customer-1',
      providerId: 'provider-1',
      serviceId: 'service-1',
      serviceType: 'HEALTH',
      status: 'PENDING',
      metadata: {
        serviceLabel: 'Consultation médicale',
        clinicName: 'CLINIQUE SAINT PETERSBOURG',
        clinicLocation: 'Bonaberi - Douala',
        clinicSpecialties: 'Médecine Générale, Pédiatrie',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } satisfies BookingResponse;

    render(
      <BookingServiceInfo
        booking={booking}
        getServiceTypeLabel={() => 'Santé'}
      />,
    );

    expect(screen.getByText('Clinique sélectionnée')).toBeInTheDocument();
    expect(screen.getByText('CLINIQUE SAINT PETERSBOURG')).toBeInTheDocument();
    expect(screen.getByText('Bonaberi - Douala')).toBeInTheDocument();
  });
});
