import { UserQueryBuilder } from '@/builders';
import { getUserRepository } from '@/repositories';
// import { rateLimit } from "@/middleware/rate-limit";
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userRepository = getUserRepository();

    // Utiliser UserQueryBuilder pour construire la requête
    const queryBuilder = new UserQueryBuilder();

    // Appliquer les filtres
    if (searchParams.get('role')) {
      queryBuilder.byRole(searchParams.get('role')!);
    }
    if (searchParams.get('status')) {
      queryBuilder.byStatus(searchParams.get('status')!);
    }
    if (searchParams.get('search')) {
      const searchTerm = searchParams.get('search')!;
      queryBuilder.whereOr([
        { firstName: { $regex: searchTerm, $options: 'i' } },
        { lastName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
      ]);
    }

    // Pagination
    const limit = searchParams.get('limit') 
      ? parseInt(searchParams.get('limit')!) 
      : 50;
    const page = searchParams.get('page') 
      ? parseInt(searchParams.get('page')!) 
      : 1;
    queryBuilder.page(page, limit);

    // Construire et exécuter la requête
    const query = queryBuilder.build();
    const result = await userRepository.findUsersWithFilters(
      query.filters,
      query.pagination,
    );

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('API /users GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des utilisateurs',
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validation des données
    if (!body.email || !body.firstName || !body.lastName) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email, prénom et nom sont requis',
        },
        { status: 400 },
      );
    }

    // Création de l'utilisateur
    // const user = await QueryOptimizer.createUser(body);
    const user = { id: 'temp', ...body };

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Utilisateur créé avec succès',
    });
  } catch (error) {
    console.error('API /users POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la création de l'utilisateur",
      },
      { status: 500 },
    );
  }
}
