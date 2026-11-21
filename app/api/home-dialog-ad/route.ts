import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';

export async function GET() {
  const imagePath = path.join(
    process.cwd(),
    'public',
    'img',
    'ads',
    'add-2euros.jpeg',
  );
  const image = await readFile(imagePath);

  return new Response(image, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
      'Content-Type': 'image/jpeg',
    },
  });
}
