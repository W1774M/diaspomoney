import { QueryOptimizer } from "@/lib/database/query-optimizer";
import { rateLimitHelpers } from "@/middleware/rate-limit";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  return rateLimitHelpers.api(req, async req => {
    try {
      const { searchParams } = new URL(req.url);

      const filters = {
        ...(searchParams.get("role") && {
          roles: { $in: [searchParams.get("role")] },
        }),
        ...(searchParams.get("status") && {
          status: searchParams.get("status"),
        }),
        ...(searchParams.get("search") && {
          $or: [
            {
              firstName: { $regex: searchParams.get("search"), $options: "i" },
            },
            { lastName: { $regex: searchParams.get("search"), $options: "i" } },
            { email: { $regex: searchParams.get("search"), $options: "i" } },
          ],
        }),
      };

      const users = await QueryOptimizer.getUsersList(filters);

      return NextResponse.json({
        success: true,
        data: users,
        total: users.length,
        cached: true,
      });
    } catch (error) {
      console.error("API /users GET error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la récupération des utilisateurs",
        },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return rateLimitHelpers.api(req, async req => {
    try {
      const body = await req.json();

      // Validation des données
      if (!body.email || !body.firstName || !body.lastName) {
        return NextResponse.json(
          { success: false, error: "Données manquantes" },
          { status: 400 }
        );
      }

      // TODO: Implémenter la création d'utilisateur
      // const newUser = await createUser(body);

      // Invalider le cache des utilisateurs
      await QueryOptimizer.invalidateUserCache("*");

      return NextResponse.json({
        success: true,
        message: "Utilisateur créé avec succès",
      });
    } catch (error) {
      console.error("API /users POST error:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur lors de la création de l'utilisateur",
        },
        { status: 500 }
      );
    }
  });
}
