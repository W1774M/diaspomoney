import { auth } from '@/auth';
import { getMongoClient } from '@/lib/database/mongodb';
import { getUserRepository } from '@/repositories';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Récupérer l'utilisateur authentifié via NextAuth
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Utiliser UserRepository (Repository Pattern)
    const userRepository = getUserRepository();
    const userDoc = await userRepository.findByEmail(session.user.email);

    if (!userDoc) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Fonction helper pour convertir une date en ISO string
    const toISOString = (date: any): string => {
      if (!date) return new Date().toISOString();
      if (typeof date === 'string') return date;
      if (date instanceof Date) return date.toISOString();
      // Si c'est un objet avec toISOString
      if (typeof date.toISOString === 'function') return date.toISOString();
      // Sinon, essayer de créer une Date
      try {
        return new Date(date).toISOString();
      } catch {
        return new Date().toISOString();
      }
    };

    // Retourner l'utilisateur de la base de données
    // Le repository retourne déjà un objet User formaté
    return NextResponse.json({
      user: {
        id: userDoc.id || userDoc._id?.toString() || '',
        email: userDoc.email,
        name:
          userDoc.name ||
          `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim(),
        firstName: userDoc.firstName || '',
        lastName: userDoc.lastName || '',
        phone: userDoc.phone || '',
        company: (userDoc as any)['company'] || '',
        address: (userDoc as any)['address'] || '',
        roles: userDoc.roles || ['CUSTOMER'],
        status: userDoc.status || 'ACTIVE',
        avatar:
          typeof (userDoc as any)['avatar'] === 'string'
            ? (userDoc as any)['avatar']
            : (userDoc as any)['avatar']?.image ||
              (userDoc as any)['avatar'] || {
                image: '',
                name: userDoc.name || '',
              },
        oauth: (userDoc as any)['oauth'] || {
          google: { linked: false },
          facebook: { linked: false },
        },
        specialty: (userDoc as any)['specialty'] || '',
        recommended: (userDoc as any)['recommended'] || false,
        providerInfo: (userDoc as any)['providerInfo'] || {},
        preferences: (userDoc as any)['preferences'] || {
          language: 'fr',
          timezone: 'Europe/Paris',
          notifications: true,
        },
        dateOfBirth: (userDoc as any)['dateOfBirth']
          ? toISOString((userDoc as any)['dateOfBirth'])
          : null,
        countryOfResidence: (userDoc as any)['countryOfResidence'] || '',
        targetCountry: (userDoc as any)['targetCountry'] || '',
        targetCity: (userDoc as any)['targetCity'] || '',
        monthlyBudget: (userDoc as any)['monthlyBudget'] || '',
        marketingConsent: (userDoc as any)['marketingConsent'] || false,
        kycConsent: (userDoc as any)['kycConsent'] || false,
        createdAt: toISOString(userDoc.createdAt),
        updatedAt: toISOString((userDoc as any)['updatedAt']),
      },
    });
  } catch (error) {
    console.error('[USER][me] erreur:', error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}

// PUT /api/users/me - Mettre à jour le profil utilisateur
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      firstName,
      lastName,
      phone,
      company,
      address,
      dateOfBirth,
      countryOfResidence,
      targetCountry,
      targetCity,
      monthlyBudget,
      preferences,
      marketingConsent,
      kycConsent,
      providerInfo,
      specialty,
    } = body;

    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection('users');

    const email = session.user.email.toLowerCase();

    // Construire l'objet de mise à jour
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (firstName !== undefined) updateData.firstName = firstName.trim();
    if (lastName !== undefined) updateData.lastName = lastName.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (company !== undefined) updateData.company = company?.trim() || null;
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (dateOfBirth !== undefined)
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    if (countryOfResidence !== undefined)
      updateData.countryOfResidence = countryOfResidence?.trim() || null;
    if (targetCountry !== undefined)
      updateData.targetCountry = targetCountry?.trim() || null;
    if (targetCity !== undefined)
      updateData.targetCity = targetCity?.trim() || null;
    if (monthlyBudget !== undefined)
      updateData.monthlyBudget = monthlyBudget?.trim() || null;
    if (marketingConsent !== undefined)
      updateData.marketingConsent = marketingConsent === true;
    if (kycConsent !== undefined) updateData.kycConsent = kycConsent === true;
    if (specialty !== undefined)
      updateData.specialty = specialty?.trim() || null;

    // Mettre à jour les préférences
    if (preferences) {
      updateData.preferences = {
        language: preferences.language || 'fr',
        timezone: preferences.timezone || 'Europe/Paris',
        notifications: preferences.notifications !== false,
      };
    }

    // Mettre à jour les informations de prestataire
    if (providerInfo) {
      updateData.providerInfo = providerInfo;
    }

    const result = await users.updateOne({ email }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Récupérer l'utilisateur mis à jour
    const updatedUser = await users.findOne({ email });

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: updatedUser,
    });
  } catch (error) {
    console.error('[USER][me][PUT] erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}
