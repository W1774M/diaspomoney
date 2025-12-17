'use client';

import { BookingsPage } from '@/components/bookings';
import { BookingsPaginationProvider } from '@/contexts/BookingsPaginationContext';

export default function Bookings() {
  return (
    <BookingsPaginationProvider>
      <BookingsPage />
    </BookingsPaginationProvider>
  );
}
