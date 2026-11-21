import { Schema, model, models, Document, type Model } from 'mongoose';

/**
 * Statuts possibles pour un code promotionnel
 */
export type PromotionCodeStatus = 'valid' | 'expired' | 'invalid';

export interface PromotionCodeDocument extends Document {
  label: string;
  percentage: number;
  validFrom: Date;
  validUntil: Date;
  status: PromotionCodeStatus;
  usageCount: number;
  maxUsage: number | null;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  isValid(): boolean;
  calculateDiscount(amount: number): number;
}

/**
 * Modèle PromotionCode pour MongoDB
 * Représente un code promotionnel utilisable lors du paiement
 */
const PromotionCodeSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['valid', 'expired', 'invalid'],
      default: 'valid',
      index: true,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxUsage: {
      type: Number,
      default: null, // null = usage illimité
      min: 1,
    },
    createdBy: {
      type: String, // ID de l'admin qui a créé le code
      required: false,
    },
  },
  {
    timestamps: true,
    collection: 'promotioncodes',
  },
);

// Index pour les recherches fréquentes
PromotionCodeSchema.index({ label: 1, status: 1 });
PromotionCodeSchema.index({ validUntil: 1, status: 1 });
PromotionCodeSchema.index({ createdAt: -1 });

// Méthode pour vérifier si le code est valide
PromotionCodeSchema.methods['isValid'] = function(this: PromotionCodeDocument) {
  const now = new Date();
  return (
    this.status === 'valid' &&
    this.validFrom <= now &&
    this.validUntil >= now &&
    (this.maxUsage === null || this.usageCount < this.maxUsage)
  );
};

// Méthode pour calculer le montant réduit
PromotionCodeSchema.methods['calculateDiscount'] = function(
  this: PromotionCodeDocument,
  amount: number,
): number {
  if (!this.isValid()) {
    return 0;
  }
  return (amount * this.percentage) / 100;
};

const PromotionCodeModel =
  (models['PromotionCode'] as Model<PromotionCodeDocument> | undefined) ||
  model<PromotionCodeDocument>('PromotionCode', PromotionCodeSchema);

export default PromotionCodeModel;

