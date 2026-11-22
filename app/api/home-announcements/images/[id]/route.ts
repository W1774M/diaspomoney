/**
 * GET /api/home-announcements/images/[id] — image d'une annonce (publique).
 * Une image n'est jamais modifiée (on en téléverse une nouvelle) : cache immuable.
 */
import { ANNOUNCEMENT_IMAGES_COLLECTION } from '@/lib/home-content.server';
import { getCollection } from '@/lib/mongodb';
import { ObjectId, type Binary } from 'mongodb';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const { id } = await Promise.resolve(params);
  if (!ObjectId.isValid(id)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const images = await getCollection(ANNOUNCEMENT_IMAGES_COLLECTION);
  const image = await images.findOne<{ data: Binary; contentType: string }>({
    _id: new ObjectId(id),
  });
  if (!image) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(Buffer.from(image.data.buffer), {
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
