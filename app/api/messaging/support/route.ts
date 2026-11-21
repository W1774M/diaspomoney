/**
 * API Route pour le chat de support
 * Implémente les design patterns :
 * - Service Layer Pattern (via messagingService)
 * - Dependency Injection (via messagingService singleton)
 * - Logger Pattern (structured logging avec childLogger)
 * - Middleware Pattern (authentification)
 */

import { auth } from '@/auth';
import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { childLogger } from '@/lib/logger';
import { CreateSupportMessageSchema, type CreateSupportMessageInput } from '@/lib/validations/message.schema';
import dbConnect from '@/lib/mongodb';
import { messagingService } from '@/services/messaging/messaging.service';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  const reqId = _request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/messaging/support' });

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // S'assurer que MongoDB est connecté avant d'utiliser les modèles
    await dbConnect();

    const userId = session.user.id;
    log.debug({ userId }, 'Fetching support ticket');

    // Utiliser le service pour récupérer le ticket et les messages
    const result = await messagingService.getSupportTicket(userId);

    log.info(
      {
        userId,
        ticketId: result.ticket.id,
        messageCount: result.messages.length,
      },
      'Support ticket fetched successfully',
    );

    return NextResponse.json({
      success: true,
      ticket: result.ticket,
      messages: result.messages.map(msg => ({
        id: msg.id,
        text: msg.text,
        sender: msg.senderId === 'user' ? 'user' : 'support',
        timestamp: msg.timestamp,
        attachments: msg.attachments || [],
      })),
    });
  } catch (error) {
    log.error(
      { error, msg: 'Error fetching support chat' },
      'Error fetching support chat',
    );
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du chat support' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const reqId = request.headers.get('x-request-id') || undefined;
  const log = childLogger({ requestId: reqId, route: 'api/messaging/support' });

  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Validation avec Zod
    const body = await request.json();
    const data: CreateSupportMessageInput = validateBody(body, CreateSupportMessageSchema);

    log.debug(
      { userId, hasText: !!data.text, attachmentCount: data.attachments?.length || 0 },
      'Sending support message',
    );

    // Utiliser le service pour envoyer le message
    const message = await messagingService.sendSupportMessage(
      userId,
      data.text || '',
      data.attachments,
    );

    log.info(
      {
        userId,
        messageId: message.id,
        hasAttachments: (message.attachments?.length || 0) > 0,
      },
      'Support message sent successfully',
    );

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        text: message.text,
        sender: 'user',
        timestamp: message.timestamp,
        attachments: message.attachments || [],
      },
    });
  }, 'api/messaging/support');
}
