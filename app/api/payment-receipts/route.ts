import { auth } from '@/lib/auth';
import { getMongoClient } from '@/lib/database/mongodb';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';

    // Connexion à la base de données
    const client = await getMongoClient();
    const db = client.db();
    const receiptsCollection = db.collection('payment_receipts');

    // Construire le filtre
    const filter: any = { userId: session.user.id };
    if (status !== 'all') {
      filter.status = status;
    }

    // Récupérer les reçus avec pagination
    const skip = (page - 1) * limit;
    const receipts = await receiptsCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Compter le total
    const total = await receiptsCollection.countDocuments(filter);

    // Formater les reçus
    const formattedReceipts = receipts.map(receipt => ({
      id: receipt._id.toString(),
      invoiceNumber:
        receipt['invoiceNumber'] || `INV-${receipt._id.toString().slice(-8)}`,
      amount: receipt['amount'] || 0,
      currency: receipt['currency'] || 'EUR',
      status: receipt['status'] || 'pending',
      paymentMethod: receipt['paymentMethod'] || 'Carte bancaire',
      service: receipt['service'] || 'Service',
      provider: receipt['provider'] || 'Prestataire',
      date: receipt['createdAt']?.toISOString() || new Date().toISOString(),
      description: receipt['description'] || '',
      downloadUrl: receipt['downloadUrl'] || '',
    }));

    return NextResponse.json({
      success: true,
      receipts: formattedReceipts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[API][payment-receipts] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des reçus' },
      { status: 500 }
    );
  }
}
