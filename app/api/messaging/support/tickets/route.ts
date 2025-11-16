import { auth } from '@/auth';
import SupportTicket from '@/models/SupportTicket';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route pour récupérer les tickets de support de l'utilisateur
 * Implémente le Service Layer Pattern via les repositories
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer tous les tickets de l'utilisateur
    const tickets = await (SupportTicket as any)
      .find({
        userId: new mongoose.Types.ObjectId(userId),
      })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Transformer pour l'UI
    const uiTickets = tickets.map((ticket: any) => ({
      _id: ticket._id.toString(),
      userId: ticket.userId.toString(),
      status: ticket.status,
      priority: ticket.priority,
      subject: ticket.subject,
      description: ticket.description,
      messages: ticket.messages?.map((m: any) => m.toString()) || [],
      assignedTo: ticket.assignedTo?._id?.toString(),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      tickets: uiTickets,
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des tickets' },
      { status: 500 }
    );
  }
}
