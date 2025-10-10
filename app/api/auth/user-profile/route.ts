import { auth } from "@/app/api/auth/[...nextauth]/route";
import { mongoClient } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const client = await mongoClient;
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne(
      { email: session.user.email.toLowerCase() },
      {
        projection: {
          password: 0,
          securityAnswer: 0,
          emailVerificationToken: 0,
          emailVerificationExpires: 0,
        },
      }
    );

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur récupération profil:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
