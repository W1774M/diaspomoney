/**
 * API Route - Beneficiary by ID
 * Endpoints pour modifier et supprimer un bénéficiaire spécifique
 */

import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../auth/[...nextauth]/route';

// PUT /api/beneficiaries/[id] - Modifier un bénéficiaire
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const beneficiaryId = params.id;
    if (!ObjectId.isValid(beneficiaryId)) {
      return NextResponse.json(
        { error: 'ID de bénéficiaire invalide' },
        { status: 400 }
      );
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

    // Vérifier que le bénéficiaire appartient à l'utilisateur
    const existingBeneficiary = await db.collection('beneficiaries').findOne({
      _id: new ObjectId(beneficiaryId),
      userId: new ObjectId(userId),
    });

    if (!existingBeneficiary) {
      return NextResponse.json(
        { error: 'Bénéficiaire non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si un autre bénéficiaire avec le même email existe déjà pour cet utilisateur
    if (email) {
      const duplicateBeneficiary = await db
        .collection('beneficiaries')
        .findOne({
          userId: new ObjectId(userId),
          email: email.toLowerCase(),
          _id: { $ne: new ObjectId(beneficiaryId) },
        });

      if (duplicateBeneficiary) {
        return NextResponse.json(
          { error: 'Un autre bénéficiaire avec cet email existe déjà' },
          { status: 409 }
        );
      }
    }

    // Mettre à jour le bénéficiaire
    const updateData = {
      name: name.trim(),
      email: email?.toLowerCase().trim() || null,
      phone: phone?.trim() || null,
      relationship: relationship.trim(),
      updatedAt: new Date(),
    };

    const result = await db
      .collection('beneficiaries')
      .updateOne(
        { _id: new ObjectId(beneficiaryId), userId: new ObjectId(userId) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Bénéficiaire non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer le bénéficiaire mis à jour
    const updatedBeneficiary = await db.collection('beneficiaries').findOne({
      _id: new ObjectId(beneficiaryId),
    });

    return NextResponse.json(
      {
        beneficiary: {
          id: updatedBeneficiary?._id.toString(),
          ...updatedBeneficiary,
          _id: updatedBeneficiary?._id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour du bénéficiaire:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/beneficiaries/[id] - Supprimer un bénéficiaire
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const beneficiaryId = params.id;
    if (!ObjectId.isValid(beneficiaryId)) {
      return NextResponse.json(
        { error: 'ID de bénéficiaire invalide' },
        { status: 400 }
      );
    }

    const db = await getDatabase();

    // Vérifier que le bénéficiaire appartient à l'utilisateur
    const existingBeneficiary = await db.collection('beneficiaries').findOne({
      _id: new ObjectId(beneficiaryId),
      userId: new ObjectId(userId),
    });

    if (!existingBeneficiary) {
      return NextResponse.json(
        { error: 'Bénéficiaire non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le bénéficiaire
    const result = await db.collection('beneficiaries').deleteOne({
      _id: new ObjectId(beneficiaryId),
      userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Bénéficiaire non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Bénéficiaire supprimé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur lors de la suppression du bénéficiaire:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
