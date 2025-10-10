import { IUser, UserRole } from "@/types";
import bcrypt from "bcryptjs";
import mongoose, { Schema } from "mongoose";

const userDefinition = {
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  company: {
    type: String,
    trim: true,
  },
  address: {
    type: String,
    trim: true,
  },
  roles: {
    type: [String],
    enum: ["ADMIN", "PROVIDER", "CUSTOMER", "CSM"],
    default: ["CUSTOMER"],
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"],
    default: "PENDING",
  },
  // Champs spécifiques aux prestataires
  specialty: {
    type: String,
    trim: true,
  },
  recommended: {
    type: Boolean,
    default: false,
  },
  apiGeo: [
    {
      place_id: Number,
      licence: String,
      osm_type: String,
      osm_id: Number,
      lat: String,
      lon: String,
      class: String,
      type: String,
      place_rank: Number,
      importance: Number,
      addresstype: String,
      name: String,
      display_name: String,
      boundingbox: [String],
    },
  ],
  // Champs spécifiques aux clients
  clientNotes: {
    type: String,
    trim: true,
  },
  // Champs communs
  avatar: {
    type: String,
  },
  preferences: {
    language: {
      type: String,
      default: "fr",
    },
    timezone: {
      type: String,
      default: "Europe/Paris",
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
  // Champs d'authentification
  password: {
    type: String,
    minlength: 8,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  images: [
    {
      type: String,
      trim: true,
      required: false,
      default: [],
    },
  ],
  // Champs hérités pour compatibilité
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  countryOfResidence: {
    type: String,
    trim: true,
  },
  targetCountry: {
    type: String,
    trim: true,
  },
  targetCity: {
    type: String,
    trim: true,
  },
  selectedServices: {
    type: String,
    trim: true,
  },
  monthlyBudget: {
    type: String,
    trim: true,
  },
  securityQuestion: {
    type: String,
    trim: true,
  },
  securityAnswer: {
    type: String,
    trim: true,
  },
  marketingConsent: {
    type: Boolean,
    default: false,
  },
  kycConsent: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
  },
  oauth: {
    google: {
      linked: { type: Boolean, default: false },
      providerAccountId: { type: String },
    },
    facebook: {
      linked: { type: Boolean, default: false },
      providerAccountId: { type: String },
    },
  },
} as any;

const UserSchema = new Schema<IUser>(userDefinition, {
  timestamps: true,
});

// Hash du mot de passe avant sauvegarde
UserSchema.pre("save", async function (next) {
  const self = this as any;
  if (!self.isModified("password") || !self.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    self.password = await bcrypt.hash(self.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Méthode pour comparer les mots de passe
// Méthode pour comparer les mots de passe
UserSchema.methods["comparePassword"] = async function (
  candidatePassword: string
): Promise<boolean> {
  const self = this as any;
  if (!self["password"]) return false;
  return bcrypt.compare(candidatePassword, self["password"]);
};

// Méthode pour vérifier si l'utilisateur a un rôle spécifique
// Méthode pour vérifier si l'utilisateur a un rôle spécifique
UserSchema.methods["hasRole"] = function (role: UserRole): boolean {
  return this["roles"].includes(role);
};

// Méthode pour vérifier si l'utilisateur a au moins un des rôles
// Méthode pour vérifier si l'utilisateur a au moins un des rôles
UserSchema.methods["hasAnyRole"] = function (roles: UserRole[]): boolean {
  return this["roles"].some((role: UserRole) => roles.includes(role));
};

// Méthode pour ajouter un rôle
// Méthode pour ajouter un rôle
UserSchema.methods["addRole"] = function (role: UserRole): void {
  if (!this["roles"].includes(role)) {
    this["roles"].push(role);
  }
};

// Méthode pour retirer un rôle
// Méthode pour retirer un rôle
UserSchema.methods["removeRole"] = function (role: UserRole): void {
  this["roles"] = this["roles"].filter((r: UserRole) => r !== role);
};

// Index pour améliorer les performances
UserSchema.index({ roles: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ specialty: 1 });

export default mongoose.models["User"] ||
  mongoose.model<IUser>("User", UserSchema);
