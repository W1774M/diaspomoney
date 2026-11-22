/**
 * Contenu de la page d'accueil paramétrable par l'admin :
 * - messages du bandeau défilant ;
 * - annonce mise en avant dans la fenêtre affichée à l'arrivée.
 * Ce module ne dépend d'aucun code serveur : il est utilisable côté client.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const BANNER_LINK_TYPES = ['none', 'url', 'announcement'] as const;
export type BannerLinkType = (typeof BANNER_LINK_TYPES)[number];

/** Message du bandeau : « 🎉 Nouvelle offre santé : [voir l'offre] à partir de 10€. » */
export interface HomeBannerMessage {
  id: string;
  /** Emoji décoratif (non lu par les lecteurs d'écran). */
  icon: string;
  textBefore: string;
  /** `announcement` ouvre la fenêtre de l'annonce en cours. */
  linkType: BannerLinkType;
  linkLabel: string;
  linkHref: string;
  textAfter: string;
  isActive: boolean;
  order: number;
  /** Dates ISO ; absentes = sans limite. */
  startsAt: string | null;
  endsAt: string | null;
}

export interface HomeAnnouncement {
  id: string;
  title: string;
  /** Texte facultatif sous l'image. */
  message: string;
  imageUrl: string;
  imageAlt: string;
  /** Destination du clic sur l'image et du bouton. */
  href: string;
  /** Bouton facultatif sous l'image. */
  ctaLabel: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  /** Délai avant de réafficher l'annonce à un visiteur qui l'a fermée. */
  frequencyHours: number;
  /** Change à chaque modification : une annonce modifiée se réaffiche. */
  version: string;
}

export interface PublicHomeContent {
  bannerMessages: HomeBannerMessage[];
  announcement: HomeAnnouncement | null;
}

// ---------------------------------------------------------------------------
// Règles d'affichage
// ---------------------------------------------------------------------------

/** Actif et dans sa période de diffusion. */
export function isScheduledNow(
  item: { isActive: boolean; startsAt: string | null; endsAt: string | null },
  now: number = Date.now(),
): boolean {
  if (!item.isActive) return false;
  if (item.startsAt && Date.parse(item.startsAt) > now) return false;
  if (item.endsAt && Date.parse(item.endsAt) <= now) return false;
  return true;
}

export type ScheduleState = 'inactive' | 'scheduled' | 'live' | 'expired';

export function scheduleState(
  item: { isActive: boolean; startsAt: string | null; endsAt: string | null },
  now: number = Date.now(),
): ScheduleState {
  if (!item.isActive) return 'inactive';
  if (item.startsAt && Date.parse(item.startsAt) > now) return 'scheduled';
  if (item.endsAt && Date.parse(item.endsAt) <= now) return 'expired';
  return 'live';
}

/**
 * Annonce à afficher : parmi celles en cours de diffusion, la plus récemment démarrée.
 */
export function pickCurrentAnnouncement(
  announcements: (HomeAnnouncement & { createdAt?: string | null | undefined })[],
  now: number = Date.now(),
): HomeAnnouncement | null {
  const live = announcements.filter((a) => isScheduledNow(a, now));
  live.sort((a, b) => startOf(b) - startOf(a));
  return live[0] ?? null;
}

function startOf(a: HomeAnnouncement & { createdAt?: string | null | undefined }): number {
  return Date.parse(a.startsAt ?? a.createdAt ?? '') || 0;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Lien interne (« /services ») ou externe en https : refuse `javascript:` & co. */
export function isSafeHref(href: string): boolean {
  if (href.startsWith('/')) return !href.startsWith('//') && !href.startsWith('/\\');
  try {
    return new URL(href).protocol === 'https:';
  } catch {
    return false;
  }
}

export function isExternalHref(href: string): boolean {
  return /^https:\/\//i.test(href);
}

const hrefSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => value === '' || isSafeHref(value), {
    message: 'Lien interne (« /… ») ou adresse https:// attendu',
  });

const dateSchema = z
  .string()
  .datetime({ offset: true })
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const scheduleRefinement = (value: {
  startsAt?: string | null | undefined;
  endsAt?: string | null | undefined;
}) => !value.startsAt || !value.endsAt || Date.parse(value.endsAt) > Date.parse(value.startsAt);

const scheduleMessage = { message: 'La date de fin doit suivre la date de début', path: ['endsAt'] };

const bannerFields = z.object({
  icon: z.string().trim().max(8).default(''),
  textBefore: z.string().trim().max(200).default(''),
  linkType: z.enum(BANNER_LINK_TYPES).default('none'),
  linkLabel: z.string().trim().max(80).default(''),
  linkHref: hrefSchema.default(''),
  textAfter: z.string().trim().max(200).default(''),
  isActive: z.boolean().default(true),
  order: z.number().int().min(0).max(9999).optional(),
  startsAt: dateSchema,
  endsAt: dateSchema,
});

