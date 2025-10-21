import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../auth/[...nextauth]/route';

// GET /api/beneficiaries - Récupérer tous les bénéficiaires de l'utilisateur
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const db = await getDatabase();
    const beneficiaries = await db
      .collection('beneficiaries')
      .find({ userId: new ObjectId(userId) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ beneficiaries });
  } catch (error) {
    console.error('Erreur lors de la récupération des bénéficiaires:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/beneficiaries - Créer un nouveau bénéficiaire
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, relationship } = body;

    // Validation
    if (!name || !relationship) {
      return NextResponse.json(
        { error: 'Le nom et la relation sont obligatoires' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Vérifier si un bénéficiaire avec le même email existe déjà pour cet utilisateur
    if (email) {
      const existingBeneficiary = await db.collection('beneficiaries').findOne({
        userId: new ObjectId(userId),
        email: email.toLowerCase(),
      });

      if (existingBeneficiary) {
        return NextResponse.json(
          { error: 'Un bénéficiaire avec cet email existe déjà' },
          { status: 409 }
        );
      }
    }

    const beneficiary = {
      userId: new ObjectId(userId),
      name: name.trim(),
      email: email?.toLowerCase().trim() || null,
      phone: phone?.trim() || null,
      relationship: relationship.trim(),
      hasAccount: false, // Par défaut, pas de compte
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('beneficiaries').insertOne(beneficiary);

    return NextResponse.json(
      {
        beneficiary: {
          id: result.insertedId.toString(),
          ...beneficiary,
          _id: result.insertedId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du bénéficiaire:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
