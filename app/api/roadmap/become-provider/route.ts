import { NextRequest, NextResponse } from 'next/server';
import { handleApiRoute } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { z } from 'zod';
import { getMongoClient } from '@/lib/database/mongodb';

const log = childLogger({ route: 'api/roadmap/become-provider' });

const BecomeProviderSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').trim(),
  email: z.string().email('Email invalide').toLowerCase().trim(),
  phone: z.string().min(1, 'Le téléphone est requis').trim(),
});

interface ProviderInterest {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  submittedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function POST(request: NextRequest) {
  return handleApiRoute(
    request,
    async () => {
      const body = await request.json();
      const { name, email, phone } = BecomeProviderSchema.parse(body);

      log.info({ email, name }, 'Demande devenir prestataire (roadmap)');

      const client = await getMongoClient();
      const db = client.db();
      const collection = db.collection<ProviderInterest>('roadmap_provider_interest');

      await collection.insertOne({
        name,
        email,
        phone,
        submittedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      log.info({ email }, 'Demande devenir prestataire enregistrée');

      return NextResponse.json(
        {
          success: true,
          message: 'Votre demande a bien été enregistrée. Vous allez être redirigé.',
        },
        { status: 201 },
      );
    },
    'api/roadmap/become-provider',
  );
}
