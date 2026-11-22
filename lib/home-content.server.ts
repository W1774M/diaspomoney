/** Accès base du contenu de la home — à n'importer que depuis du code serveur. */
import { logger } from '@/lib/logger';
import dbConnect, { getCollection } from '@/lib/mongodb';
import {
  ANNOUNCEMENT_IMAGE_PATH,
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_BANNER_MESSAGES,
  isScheduledNow,
  pickCurrentAnnouncement,
  type HomeAnnouncement,
  type HomeBannerMessage,
  type PublicHomeContent,
} from '@/lib/home-content';
import {
  HomeAnnouncementModel,
  HomeBannerMessageModel,
  type HomeAnnouncementDocument,
  type HomeBannerMessageDocument,
} from '@/models/HomeContent';
import { ObjectId } from 'mongodb';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';

export const HOME_CONTENT_TAG = 'home-content';
export const ANNOUNCEMENT_IMAGES_COLLECTION = 'home_announcement_images';

const toIso = (date: Date | null | undefined) => (date ? new Date(date).toISOString() : null);

export function toBannerMessage(
  doc: HomeBannerMessageDocument & { _id: unknown },
): HomeBannerMessage {
  return {
    id: String(doc._id),
    icon: doc.icon ?? '',
    textBefore: doc.textBefore ?? '',
    linkType: doc.linkType ?? 'none',
    linkLabel: doc.linkLabel ?? '',
    linkHref: doc.linkHref ?? '',
    textAfter: doc.textAfter ?? '',
    isActive: Boolean(doc.isActive),
    order: doc.order ?? 0,
    startsAt: toIso(doc.startsAt),
    endsAt: toIso(doc.endsAt),
  };
}

export function toAnnouncement(
  doc: HomeAnnouncementDocument & { _id: unknown },
): HomeAnnouncement & { createdAt: string | null; updatedAt: string | null } {
  return {
    id: String(doc._id),
    title: doc.title,
    message: doc.message ?? '',
    imageUrl: doc.imageUrl,
    imageAlt: doc.imageAlt,
    href: doc.href ?? '',
    ctaLabel: doc.ctaLabel ?? '',
    isActive: Boolean(doc.isActive),
    startsAt: toIso(doc.startsAt),
    endsAt: toIso(doc.endsAt),
    frequencyHours: doc.frequencyHours ?? 1,
    version: `${String(doc._id)}:${doc.updatedAt ? new Date(doc.updatedAt).getTime() : 0}`,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

/**
 * Importe une seule fois le contenu qui était codé en dur (bandeau + annonce).
 * Un marqueur empêche de le réimporter si l'admin supprime tout ensuite.
 */
async function ensureSeeded(): Promise<void> {
  const markers = await getCollection('seed_markers');
  const result = await markers.updateOne(
    { _id: 'home-content' as never },
    { $setOnInsert: { seededAt: new Date() } },
    { upsert: true },
  );
  if (result.upsertedCount === 0) return;

  if ((await HomeBannerMessageModel.estimatedDocumentCount()) === 0) {
    await HomeBannerMessageModel.insertMany(DEFAULT_BANNER_MESSAGES);
  }
  if ((await HomeAnnouncementModel.estimatedDocumentCount()) === 0) {
    await HomeAnnouncementModel.create({
      ...DEFAULT_ANNOUNCEMENT,
      // Reprend l'état de l'ancien interrupteur d'environnement.
      isActive: process.env['NEXT_PUBLIC_HOME_DIALOG_ENABLED'] === 'true',
    });
  }
}

export async function listBannerMessages(): Promise<HomeBannerMessage[]> {
  await dbConnect();
  await ensureSeeded();
  const docs = await HomeBannerMessageModel.find({}).sort({ order: 1, createdAt: 1 }).lean();
  return docs.map(toBannerMessage);
}

export async function listAnnouncements() {
  await dbConnect();
  await ensureSeeded();
  const docs = await HomeAnnouncementModel.find({}).sort({ createdAt: -1 }).lean();
  return docs.map(toAnnouncement);
}

async function loadPublicHomeContent(): Promise<PublicHomeContent> {
  try {
    const [messages, announcements] = await Promise.all([listBannerMessages(), listAnnouncements()]);
    const now = Date.now();
    const announcement = pickCurrentAnnouncement(announcements, now);
    const bannerMessages = messages
      .filter((message) => isScheduledNow(message, now))
      // Sans annonce en cours, un lien « voir l'annonce » n'ouvrirait rien.
      .map((message) =>
        message.linkType === 'announcement' && !announcement
          ? { ...message, linkType: 'none' as const }
          : message,
      );
    return { bannerMessages, announcement };
  } catch (error) {
    // Pas de base (build) ou panne : bandeau d'origine, sans fenêtre.
    logger.warn({ error: (error as Error).message }, 'Home content unavailable, using defaults');
    return {
      bannerMessages: DEFAULT_BANNER_MESSAGES.map((message, index) => ({
        ...message,
        id: `default-${index}`,
        linkType: message.linkType === 'announcement' ? 'none' : message.linkType,
      })),
      announcement: null,
    };
  }
}

/** Contenu public de la home, mis en cache 60 s et invalidé à chaque modification admin. */
export const getPublicHomeContent = unstable_cache(loadPublicHomeContent, ['home-content'], {
  revalidate: 60,
  tags: [HOME_CONTENT_TAG],
});

/** À appeler après chaque modification admin. */
export function invalidateHomeContent(): void {
  // expire: 0 → la prochaine visite relit la base (pas de version périmée servie).
  revalidateTag(HOME_CONTENT_TAG, { expire: 0 });
  revalidatePath('/');
}

/** Supprime une image téléversée si plus aucune annonce ne l'utilise. */
export async function deleteAnnouncementImageIfUnused(imageUrl: string | undefined): Promise<void> {
  if (!imageUrl?.startsWith(ANNOUNCEMENT_IMAGE_PATH)) return;
  const id = imageUrl.slice(ANNOUNCEMENT_IMAGE_PATH.length);
  if (!ObjectId.isValid(id)) return;
  const stillUsed = await HomeAnnouncementModel.exists({ imageUrl });
  if (stillUsed) return;
  const images = await getCollection(ANNOUNCEMENT_IMAGES_COLLECTION);
  await images.deleteOne({ _id: new ObjectId(id) });
}
