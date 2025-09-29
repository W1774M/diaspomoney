import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { mongoClient } from "@/lib/mongodb";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { provider } = await request.json();
    if (!provider || !["google", "facebook"].includes(provider)) {
      return NextResponse.json({ error: "Provider invalide" }, { status: 400 });
    }

    const client = await mongoClient;
    const db = client.db();
    const users = db.collection("users");

    const email = session.user.email.toLowerCase();
    const update = {
      $set: { [`oauth.${provider}.linked`]: false },
      $unset: { [`oauth.${provider}.providerAccountId`]: "" },
    } as any;

    const result = await users.updateOne({ email }, update);
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[USER][oauth.unlink] erreur:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}


