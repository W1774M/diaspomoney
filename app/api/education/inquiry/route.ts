/**
 * API Route - Education Inquiry
 * Endpoint pour les demandes de renseignements éducation
 */

import { NextRequest, NextResponse } from 'next/server';
// import { educationService } from '@/services/education/education.service';
import { monitoringManager } from '@/lib/monitoring/advanced-monitoring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      studentType,
      studentInfo,
      academicInfo,
      contact,
      preferences,
      questions,
      schoolId,
    } = body;

    // Validation des entrées
    if (
      !studentInfo.firstName ||
      !studentInfo.lastName ||
      !contact.name ||
      !contact.email
    ) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Créer la demande de renseignements
    const inquiryRequest = {
      id: `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentType,
      studentInfo,
      academicInfo,
      contact,
      preferences,
      questions,
      schoolId,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // TODO: Sauvegarder en base de données
    // await InquiryRequest.create(inquiryRequest);

    // Envoyer une notification
    // await notificationService.sendInquiryRequestNotification(inquiryRequest);

    // Enregistrer les métriques
    monitoringManager.recordMetric({
      name: 'education_inquiry_requests',
      value: 1,
      timestamp: new Date(),
      labels: {
        student_type: studentType,
        academic_level: academicInfo.currentLevel,
        has_school: schoolId ? 'true' : 'false',
      },
      type: 'counter',
    });

    return NextResponse.json(
      {
        success: true,
        inquiryRequest,
        message: 'Demande de renseignements envoyée avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur Education inquiry API:', error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erreur de traitement de la demande',
        success: false,
      },
      { status: 500 }
    );
  }
}
