import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      phone,
      countryOfResidence,
      targetCountry,
      targetCity,
      monthlyBudget,
    } = body;

    // Pour l'instant, simuler une mise à jour réussie
    console.log('Profil complété:', {
      phone,
      countryOfResidence,
      targetCountry,
      targetCity,
      monthlyBudget,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
