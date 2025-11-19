import { auth } from '@/auth';
import Attachment from '@/models/Attachment';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const messageId = searchParams.get('messageId');
    const type = searchParams.get('type'); // 'all' | 'image' | 'document'
    const search = searchParams.get('search');

    // Construire la requête
    const query: any = { uploadedBy: new mongoose.Types.ObjectId(userId) };
    if (conversationId)
      query.conversationId = new mongoose.Types.ObjectId(conversationId);
    if (messageId) query.messageId = new mongoose.Types.ObjectId(messageId);
    if (type && type !== 'all') {
      if (type === 'image') {
        query.type = { $regex: /^image\// };
      } else {
        query.type = { $not: { $regex: /^image\// } };
      }
    }
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const attachments = await (Attachment as any)
      .find(query as any)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'name')
      .lean();

    const uiAttachments = attachments.map((att: any) => ({
      id: att._id.toString(),
      name: att.name,
      type: att.type,
      size: att.size,
      url: att.url,
      uploadedBy: att.uploadedBy?.name || 'Utilisateur',
      uploadedAt: att.createdAt,
      conversationId: att.conversationId?.toString(),
      messageId: att.messageId?.toString(),
    }));

    return NextResponse.json({
      success: true,
      attachments: uiAttachments,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des pièces jointes' },
      { status: 500 },
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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const conversationId = formData.get('conversationId') as string;
    const messageId = formData.get('messageId') as string;

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    // Valider le type de fichier
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé' },
        { status: 400 },
      );
    }

    // Valider la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 },
      );
    }

    // Créer le dossier d'upload si nécessaire
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'attachments');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomStr}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Créer l'entrée dans la base de données
    const attachment = new Attachment({
      name: file.name,
      type: file.type,
      size: file.size,
      url: `/uploads/attachments/${filename}`,
      uploadedBy: new mongoose.Types.ObjectId(userId),
      conversationId: conversationId
        ? new mongoose.Types.ObjectId(conversationId)
        : undefined,
      messageId: messageId ? new mongoose.Types.ObjectId(messageId) : undefined,
    });

    await attachment.save();

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment._id.toString(),
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        url: attachment.url,
        uploadedBy: userId,
        uploadedAt: attachment.createdAt,
        conversationId: attachment.conversationId?.toString(),
        messageId: attachment.messageId?.toString(),
      },
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du fichier" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'ID de pièce jointe requis' },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur est le propriétaire
    const attachment = await (Attachment as any).findOne({
      _id: new mongoose.Types.ObjectId(attachmentId),
    });
    if (!attachment) {
      return NextResponse.json(
        { error: 'Pièce jointe non trouvée' },
        { status: 404 },
      );
    }

    const att = attachment as any;
    if (att.uploadedBy.toString() !== userId) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 },
      );
    }

    // Supprimer le fichier
    const { unlink } = await import('fs/promises');
    const filepath = join(process.cwd(), 'public', attachment.url);
    if (existsSync(filepath)) {
      await unlink(filepath);
    }

    // Supprimer l'entrée de la base de données
    await (Attachment as any).findOneAndDelete({
      _id: new mongoose.Types.ObjectId(attachmentId),
    });

    return NextResponse.json({
      success: true,
      message: 'Pièce jointe supprimée',
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression' },
      { status: 500 },
    );
  }
}
