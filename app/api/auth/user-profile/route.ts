import { NextResponse } from 'next/server';
import { LANGUAGES, TIMEZONES, USER_STATUSES, ROLES, HTTP_STATUS_CODES } from '@/lib/constants';

// Cache simple pour éviter les appels répétés
let lastCall = 0;
const CACHE_DURATION = 1000; // 1 seconde

export async function GET() {
  try {
    const now = Date.now();

    // Si l'appel est trop récent, retourner une réponse vide
    if (now - lastCall < CACHE_DURATION) {
      return NextResponse.json({ cached: true });
    }

    lastCall = now;

    // Retourner un profil utilisateur qui correspond au modèle User
    return NextResponse.json({
      _id: 'test-user-id',
      email: 'test@diaspomoney.com',
      name: 'Test User',
      firstName: 'Test',
      lastName: 'User',
      phone: '+33123456789',
      company: 'DiaspoMoney Test',
      address: '123 Test Street, Paris, France',
      status: USER_STATUSES.ACTIVE,
      roles: [ROLES.CUSTOMER],
      specialty: 'Test Specialty',
      recommended: true,
      providerInfo: {
        type: 'INDIVIDUAL',
        category: 'HEALTH',
        specialties: ['Test Specialty'],
        description: 'Test provider description',
        rating: 4.5,
        reviewCount: 10,
        isVerified: true,
      },
      oauth: {
        google: { linked: true, providerAccountId: 'google-123' },
        facebook: { linked: false },
      },
      preferences: {
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
        language: LANGUAGES.FR.code,
        timezone: TIMEZONES.PARIS,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erreur récupération profil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR });
  }
}
