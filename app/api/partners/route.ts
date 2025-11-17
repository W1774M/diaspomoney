import { logger } from '@/lib/logger';
import dbConnect, { getCollection } from '@/lib/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = logger.child({ requestId: reqId, route: 'partners/index' });
  try {
    await dbConnect();
    const col = await getCollection('partners');
    const rawDocs = await col.find({}).toArray();
    const partners = (Array.isArray(rawDocs) ? rawDocs : []).map((d: any) => ({
      id: String(d._id),
      name: d.name,
      logo: d.logo,
      description: d.description,
      website: d.website,
      category: d.category,
      services: Array.isArray(d.services) ? d.services : [],
      location: d.location,
      established: d.established || '',
    }));
    log.info({ msg: 'Partners fetched', count: partners.length });
    return NextResponse.json({ partners });
  } catch (err: any) {
    log.error({ err, msg: 'Failed to fetch partners' });
    return NextResponse.json(
      { error: 'Failed to fetch partners' },
      { status: 500 },
    );
  }
}
