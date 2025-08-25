import { User } from "@/lib/definitions";
import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema<User>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    countryOfResidence: {
      type: String,
      required: true,
      trim: true,
    },
    targetCountry: {
      type: String,
      required: true,
      trim: true,
    },
    targetCity: {
      type: String,
      required: true,
      trim: true,
    },
    selectedServices: {
      type: String,
      required: true,
      trim: true,
    },
    monthlyBudget: {
      type: String,
      trim: true,
    },
    securityQuestion: {
      type: String,
      required: true,
      trim: true,
    },
    securityAnswer: {
      type: String,
      required: true,
      trim: true,
    },
    marketingConsent: {
      type: Boolean,
      default: false,
    },
    kycConsent: {
      type: Boolean,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Hash du mot de passe avant sauvegarde
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Index pour améliorer les performances
// UserSchema.index({ email: 1 });
// UserSchema.index({ role: 1 });
// UserSchema.index({ createdAt: -1 });

export default mongoose.models.User || mongoose.model<User>("User", UserSchema);
