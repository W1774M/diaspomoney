import connectToDatabase from "@/lib/mongodb";
import { ObjectId } from "mongodb";
// import getServerSession from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth/[...nextauth]/route";

// GET /api/beneficiaries/[id] - Récupérer un bénéficiaire spécifique
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const beneficiary = await db.collection("beneficiaries").findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(userId),
    });

    if (!beneficiary) {
      return NextResponse.json(
        { error: "Bénéficiaire non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ beneficiary });
  } catch (error) {
    console.error("Erreur lors de la récupération du bénéficiaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/beneficiaries/[id] - Mettre à jour un bénéficiaire
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, relationship } = body;

    // Validation
    if (!name || !relationship) {
      return NextResponse.json(
        { error: "Le nom et la relation sont obligatoires" },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Vérifier que le bénéficiaire existe et appartient à l'utilisateur
    const existingBeneficiary = await db.collection("beneficiaries").findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(userId),
    });

    if (!existingBeneficiary) {
      return NextResponse.json(
        { error: "Bénéficiaire non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si un autre bénéficiaire avec le même email existe déjà
    if (email && email !== existingBeneficiary.email) {
      const duplicateBeneficiary = await db
        .collection("beneficiaries")
        .findOne({
          userId: new ObjectId(userId),
          email: email.toLowerCase(),
          _id: { $ne: new ObjectId(params.id) },
        });

      if (duplicateBeneficiary) {
        return NextResponse.json(
          { error: "Un bénéficiaire avec cet email existe déjà" },
          { status: 409 }
        );
      }
    }

    const updateData = {
      name: name.trim(),
      email: email?.toLowerCase().trim() || null,
      phone: phone?.trim() || null,
      relationship: relationship.trim(),
      updatedAt: new Date(),
    };

    const result = await db.collection("beneficiaries").updateOne(
      {
        _id: new ObjectId(params.id),
        userId: new ObjectId(userId),
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Bénéficiaire non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer le bénéficiaire mis à jour
    const updatedBeneficiary = await db
      .collection("beneficiaries")
      .findOne({ _id: new ObjectId(params.id) });

    return NextResponse.json({ beneficiary: updatedBeneficiary });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du bénéficiaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Vérifier que le bénéficiaire existe et appartient à l'utilisateur
    const beneficiary = await db.collection("beneficiaries").findOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(userId),
    });

    if (!beneficiary) {
      return NextResponse.json(
        { error: "Bénéficiaire non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le bénéficiaire
    const result = await db.collection("beneficiaries").deleteOne({
      _id: new ObjectId(params.id),
      userId: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Bénéficiaire supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du bénéficiaire:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
