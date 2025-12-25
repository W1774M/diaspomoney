import { Schema, model, models, Document } from 'mongoose';

/**
 * Modèle Pack pour MongoDB
 * Un pack = un groupe de plusieurs services (ex: pack Santé, pack BTP, pack Éducation)
 */
const PackSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      required: true,
      enum: ['HEALTH', 'EDUCATION', 'BTP'],
      index: true,
    },
    serviceIds: {
      type: [String],
      required: true,
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'packs',
  },
);

PackSchema.index({ category: 1, isActive: 1, createdAt: -1 });
PackSchema.index({ id: 1 }, { unique: true });

export interface PackDocument extends Document {
  id: string;
  label: string;
  description?: string;
  category: 'HEALTH' | 'EDUCATION' | 'BTP';
  serviceIds: string[];
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default models['Pack'] || model<PackDocument>('Pack', PackSchema);


