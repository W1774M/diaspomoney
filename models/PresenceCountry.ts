import {
  COUNTRY_PREPOSITIONS,
  PRESENCE_STATUSES,
  type PresenceCountryInput,
} from '@/lib/presence-countries';
import { Schema, model, models, type Model } from 'mongoose';

export type PresenceCountryDocument = PresenceCountryInput;

const PresenceCountrySchema = new Schema<PresenceCountryDocument>(
  {
    iso: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    preposition: { type: String, enum: COUNTRY_PREPOSITIONS, required: true },
    status: { type: String, enum: PRESENCE_STATUSES, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const PresenceCountry: Model<PresenceCountryDocument> =
  (models['PresenceCountry'] as Model<PresenceCountryDocument> | undefined) ||
  model<PresenceCountryDocument>('PresenceCountry', PresenceCountrySchema);

export default PresenceCountry;
