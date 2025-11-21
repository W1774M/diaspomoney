import { auth } from '@/auth';
// Désactiver le prerendering pour cette route API
export const dynamic = 'force-dynamic';

// Désactiver le prerendering pour cette route API
;

import { handleApiRoute, validateBody } from '@/lib/api/error-handler';
import { CreateConversationSchema, type CreateConversationInput } from '@/lib/validations/conversation.schema';
import dbConnect from '@/lib/mongodb';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // S'assurer que MongoDB est connecté avant d'utiliser les modèles
    await dbConnect();

    const userId = session.user.id;

    // Récupérer toutes les conversations où l'utilisateur est participant
    const conversations = await (Conversation as any)
      .find({
        participants: new mongoose.Types.ObjectId(userId),
        type: 'user',
      } as any)
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'name email avatar roles')
      .lean();

    // Transformer les conversations pour l'UI
    const uiConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        // Trouver l'autre participant
        const otherParticipant = conv.participants.find(
          (p: any) => p._id.toString() !== userId,
        );

        if (!otherParticipant) return null;

        // Récupérer le dernier message
        const lastMessage = await (Message as any)
          .findOne({
            conversationId: conv._id,
          })
          .sort({ createdAt: -1 })
          .lean();

        // Compter les messages non lus
        const unreadCountMap = conv.unreadCount || {};
        const unreadCount =
          unreadCountMap[userId] ||
          (await Message.countDocuments({
            conversationId: conv._id,
            senderId: { $ne: new mongoose.Types.ObjectId(userId) },
            read: false,
          }));

        return {
          id: conv._id.toString(),
          participant: {
            id: otherParticipant._id.toString(),
            name: otherParticipant.name || 'Utilisateur',
            avatar: otherParticipant.avatar,
            role: otherParticipant.roles?.[0] || 'USER',
          },
          lastMessage: lastMessage?.text || '',
          lastMessageTime:
            lastMessage?.createdAt || conv.lastMessageAt || new Date(),
          unreadCount: unreadCount || 0,
        };
      }),
    );

    // Filtrer les null
    const filteredConversations = uiConversations.filter(
      (c: any) => c !== null,
    ) as any[];

    return NextResponse.json({
      success: true,
      conversations: filteredConversations,
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des conversations' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return handleApiRoute(request, async () => {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // S'assurer que MongoDB est connecté avant d'utiliser les modèles
    await dbConnect();

    const userId = session.user.id;
    const body = await request.json();
    
    // Validation avec Zod - Pour une conversation user, on accepte participantId ou participants
    let participantId: string;
    if (body.participantId) {
      participantId = body.participantId;
    } else if (body.participants && Array.isArray(body.participants) && body.participants.length >= 2) {
      // Si participants est fourni, prendre le premier qui n'est pas l'utilisateur actuel
      participantId = body.participants.find((p: string) => p !== userId) || body.participants[0];
    } else {
      // Validation avec le schéma complet
      const data: CreateConversationInput = validateBody(body, CreateConversationSchema);
      // Pour une conversation user, prendre le premier participant qui n'est pas l'utilisateur actuel
      const foundParticipant = data.participants.find((p: string) => p !== userId);
      participantId = foundParticipant || data.participants[0] || ''; 
    }

    if (!participantId || participantId.trim() === '') {
      return NextResponse.json(
        { error: 'ID du participant requis' },
        { status: 400 },
      );
    }

    // Vérifier si une conversation existe déjà
    const existingConversation = await (Conversation as any).findOne({
      participants: {
        $all: [
          new mongoose.Types.ObjectId(userId),
          new mongoose.Types.ObjectId(participantId),
        ],
      },
      type: 'user',
    } as any);

    if (existingConversation) {
      return NextResponse.json({
        success: true,
        conversation: {
          id: existingConversation._id.toString(),
        },
      });
    }

    // Créer une nouvelle conversation
    const conversation = new Conversation({
      participants: [
        new mongoose.Types.ObjectId(userId),
        new mongoose.Types.ObjectId(participantId),
      ],
      type: 'user',
      unreadCount: {},
    });

    await conversation.save();

    return NextResponse.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
      },
    });
  }, 'api/messaging/conversations');
}
