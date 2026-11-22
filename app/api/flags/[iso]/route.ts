/**
 * GET /api/flags/[iso] — drapeau SVG 3:2 d'un pays (code ISO 3166-1 alpha-2).
 * Permet d'afficher n'importe quel pays ajouté par l'admin sans embarquer
 * tous les drapeaux dans le bundle client.
 */
import * as flags from 'country-flag-icons/string/3x2';
import { NextResponse } from 'next/server';

const FLAGS = flags as unknown as Record<string, string | undefined>;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ iso: string }> | { iso: string } },
) {
  const { iso } = await Promise.resolve(params);
  const code = iso.toUpperCase();
  const svg = /^[A-Z]{2}$/.test(code) ? FLAGS[code] : undefined;

  if (!svg) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
