/**
 * API Route pour les réclamations
 * Implémente les design patterns :
 * - Service Layer Pattern (via complaintService)
 * - Repository Pattern (via complaintService qui utilise les repositories)
 * - Dependency Injection (via complaintService singleton)
 * - Logger Pattern (structured logging avec childLogger + @Log decorator dans le service)
 * - Middleware Pattern (authentification)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache dans complaintService)
 * - Singleton Pattern (complaintService)
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
import { complaintService } from '@/services/complaint/complaint.service';
import { ComplaintServiceFilters } from '@/types/complaints';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/complaints - Récupérer les réclamations
 */
export async function GET(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/complaints',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const provider = searchParams.get('provider');
    const appointmentId = searchParams.get('appointmentId');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Par défaut, récupérer les réclamations de l'utilisateur connecté
    const filters = {
      userId: userId || session.user.id,
      provider: provider || undefined,
      appointmentId: appointmentId || undefined,
      type: type || undefined,
      priority: priority || undefined,
      status: status || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };

    log.debug({ userId: session.user.id, filters }, 'Fetching complaints');

    // Utiliser le service avec décorateurs (@Log, @Cacheable)
    const result = await complaintService.getComplaints(
      filters as ComplaintServiceFilters
    );

    log.info(
      {
        userId: session.user.id,
        total: result.total,
        count: result.data.length,
      },
      'Complaints fetched successfully'
    );

    return NextResponse.json({
      success: true,
      complaints: result.data,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching complaints' },
      'Error fetching complaints'
    );
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des réclamations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/complaints - Créer une nouvelle réclamation
 */
export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({
    requestId: reqId,
    route: 'api/complaints',
  });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { title, type, priority, description, provider, appointmentId } =
      body;

    log.debug(
      {
        userId: session.user.id,
        title,
        type,
        priority,
      },
      'Creating complaint'
    );

    // Validation
    if (
      !title ||
      !type ||
      !priority ||
      !description ||
      !provider ||
      !appointmentId
    ) {
      log.warn({ body }, 'Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Utiliser le service avec décorateurs (@Log, @InvalidateCache)
    const complaint = await complaintService.createComplaint({
      title,
      type,
      priority,
      description,
      provider,
      appointmentId,
      userId: session.user.id,
    });

    log.info(
      {
        userId: session.user.id,
        complaintId: complaint.id,
        number: complaint.number,
      },
      'Complaint created successfully'
    );

    return NextResponse.json(
      {
        success: true,
        complaint,
        message: 'Réclamation créée avec succès',
      },
      { status: 201 }
    );
  } catch (error) {
    log.error(
      { error, msg: 'Error creating complaint' },
      'Error creating complaint'
    );
    return NextResponse.json(
      { error: 'Erreur lors de la création de la réclamation' },
      { status: 500 }
    );
  }
}
