import { EmailVerificationToken } from "@/lib/definitions";
import mongoose, { Schema } from "mongoose";

const EmailVerificationTokenSchema = new Schema<EmailVerificationToken>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // Suppression automatique après expiration
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

// Index pour améliorer les performances
// EmailVerificationTokenSchema.index({ email: 1 });
// EmailVerificationTokenSchema.index({ token: 1 });
// EmailVerificationTokenSchema.index({ expiresAt: 1 });

export default mongoose.models.EmailVerificationToken ||
  mongoose.model<EmailVerificationToken>(
    "EmailVerificationToken",
    EmailVerificationTokenSchema
  );
