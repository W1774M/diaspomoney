/**
 * GET /api/scheduling/slots?date=YYYY-MM-DD
 * POC : créneaux santé via coss Scheduling (sandbox).
 */
import { NextRequest, NextResponse } from 'next/server';
import { isCossSchedulingConfigured } from '@/lib/coss/client';
import { listHealthSlotsForDate } from '@/lib/coss/scheduling-health-poc';
import { childLogger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const log = childLogger({ route: 'api/scheduling/slots' });

  try {
    if (!isCossSchedulingConfigured()) {
      return NextResponse.json(
        { success: false, error: 'Scheduling coss non configuré' },
        { status: 503 },
      );
    }

    const date = request.nextUrl.searchParams.get('date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Paramètre date=YYYY-MM-DD requis' },
        { status: 400 },
      );
    }

    const slots = await listHealthSlotsForDate(date);
    return NextResponse.json({ success: true, date, slots });
  } catch (error) {
    log.error({ error }, 'Failed to list scheduling slots');
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur slots',
      },
      { status: 500 },
    );
  }
}
