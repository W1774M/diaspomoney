import mongoose, { Schema } from "mongoose";

interface PasswordResetToken {
  email: string;
  token: string;
  expiresAt: Date;
  used?: boolean;
}

const PasswordResetTokenSchema = new Schema<PasswordResetToken>(
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
  },
);

// Index pour améliorer les performances
// PasswordResetTokenSchema.index({ email: 1 });
// PasswordResetTokenSchema.index({ token: 1 });
// PasswordResetTokenSchema.index({ expiresAt: 1 });

export default mongoose.models["PasswordResetToken"] ||
  mongoose.model<PasswordResetToken>(
    "PasswordResetToken",
    PasswordResetTokenSchema,
  );