interface BannerContentShape {
  textBefore?: string | undefined;
  textAfter?: string | undefined;
  linkType?: BannerLinkType | undefined;
  linkLabel?: string | undefined;
  linkHref?: string | undefined;
}

const bannerLinkRefinement = (value: BannerContentShape) =>
  value.linkType === undefined ||
  value.linkType === 'none' ||
  (Boolean(value.linkLabel) && (value.linkType !== 'url' || Boolean(value.linkHref)));

const bannerLinkMessage = {
  message: 'Un lien demande un libellé (et une adresse pour un lien classique)',
  path: ['linkLabel'],
};

const bannerContentRefinement = (value: BannerContentShape) =>
  Boolean(value.textBefore || value.textAfter || value.linkLabel);

export const BannerMessageCreateSchema = bannerFields
  .refine(bannerContentRefinement, { message: 'Le message est vide', path: ['textBefore'] })
  .refine(bannerLinkRefinement, bannerLinkMessage)
  .refine(scheduleRefinement, scheduleMessage);

/** Mise à jour : le message complet est renvoyé par l'admin, sauf pour activer/réordonner. */
export const BannerMessageUpdateSchema = bannerFields
  .partial()
  .refine(bannerLinkRefinement, bannerLinkMessage)
  .refine(scheduleRefinement, scheduleMessage);

const announcementFields = z.object({
  title: z.string().trim().min(2).max(120),
  message: z.string().trim().max(600).default(''),
  imageUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value.startsWith('/') && isSafeHref(value), {
      message: 'Image invalide',
    }),
  imageAlt: z.string().trim().min(2).max(200),
  href: hrefSchema.default(''),
  ctaLabel: z.string().trim().max(60).default(''),
  isActive: z.boolean().default(false),
  startsAt: dateSchema,
  endsAt: dateSchema,
  frequencyHours: z.number().min(0).max(24 * 30).default(1),
});

export const AnnouncementCreateSchema = announcementFields.refine(
  scheduleRefinement,
  scheduleMessage,
);
export const AnnouncementUpdateSchema = announcementFields
  .partial()
  .refine(scheduleRefinement, scheduleMessage);

/** Images de l'annonce : formats raster uniquement (le SVG peut contenir du script). */
export const ANNOUNCEMENT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ANNOUNCEMENT_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
export const ANNOUNCEMENT_IMAGE_PATH = '/api/home-announcements/images/';

// ---------------------------------------------------------------------------
// Contenu initial (repris de l'ancienne version codée en dur)
// ---------------------------------------------------------------------------

type BannerSeed = Omit<HomeBannerMessage, 'id'>;

const bannerSeed = (seed: Partial<BannerSeed> & Pick<BannerSeed, 'order'>): BannerSeed => ({
  icon: '',
  textBefore: '',
  linkType: 'none',
  linkLabel: '',
  linkHref: '',
  textAfter: '',
  isActive: true,
  startsAt: null,
  endsAt: null,
  ...seed,
});

export const DEFAULT_BANNER_MESSAGES: BannerSeed[] = [
  bannerSeed({
    order: 1,
    icon: '🎉',
    textBefore: 'Nouvelle offre santé :',
    linkType: 'announcement',
    linkLabel: "voir l'offre",
    textAfter: 'à partir de 10€.',
  }),
  bannerSeed({
    order: 2,
    icon: '🎒',
    textBefore: 'Paiement des frais de scolarité sécurisé —',
    linkType: 'url',
    linkLabel: 'en savoir plus',
    linkHref: '/services/edu',
    textAfter: '.',
  }),
  bannerSeed({
    order: 3,
    icon: '🏠',
    textBefore: 'Travaux en Afrique ?',
    linkType: 'url',
    linkLabel: 'demandez un devis',
    linkHref: '/services/immo',
    textAfter: '.',
  }),
  bannerSeed({
    order: 4,
    icon: '🎉',
    textBefore: 'Promo santé à 2 euros',
    linkType: 'url',
    linkLabel: "voir l'offre",
    linkHref: '/services/health',
    textAfter: 'à partir de 2€.',
  }),
];

export const DEFAULT_ANNOUNCEMENT: Omit<HomeAnnouncement, 'id' | 'version' | 'isActive'> = {
  title: 'Offre spéciale de 2 euros',
  message: '',
  imageUrl: '/img/ads/add-2euros.jpeg',
  imageAlt: 'Offre DiaspoMoney à 2 euros',
  href: '/services/health',
  ctaLabel: '',
  startsAt: null,
  endsAt: null,
  frequencyHours: 1,
};
