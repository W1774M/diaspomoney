import { Schema, model, models } from 'mongoose';

/**
 * Modèle Service pour MongoDB
 * Représente un service disponible sur la plateforme
 */
const ServiceSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['HEALTH', 'EDUCATION', 'BTP'],
      index: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    associatedOptions: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'services',
  },
);

// Index composé pour les recherches fréquentes
ServiceSchema.index({ category: 1, isActive: 1 });
ServiceSchema.index({ label: 'text', description: 'text' });

export interface ServiceDocument extends Document {
  _id: string;
  id: string;
  category: 'HEALTH' | 'EDUCATION' | 'BTP';
  label: string;
  description: string;
  price: number;
  isActive: boolean;
  metadata?: Record<string, any>;
  associatedOptions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default models['Service'] || model<ServiceDocument>('Service', ServiceSchema);

