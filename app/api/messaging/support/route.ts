/**
 * API Route pour le chat de support
 * Implémente les design patterns :
 * - Service Layer Pattern (via messagingService)
 * - Dependency Injection (via messagingService singleton)
 * - Logger Pattern (structured logging avec childLogger)
 * - Middleware Pattern (authentification)
 */

import { auth } from '@/auth';
import { childLogger } from '@/lib/logger';
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

  try {
    const session = await auth();
    if (!session?.user?.id) {
      log.warn({ msg: 'Unauthorized access attempt' });
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const { text, attachments } = await request.json();

    log.debug(
      { userId, hasText: !!text, attachmentCount: attachments?.length || 0 },
      'Sending support message',
    );

    // Permettre l'envoi de messages avec uniquement des attachments
    if (!text && (!attachments || attachments.length === 0)) {
      log.warn({ userId }, 'Message rejected: no text or attachments');
      return NextResponse.json(
        { error: 'Texte du message ou pièce jointe requis' },
        { status: 400 },
      );
    }

    // Utiliser le service pour envoyer le message
    const message = await messagingService.sendSupportMessage(
      userId,
      text || '',
      attachments,
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
  } catch (error) {
    log.error(
      { error, msg: 'Error sending support message' },
      'Error sending support message',
    );
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 },
    );
  }
}
