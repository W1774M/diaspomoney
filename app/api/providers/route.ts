import { MOCK_USERS } from "@/mocks";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    // Filtrer seulement les utilisateurs avec le rôle PROVIDER
    const providers = MOCK_USERS.filter(user =>
      user.roles.includes("PROVIDER")
    );

    return NextResponse.json({
      success: true,
      providers: providers,
      total: providers.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des prestataires:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const providerData = await request.json();

    // Validation des données
    if (!providerData.userId || !providerData.specialities) {
      return NextResponse.json(
        { error: "Données de prestataire incomplètes" },
        { status: 400 }
      );
    }

    // Création d'un nouveau prestataire
    const newProvider = {
      id: `provider_${Date.now()}`,
      ...providerData,
      status: "PENDING",
      createdAt: new Date(),
    };

    // Simulation de l'ajout à la base de données
    console.log("Nouveau prestataire créé:", newProvider);

    return NextResponse.json({
      success: true,
      provider: newProvider,
      message: "Prestataire créé avec succès"
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur lors de la création du prestataire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
