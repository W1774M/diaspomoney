import { auth } from "@/app/api/auth/[...nextauth]/route";
import { mongoClient } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      phone,
      countryOfResidence,
      targetCountry,
      targetCity,
      monthlyBudget,
    } = body;

    const client = await mongoClient;
    const db = client.db();
    const users = db.collection("users");

    const updateData: any = {
      lastUpdated: new Date(),
    };

    if (phone) updateData.phone = phone;
    if (countryOfResidence) updateData.countryOfResidence = countryOfResidence;
    if (targetCountry) updateData.targetCountry = targetCountry;
    if (targetCity) updateData.targetCity = targetCity;
    if (monthlyBudget) updateData.monthlyBudget = monthlyBudget;

    const result = await users.updateOne(
      { email: session.user.email.toLowerCase() },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur mise à jour profil:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
