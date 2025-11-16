import { auth } from '@/auth';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'ID de conversation requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est participant de la conversation
    const conversationDoc = await (Conversation as any)
      .findOne({
        _id: new mongoose.Types.ObjectId(conversationId),
      })
      .lean();
    if (!conversationDoc) {
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
    }

    const isParticipant = Array.isArray(conversationDoc.participants)
      ? conversationDoc.participants.some((p: any) => p.toString() === userId)
      : false;
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer les messages
    const messages = await (Message as any)
      .find({
        conversationId: new mongoose.Types.ObjectId(conversationId),
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('attachments', 'name type size url')
      .lean();

    // Transformer pour l'UI
    const uiMessages = messages.reverse().map((msg: any) => ({
      id: msg._id.toString(),
      text: msg.text,
      senderId: msg.senderId.toString(),
      timestamp: msg.createdAt,
      attachments: msg.attachments?.map((a: any) => a._id.toString()) || [],
      read: msg.read,
    }));

    // Marquer les messages comme lus
    await Message.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(conversationId),
        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
        read: false,
      },
      {
        read: true,
        readAt: new Date(),
      }
    );

    // Réinitialiser le compteur de messages non lus
    // NOTE: Since we retrieved with .lean(), update with model
    await (Conversation as any).updateOne(
      { _id: new mongoose.Types.ObjectId(conversationId) },
      { $set: { [`unreadCount.${userId}`]: 0 } }
    );

    return NextResponse.json({
      success: true,
      messages: uiMessages,
      pagination: {
        page,
        limit,
        total: await Message.countDocuments({
          conversationId: new mongoose.Types.ObjectId(conversationId),
        }),
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const { conversationId, text, attachments } = await request.json();

    if (!conversationId || !text) {
      return NextResponse.json(
        { error: 'ID de conversation et texte requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est participant
    const conversation = await (Conversation as any).findById(
      new mongoose.Types.ObjectId(conversationId)
    );
    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation non trouvée' },
        { status: 404 }
      );
    }

    const isParticipant = Array.isArray(conversation.participants)
      ? conversation.participants.some((p: any) => p.toString() === userId)
      : false;
    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Créer le message
    const message = new Message({
      conversationId: new mongoose.Types.ObjectId(conversationId),
      senderId: new mongoose.Types.ObjectId(userId),
      text,
      attachments:
        attachments?.map((id: string) => new mongoose.Types.ObjectId(id)) || [],
      read: false,
    });

    await message.save();

    // Mettre à jour la conversation (last message and last message at)
    conversation.lastMessage = text;
    conversation.lastMessageAt = new Date();

    // Trouver l'autre participant et incrémenter son compteur
    const otherParticipant = Array.isArray(conversation.participants)
      ? conversation.participants.find((p: any) => p.toString() !== userId)
      : null;
    if (otherParticipant) {
      const otherId = otherParticipant.toString();
      if (!conversation.unreadCount) {
        conversation.unreadCount = {};
      }
      const unreadCount = conversation.unreadCount as any;
      unreadCount[otherId] = (unreadCount[otherId] || 0) + 1;
    }
    await conversation.save();

    return NextResponse.json({
      success: true,
      message: {
        id: message._id.toString(),
        text: message.text,
        senderId: message.senderId.toString(),
        timestamp: message.createdAt || new Date(),
        attachments: message.attachments?.map((a: any) => a.toString()) || [],
      },
    });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
