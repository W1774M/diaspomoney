import { RetryToken } from "@/lib/definitions";
import mongoose, { Schema } from "mongoose";

const RetryTokenSchema = new Schema<RetryToken>(
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
// RetryTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// RetryTokenSchema.index({ token: 1 });
// RetryTokenSchema.index({ appointmentId: 1 });

export default mongoose.models.RetryToken ||
  mongoose.model<RetryToken>("RetryToken", RetryTokenSchema);
