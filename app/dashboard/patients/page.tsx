'use client';

import { AuthorizedRoute } from '@/components/auth';
import { PatientsScreen } from '@/components/provider-health/PatientsScreen';
import { ROLES } from '@/lib/constants';

/** Mes patients — prestataire santé, dérivé des réservations qui lui sont attribuées. */
export default function PatientsPage() {
  return (
    <AuthorizedRoute roles={[ROLES.PROVIDER]} redirectTo='/dashboard'>
      <PatientsScreen />
    </AuthorizedRoute>
  );
}
