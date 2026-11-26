'use client';

import { AuthorizedRoute } from '@/components/auth';
import { AppointmentsScreen } from '@/components/provider-health/AppointmentsScreen';
import { ROLES } from '@/lib/constants';

/** Mes rendez-vous — prestataire santé, dérivé des réservations qui lui sont attribuées. */
export default function AppointmentsPage() {
  return (
    <AuthorizedRoute roles={[ROLES.PROVIDER]} redirectTo='/dashboard'>
      <AppointmentsScreen />
    </AuthorizedRoute>
  );
}
