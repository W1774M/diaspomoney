import mongoose, { Schema } from 'mongoose';

/**
 * Modèle Transaction pour MongoDB
 * Gère les transactions de paiement
 */

export interface ITransaction {
  _id?: mongoose.Types.ObjectId;
  userId: string;
  transactionId?: string;
  orderId?: string;
  bookingId?: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'paypal' | 'bank_transfer' | 'mobile_money' | 'cash';
  paymentMethodId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  description?: string;
  metadata?: Record<string, any>;
  processedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: String,
      required: true,
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    orderId: {
      type: String,
    },
    bookingId: {
      type: String,
    },
    invoiceId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'EUR',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'paypal', 'bank_transfer', 'mobile_money', 'cash'],
      required: true,
    },
    paymentMethodId: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
      required: true,
    },
    description: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    processedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    refundAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index pour améliorer les performances
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ paymentMethod: 1 });
TransactionSchema.index({ transactionId: 1 });

export default mongoose.models['Transaction'] ||
  mongoose.model<ITransaction>('Transaction', TransactionSchema);
