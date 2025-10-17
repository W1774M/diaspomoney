/**
 * API Route - BTP Quote
 * Endpoint pour les demandes de devis BTP
 */

import { NextRequest, NextResponse } from 'next/server';
import { btpService } from '@/services/btp/btp.service';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      projectType, 
      area, 
      features, 
      budget, 
      timeline, 
      location, 
      contact, 
      description, 
      urgency 
    } = body;

    // Validation des entrées
    if (!projectType || !area || !contact.name || !contact.email) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Calculer l'estimation
    const costEstimate = await btpService.calculateProjectCost(
      projectType,
      area,
      features || []
    );

    // Créer la demande de devis
    const quoteRequest = {
      id: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      projectType,
      area,
      features: features || [],
      budget,
      timeline,
      location,
      contact,
      description,
      urgency,
      costEstimate,
      status: 'PENDING',
      createdAt: new Date()
    };

    // TODO: Sauvegarder en base de données
    // await QuoteRequest.create(quoteRequest);

    // Envoyer une notification
    // await notificationService.sendQuoteRequestNotification(quoteRequest);

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'btp_quote_requests',
      value: 1,
      timestamp: new Date(),
      labels: {
        project_type: projectType,
        urgency: urgency || 'MEDIUM',
        has_budget: budget ? 'true' : 'false'
      },
      type: 'counter'
    });

    return NextResponse.json({
      success: true,
      quoteRequest,
      costEstimate,
      message: 'Demande de devis envoyée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur BTP quote API:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Erreur de traitement de la demande',
        success: false 
      },
      { status: 500 }
    );
  }
}
