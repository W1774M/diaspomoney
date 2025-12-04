import { Schema, model, models } from 'mongoose';

/**
 * Modèle ServiceOption pour MongoDB
 * Représente une option de service
 */
const ServiceOptionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    category: {
      type: String,
      required: false, // Optionnel car une option peut être associée à plusieurs services de catégories différentes
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
    optional: {
      type: Boolean,
      default: true,
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
    associatedServices: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'service_options',
  },
);

// Index composé pour les recherches fréquentes
ServiceOptionSchema.index({ category: 1, isActive: 1 });
ServiceOptionSchema.index({ label: 'text', description: 'text' });

export interface ServiceOptionDocument extends Document {
  _id: string;
  id: string;
  category?: 'HEALTH' | 'EDUCATION' | 'BTP'; // Optionnel car une option peut être associée à plusieurs services de catégories différentes
  label: string;
  description: string;
  price: number;
  optional: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  associatedServices?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default models['ServiceOption'] || model<ServiceOptionDocument>('ServiceOption', ServiceOptionSchema);

