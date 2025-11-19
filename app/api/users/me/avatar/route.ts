import { auth } from '@/auth';
import { getMongoClient } from '@/lib/database/mongodb';
import { existsSync } from 'fs';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { ObjectId } from 'mongodb';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

/**
 * POST /api/users/me/avatar - Upload une photo de profil
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 },
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
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
          console.warn("Impossible de supprimer l'ancien avatar:", error);
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
    console.error('[API][users/me/avatar][POST] Erreur:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload de la photo de profil" },
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
          console.warn(
            "Impossible de supprimer l'avatar du système de fichiers:",
            error,
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
    console.error('[API][users/me/avatar][DELETE] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la photo de profil' },
      { status: 500 },
    );
  }
}
