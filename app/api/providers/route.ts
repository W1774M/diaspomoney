import { userService } from '@/services/user/user.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Récupérer les paramètres de filtrage et pagination
    const role = searchParams.get('role') || 'PROVIDER';
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const specialty = searchParams.get('specialty');
    const service = searchParams.get('service');
    const minRating = searchParams.get('minRating');

    // Construire les filtres
    const filters: any = {
      role: role, // 'PROVIDER'
      limit,
      offset,
    };

    if (status) {
      filters.status = status;
    }

    console.log('API Providers - Filters:', filters); // Debug

    // Récupérer les prestataires avec filtres
    const result = await userService.getUsers(filters);

    // Appliquer les filtres supplémentaires côté serveur si nécessaire
    let filteredProviders = result?.data || [];

    // Filtrage par catégorie (si les prestataires ont une propriété category)
    if (category) {
      filteredProviders = filteredProviders.filter((provider: any) => {
        if (!provider) return false;

        if (provider.category) {
          return provider.category === category;
        }
        // Fallback: filtrer par spécialités si pas de catégorie
        if (provider.specialties && Array.isArray(provider.specialties)) {
          const categoryMapping: { [key: string]: string[] } = {
            HEALTH: ['Médecine', 'Dentisterie', 'Pharmacie', 'Soins'],
            EDU: ['Éducation', 'Formation', 'Cours', 'Tutorat'],
            IMMO: ['Immobilier', 'Location', 'Achat', 'Vente'],
          };
          const categorySpecialties = categoryMapping[category] || [];
          return provider.specialties.some((spec: string) =>
            categorySpecialties.some(catSpec =>
              spec.toLowerCase().includes(catSpec.toLowerCase())
            )
          );
        }
        return true;
      });
    }

    // Filtrage par ville
    if (city) {
      filteredProviders = filteredProviders.filter(
        (provider: any) =>
          provider &&
          provider.city &&
          provider.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    // Filtrage par spécialité
    if (specialty) {
      filteredProviders = filteredProviders.filter(
        (provider: any) =>
          provider &&
          provider.specialties &&
          Array.isArray(provider.specialties) &&
          provider.specialties.some((spec: string) =>
            spec.toLowerCase().includes(specialty.toLowerCase())
          )
      );
    }

    // Filtrage par service
    if (service) {
      filteredProviders = filteredProviders.filter(
        (provider: any) =>
          provider &&
          provider.services &&
          Array.isArray(provider.services) &&
          provider.services.some((serv: string) =>
            serv.toLowerCase().includes(service.toLowerCase())
          )
      );
    }

    // Filtrage par note minimale
    if (minRating) {
      const rating = parseFloat(minRating);
      filteredProviders = filteredProviders.filter(
        (provider: any) =>
          provider && provider.rating && provider.rating >= rating
      );
    }

    return NextResponse.json({
      success: true,
      providers: filteredProviders,
      total: filteredProviders.length,
      limit,
      offset,
      hasResults: filteredProviders.length > 0,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des prestataires:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
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
        { error: 'Données de prestataire incomplètes' },
        { status: 400 }
      );
    }

    // Création d'un nouveau prestataire
    const newProvider = {
      id: `provider_${Date.now()}`,
      ...providerData,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Simulation de l'ajout à la base de données
    console.log('Nouveau prestataire créé:', newProvider);

    return NextResponse.json(
      {
        success: true,
        provider: newProvider,
        message: 'Prestataire créé avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur lors de la création du prestataire:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
