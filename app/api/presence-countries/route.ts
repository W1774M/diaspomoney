/**
 * Pays de présence affichés sur la page d'accueil.
 * GET  /api/presence-countries — public
 * POST /api/presence-countries — admin : ajoute un pays
 */
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { ROLES } from '@/lib/constants';
import { childLogger } from '@/lib/logger';
import { PresenceCountryCreateSchema } from '@/lib/presence-countries';
import { listPresenceCountries, toPresenceCountry } from '@/lib/presence-countries.server';
import PresenceCountry from '@/models/PresenceCountry';
import { NextRequest, NextResponse } from 'next/server';

const log = childLogger({ route: 'api/presence-countries' });

export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const countries = await listPresenceCountries();
    return NextResponse.json(
      { success: true, countries },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }, 'api/presence-countries');
}

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await requireApiRoles([ROLES.ADMIN, ROLES.SUPERADMIN]);
    const data = validateBody(await request.json(), PresenceCountryCreateSchema);

    // Initialise la liste par défaut avant le premier ajout.
    const existing = await listPresenceCountries();
    if (existing.some((country) => country.iso === data.iso)) {
      return NextResponse.json({ error: 'Ce pays est déjà dans la liste' }, { status: 409 });
    }

    const order = data.order ?? Math.max(0, ...existing.map((country) => country.order)) + 1;
    const created = await PresenceCountry.create({ ...data, order });

    log.info({ iso: data.iso, userId: session.user.id }, 'Presence country created');
    return NextResponse.json(
      { success: true, country: toPresenceCountry(created.toObject()) },
      { status: 201 },
    );
  }, 'api/presence-countries');
}
