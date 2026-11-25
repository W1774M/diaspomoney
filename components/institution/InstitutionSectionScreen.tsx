'use client';

import { AuthorizedRoute } from '@/components/auth';
import { InstitutionDirectory } from '@/components/institution/InstitutionDirectory';
import { ROLES } from '@/lib/constants';
import type { InstitutionSection } from '@/lib/institution/sections';

export function InstitutionSectionScreen({ section }: { section: InstitutionSection }) {
  return (
    <AuthorizedRoute roles={[ROLES.PROVIDER]} redirectTo="/dashboard">
      <InstitutionDirectory section={section} />
    </AuthorizedRoute>
  );
}
