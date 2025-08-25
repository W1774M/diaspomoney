import { connectDatabase } from "@/config/database";
import Provider from "@/models/Provider";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;

    // Essayer de trouver le prestataire avec l'ID comme string ou number
    const numericId = parseInt(id);
    const provider = await Provider.findOne({
      $or: [{ id: id }, { id: numericId }],
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "Prestataire non trouvé",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du prestataire:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du prestataire",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;

    const body = await request.json();
    const numericId = parseInt(id);
    const provider = await Provider.findOneAndUpdate(
      { $or: [{ id: id }, { id: numericId }] },
      body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "Prestataire non trouvé",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: provider,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du prestataire:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour du prestataire",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDatabase();
    const { id } = await params;

    const numericId = parseInt(id);
    const provider = await Provider.findOneAndDelete({
      $or: [{ id: id }, { id: numericId }],
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "Prestataire non trouvé",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Prestataire supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du prestataire:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la suppression du prestataire",
      },
      { status: 500 }
    );
  }
}
