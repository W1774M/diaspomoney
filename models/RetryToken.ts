import mongoose, { Document, Schema } from "mongoose";

export interface IRetryToken extends Document {
  token: string;
  appointmentId: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

const RetryTokenSchema = new Schema<IRetryToken>(
  {
    token: {
      type: String,
      required: true,
      unique: true,
    },
    appointmentId: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index TTL pour supprimer automatiquement les tokens expirés
RetryTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RetryTokenSchema.index({ token: 1 });
RetryTokenSchema.index({ appointmentId: 1 });

export default mongoose.models.RetryToken ||
  mongoose.model<IRetryToken>("RetryToken", RetryTokenSchema);
