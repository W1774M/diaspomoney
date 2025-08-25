import { connectDatabase } from "@/config/database";
import Provider from "@/models/Provider";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await connectDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const group = searchParams.get("group"); // Nouveau paramètre pour le groupe
    const specialty = searchParams.get("specialty");
    const service = searchParams.get("service");
    const country = searchParams.get("country");
    const city = searchParams.get("city");
    const priceMax = searchParams.get("priceMax");
    const recommended = searchParams.get("recommended");
    const sortBy = searchParams.get("sortBy") || "recommended";

    // Construire le filtre
    const filter: Record<string, unknown> = {};

    if (type) {
      const typeIds = type.split(",");
      // Convertir les IDs en nombres pour correspondre au type dans la base
      const numericTypeIds = typeIds
        .map((id) => parseInt(id))
        .filter((id) => !isNaN(id));
      filter["type.id"] = { $in: numericTypeIds };
    }

    if (group) {
      filter["type.group"] = group;
    }

    if (specialty) {
      filter.specialty = specialty;
    }

    if (service) {
      filter["services.name"] = { $regex: service, $options: "i" };
    }

    if (country || city) {
      const locationFilter = country || city;
      filter["apiGeo.display_name"] = {
        $regex: locationFilter,
        $options: "i",
      };
    }

    if (priceMax) {
      filter["services.price"] = { $lte: parseInt(priceMax) };
    }

    if (recommended === "true") {
      filter.recommended = true;
    }

    // Construire le tri
    let sort: Record<string, 1 | -1> = {};
    switch (sortBy) {
      case "rating":
        sort = { rating: -1 };
        break;
      case "price_asc":
        sort = { "services.price": 1 };
        break;
      case "price_desc":
        sort = { "services.price": -1 };
        break;
      case "recommended":
      default:
        sort = { recommended: -1, rating: -1 };
        break;
    }

    const providers = await Provider.find(filter).sort(sort);

    return NextResponse.json({
      success: true,
      data: providers,
      count: providers.length,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des prestataires:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des prestataires",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDatabase();

    const body = await request.json();
    const provider = new Provider(body);
    await provider.save();

    return NextResponse.json(
      {
        success: true,
        data: provider,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création du prestataire:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création du prestataire",
      },
      { status: 500 }
    );
  }
}
