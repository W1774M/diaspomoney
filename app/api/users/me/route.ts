import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { mongoClient } from "@/lib/mongodb";

export async function GET(_request: NextRequest) {
  try {
    console.log("[API][users/me] called"); // Ajout du log
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const client = await mongoClient;
    const db = client.db();
    const users = db.collection("users");

    const user = await users.findOne({
      email: session.user.email.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    // Normaliser la réponse
    const result = {
      id: String(user._id),
      email: user["email"],
      name:
        user["name"] ||
        `${user["firstName"] ?? ""} ${user["lastName"] ?? ""}`.trim(),
      roles: user["roles"] ?? ["CUSTOMER"],
      status: user["status"] ?? "ACTIVE",
      avatar: user["avatar"] ?? {
        image: user["image"] ?? "",
        name: user["name"] ?? "",
      },
      oauth: user["oauth"] ?? {},
    };

    return NextResponse.json({ user: result });
  } catch (error) {
    console.error("[USER][me] erreur:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
