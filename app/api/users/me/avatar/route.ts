import { auth } from '@/auth';
import { getMongoClient } from '@/lib/database/mongodb';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
import { logger } from '@/lib/logger';

// Configuration pour désactiver le body parsing automatique de Next.js
// et permettre le parsing manuel du FormData
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/users/me/avatar - Upload une photo de profil
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier le Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      // Next.js peut ne pas inclure le Content-Type dans les headers
      // mais on peut quand même essayer de parser le FormData
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        `Erreur de parsing FormData: ${errorMessage}`
      );
      return NextResponse.json(
        { 
          error: 'Format de requête invalide. Veuillez utiliser FormData.',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 400 },
      );
    }

    const file = formData.get('avatar') as File | null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni ou format invalide' },
        { status: 400 },
      );
    }

    // Vérifier le type de fichier
    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 },
      );
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux (max 5MB)' },
        { status: 400 },
      );
    }

    // Créer le dossier uploads/avatars s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const userId = session.user.id;
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExtension}`;
    const filePath = join(uploadsDir, fileName);

    // Convertir le fichier en buffer et l'écrire
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL relative pour l'accès public
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Mettre à jour l'avatar dans la base de données
    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection('users');

    // Supprimer l'ancien avatar si il existe
    const currentUser = await users.findOne({ _id: new ObjectId(userId) });
    const currentAvatar = (currentUser as any)?.['avatar'];
    if (currentAvatar && typeof currentAvatar === 'string') {
      const oldAvatarPath = join(process.cwd(), 'public', currentAvatar);
      if (existsSync(oldAvatarPath)) {
        try {
          await unlink(oldAvatarPath);
        } catch (error) {
          logger.warn(
            {
              msg: 'Impossible de supprimer l\'ancien avatar',
              type: 'warning',
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            }
          );
        }
      }
    }

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          avatar: avatarUrl,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      avatar: avatarUrl,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error({
      msg: `Erreur lors de l'upload de la photo de profil: ${errorMessage}`,
      type: 'error',
      error: errorMessage,
      stack: errorStack,
    });
    return NextResponse.json(
      { 
        error: "Erreur lors de l'upload de la photo de profil",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/users/me/avatar - Supprime la photo de profil
 */
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = session.user.id;

    // Récupérer l'avatar actuel pour le supprimer du système de fichiers
    const client = await getMongoClient();
    const db = client.db();
    const users = db.collection('users');

    const currentUser = await users.findOne({ _id: new ObjectId(userId) });
    const currentAvatar = (currentUser as any)?.['avatar'];
    if (currentAvatar && typeof currentAvatar === 'string') {
      const avatarPath = join(process.cwd(), 'public', currentAvatar);
      if (existsSync(avatarPath)) {
        try {
          await unlink(avatarPath);
        } catch (error) {
          logger.warn(
            `Impossible de supprimer l'avatar du système de fichiers: ${error instanceof Error ? error.message : String(error)}` +
            (error instanceof Error && error.stack ? `\nStack: ${error.stack}` : '')
          );
        }
      }
    }

    await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          avatar: null,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: 'Photo de profil supprimée',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logger.error({
      msg: `Erreur lors de la suppression de la photo de profil: ${errorMessage}`,
      type: 'error',
      error: errorMessage,
      stack: errorStack,
    });
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la photo de profil' },
      { status: 500 },
    );
  }
}
