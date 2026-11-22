import { BANNER_LINK_TYPES } from '@/lib/home-content';
import { Schema, model, models, type Model } from 'mongoose';

export interface HomeBannerMessageDocument {
  icon: string;
  textBefore: string;
  linkType: (typeof BANNER_LINK_TYPES)[number];
  linkLabel: string;
  linkHref: string;
  textAfter: string;
  isActive: boolean;
  order: number;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface HomeAnnouncementDocument {
  title: string;
  message: string;
  imageUrl: string;
  imageAlt: string;
  href: string;
  ctaLabel: string;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  frequencyHours: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const HomeBannerMessageSchema = new Schema<HomeBannerMessageDocument>(
  {
    icon: { type: String, default: '' },
    textBefore: { type: String, default: '' },
    linkType: { type: String, enum: BANNER_LINK_TYPES, default: 'none' },
    linkLabel: { type: String, default: '' },
    linkHref: { type: String, default: '' },
    textAfter: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const HomeAnnouncementSchema = new Schema<HomeAnnouncementDocument>(
  {
    title: { type: String, required: true },
    message: { type: String, default: '' },
    imageUrl: { type: String, required: true },
    imageAlt: { type: String, required: true },
    href: { type: String, default: '' },
    ctaLabel: { type: String, default: '' },
    isActive: { type: Boolean, default: false },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    frequencyHours: { type: Number, default: 1 },
  },
  { timestamps: true },
);

export const HomeBannerMessageModel: Model<HomeBannerMessageDocument> =
  (models['HomeBannerMessage'] as Model<HomeBannerMessageDocument> | undefined) ||
  model<HomeBannerMessageDocument>('HomeBannerMessage', HomeBannerMessageSchema);

export const HomeAnnouncementModel: Model<HomeAnnouncementDocument> =
  (models['HomeAnnouncement'] as Model<HomeAnnouncementDocument> | undefined) ||
  model<HomeAnnouncementDocument>('HomeAnnouncement', HomeAnnouncementSchema);
