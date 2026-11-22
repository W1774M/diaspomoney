/**
 * POST /api/home-announcements/images — admin : téléverse l'image d'une annonce.
 * L'image est stockée en base (et non sur le disque du pod) pour être servie
 * à l'identique par toutes les instances.
 */
import { handleApiRoute } from '@/lib/api/error-handler';
import { requireApiRoles } from '@/lib/api/auth';
import { ROLES } from '@/lib/constants';
import {
  ANNOUNCEMENT_IMAGE_MAX_BYTES,
  ANNOUNCEMENT_IMAGE_PATH,
  ANNOUNCEMENT_IMAGE_TYPES,
} from '@/lib/home-content';
import { ANNOUNCEMENT_IMAGES_COLLECTION } from '@/lib/home-content.server';
import { childLogger } from '@/lib/logger';
import { getCollection } from '@/lib/mongodb';
import { Binary } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const log = childLogger({ route: 'api/home-announcements/images' });

/** Vérifie la signature binaire : le type annoncé par le navigateur ne suffit pas. */
function sniffImageType(bytes: Uint8Array): string | null {
  const startsWith = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  if (startsWith(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (startsWith(0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (startsWith(0x47, 0x49, 0x46, 0x38)) return 'image/gif';
  if (startsWith(0x52, 0x49, 0x46, 0x46) && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await requireApiRoles([ROLES.ADMIN, ROLES.SUPERADMIN]);

    const formData = await request.formData().catch(() => null);
    const file = formData?.get('image');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Aucune image fournie' }, { status: 400 });
    }
    if (file.size > ANNOUNCEMENT_IMAGE_MAX_BYTES) {
      return NextResponse.json({ error: 'Image trop lourde (2 Mo maximum)' }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const contentType = sniffImageType(bytes);
    if (!contentType || !ANNOUNCEMENT_IMAGE_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Format non pris en charge (JPEG, PNG, WebP ou GIF)' },
        { status: 400 },
      );
    }

    const images = await getCollection(ANNOUNCEMENT_IMAGES_COLLECTION);
    const result = await images.insertOne({
      data: new Binary(bytes),
      contentType,
      size: bytes.byteLength,
      uploadedBy: session.user.id,
      createdAt: new Date(),
    });

    const url = `${ANNOUNCEMENT_IMAGE_PATH}${result.insertedId.toString()}`;
    log.info({ url, size: bytes.byteLength, userId: session.user.id }, 'Announcement image uploaded');
    return NextResponse.json({ success: true, url }, { status: 201 });
  }, 'api/home-announcements/images');
}
