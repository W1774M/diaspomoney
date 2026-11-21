/**
;

 * API Route pour les réclamations
 * Implémente les design patterns :
 * - Service Layer Pattern (via complaintService)
 * - Repository Pattern (via complaintService qui utilise les repositories)
 * - Dependency Injection (via complaintService singleton)
 * - Logger Pattern (structured logging avec childLogger + @Log decorator dans le service)
 * - Middleware Pattern (authentification)
 * - Decorator Pattern (@Log, @Cacheable, @InvalidateCache dans complaintService)
 * - Singleton Pattern (complaintService)
 * - Builder Pattern (via ComplaintQueryBuilder)
 * - Facade Pattern (via ComplaintFacade pour orchestrer la création complète)
 */

import { auth } from '@/auth';
import { ComplaintQueryBuilder } from '@/builders';
import type { ComplaintType, ComplaintPriority, ComplaintStatus } from '@/lib/types';
import { complaintFacade } from '@/facades';
import { handleApiRoute, ApiErrors, ApiError, validateBody } from '@/lib/api/error-handler';
import { createPaginatedResponse, createResourceResponse } from '@/lib/api/response';
import { CreateComplaintSchema } from '@/lib/validations/complaint.schema';
import { getComplaintRepository } from '@/repositories';
import { complaintService } from '@/services/complaint/complaint.service';
import { NextRequest } from 'next/server';
import { DATABASE, ROLES } from '@/lib/constants';
import { getMongoClient } from '@/lib/database/mongodb';
import { ObjectId } from 'mongodb';
/**
 * GET /api/complaints - Récupérer les réclamations
 */
export async function GET(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }
    const userRoles = session.user.roles || [];
    const isCSM = userRoles.includes(ROLES.CSM);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const provider = searchParams.get('provider');
    const appointmentId = searchParams.get('appointmentId');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    // Utiliser ComplaintQueryBuilder pour construire la requête (Builder Pattern)
    const queryBuilder = new ComplaintQueryBuilder();

    if (isCSM) {
      // CSM: ne voit que les réclamations liées aux providers de son portefeuille
      const client = await getMongoClient();
      const db = client.db();
      const users = db.collection(DATABASE.COLLECTIONS.USERS);
      const csm = await users.findOne(
        { _id: new ObjectId(session.user.id) },
        { projection: { csmPortfolioProviderIds: 1 } },
      );
      const ids = (csm?.['csmPortfolioProviderIds'] as string[] | undefined) || [];
      if (ids.length === 0) {
        return createPaginatedResponse([], { page: 1, limit: 50, total: 0 });
      }

      // Si un provider est demandé, il doit être dans le portefeuille
      if (provider && !ids.includes(provider)) {
        return createPaginatedResponse([], { page: 1, limit: 50, total: 0 });
      }

      queryBuilder.whereIn('provider', provider ? [provider] : ids);
    } else {
      // Par défaut, récupérer les réclamations de l'utilisateur connecté
      const targetUserId = userId || session.user.id;
      queryBuilder.byUser(targetUserId);
    }

    // Appliquer les filtres (provider déjà géré pour CSM via whereIn)
    if (provider && !isCSM) {
      queryBuilder.byProvider(provider);
    }
    if (appointmentId) {
      queryBuilder.byAppointment(appointmentId);
    }
    if (type) {
      // Mapper ComplaintType vers le format attendu par ComplaintQueryBuilder
      const typeMap: Record<ComplaintType, 'SERVICE_QUALITY' | 'BILLING' | 'CANCELLATION' | 'OTHER'> = {
        QUALITY: 'SERVICE_QUALITY',
        DELAY: 'OTHER',
        BILLING: 'BILLING',
        COMMUNICATION: 'OTHER',
      };
      const complaintType = type.toUpperCase() as ComplaintType;
      const mappedType = typeMap[complaintType] || 'OTHER';
      queryBuilder.byType(mappedType);
    }
    if (priority) {
      // Mapper ComplaintPriority vers le format attendu (minuscules)
      const priorityMap: Record<ComplaintPriority, 'low' | 'medium' | 'high'> = {
        HIGH: 'high',
        MEDIUM: 'medium',
        LOW: 'low',
      };
      const complaintPriority = priority.toUpperCase() as ComplaintPriority;
      const mappedPriority = priorityMap[complaintPriority] || 'medium';
      queryBuilder.byPriority(mappedPriority);
    }
    if (status) {
      queryBuilder.byStatus(status as ComplaintStatus);
    }

    // Pagination
    const pageLimit = limit ? parseInt(limit) : 50;
    const pageOffset = offset ? parseInt(offset) : 0;
    const page = Math.floor(pageOffset / pageLimit) + 1;
    queryBuilder.page(page, pageLimit);

    // Trier par date de création (plus récentes en premier)
    queryBuilder.orderByCreatedAt('desc');

    // Construire la requête
    const query = queryBuilder.build();

    // Utiliser le repository avec les filtres du builder
    const complaintRepository = getComplaintRepository();
    const paginationLimit = query.pagination.limit ?? 50;
    const paginationPage = query.pagination.page ?? 1;

    const result = await complaintRepository.findComplaintsWithFilters(
      query.filters,
      {
        limit: paginationLimit,
        page: paginationPage,
        offset: (paginationPage - 1) * paginationLimit,
        sort: query.sort,
      },
    );

    return createPaginatedResponse(
      result.data,
      {
        page: paginationPage,
        limit: paginationLimit,
        total: result.total,
      },
    );
  }, 'api/complaints');
}

/**
 * POST /api/complaints - Créer une nouvelle réclamation
 * 
 * Implémente les design patterns :
 * - Service Layer Pattern (via complaintService)
 * - Repository Pattern (via complaintService qui utilise les repositories)
 * - Error Handling Pattern (via handleApiRoute)
 * - Validation Pattern (via CreateComplaintSchema)
 * - Facade Pattern (via ComplaintFacade pour orchestrer la création complète)
 */
export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      throw ApiErrors.UNAUTHORIZED;
    }

    // Validation avec Zod
    const body = await request.json();
    const data = validateBody(body, CreateComplaintSchema);

    // Utiliser ComplaintFacade pour orchestrer la création complète (Facade Pattern)
    // La facade gère : création de réclamation + notifications utilisateur/provider + emails
    const complaintData = {
      ...data,
      userId: session.user.id,
      sendNotification: data.sendNotification ?? true, // Par défaut, envoyer la notification
      notifyProvider: data.notifyProvider ?? true, // Par défaut, notifier le provider
      sendEmail: data.sendEmail ?? true, // Par défaut, envoyer l'email
      ...(data.recipientEmail ? { recipientEmail: data.recipientEmail } : {}),
    } as Parameters<typeof complaintFacade.createComplaint>[0];
    
    const result = await complaintFacade.createComplaint(complaintData);

    if (!result.success || !result.complaintId) {
      throw new ApiError(400, result.error || 'Erreur lors de la création de la réclamation');
    }

    // Récupérer la réclamation complète pour la réponse
    const complaint = await complaintService.getComplaintById(result.complaintId);
    if (!complaint) {
      throw ApiErrors.NOT_FOUND;
    }

    return createResourceResponse(
      complaint,
      {
        message: 'Réclamation créée avec succès',
        metadata: {
          notificationSent: result.notificationSent ?? false,
          emailSent: result.emailSent ?? false,
        },
      },
    );
  }, 'api/complaints');
}
