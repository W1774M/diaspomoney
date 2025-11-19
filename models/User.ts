import { User, UserRole } from '@/lib/types';
import { ROLES, USER_STATUSES } from '@/lib/constants';
import bcrypt from 'bcryptjs';
import mongoose, { Schema } from 'mongoose';

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
    enum: Object.values(ROLES),
    default: [ROLES.CUSTOMER],
  },
  status: {
    type: String,
    enum: Object.values(USER_STATUSES),
    default: USER_STATUSES.PENDING,
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
  // Informations détaillées pour les prestataires
  providerInfo: {
    type: {
      type: String,
      enum: ['INDIVIDUAL', 'INSTITUTION'],
    },
    category: {
      type: String,
      enum: ['HEALTH', 'BTP', 'EDUCATION'],
    },
    specialties: [String],
    description: String,
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Pour les institutions
    institution: {
      legalName: String,
      registrationNumber: String,
      taxId: String,
      establishedYear: Number,
      employees: Number,
      certifications: [String],
    },
    // Pour les individus
    individual: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      qualifications: [String],
      experience: Number, // years
      languages: [String],
    },
    // Informations de contact professionnel
    professionalContact: {
      phone: String,
      email: String,
      website: String,
    },
    // Adresse professionnelle
    professionalAddress: {
      street: String,
      city: String,
      country: String,
      postalCode: String,
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    // Disponibilité
    availability: {
      monday: [
        {
          start: String,
          end: String,
          isAvailable: { type: Boolean, default: true },
          maxBookings: { type: Number, default: 1 },
          currentBookings: { type: Number, default: 0 },
        },
      ],
      tuesday: [
        {
          start: String,
          end: String,
          isAvailable: { type: Boolean, default: true },
          maxBookings: { type: Number, default: 1 },
          currentBookings: { type: Number, default: 0 },
        },
      ],
      wednesday: [
        {
          start: String,
          end: String,
          isAvailable: { type: Boolean, default: true },
          maxBookings: { type: Number, default: 1 },
          currentBookings: { type: Number, default: 0 },
        },
      ],
      thursday: [
        {
          start: String,
          end: String,
          isAvailable: { type: Boolean, default: true },
          maxBookings: { type: Number, default: 1 },
          currentBookings: { type: Number, default: 0 },
        },
      ],
      friday: [
        {
          start: String,
          end: String,
          isAvailable: { type: Boolean, default: true },
          maxBookings: { type: Number, default: 1 },
          currentBookings: { type: Number, default: 0 },
        },
      ],
      saturday: [
        {
          start: String,
          end: String,
          isAvailable: { type: Boolean, default: true },
          maxBookings: { type: Number, default: 1 },
          currentBookings: { type: Number, default: 0 },
        },
      ],
      sunday: [
        {
          start: String,
          end: String,
          isAvailable: { type: Boolean, default: true },
          maxBookings: { type: Number, default: 1 },
          currentBookings: { type: Number, default: 0 },
        },
      ],
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
    // Tarification
    pricing: {
      basePrice: Number,
      currency: String,
      pricingModel: {
        type: String,
        enum: ['FIXED', 'HOURLY', 'PER_SQM', 'CUSTOM'],
        default: 'FIXED',
      },
      discounts: [
        {
          type: { type: String, enum: ['PERCENTAGE', 'FIXED'] },
          value: Number,
          conditions: String,
        },
      ],
    },
    // Documents professionnels
    documents: [
      {
        id: String,
        name: String,
        type: {
          type: String,
          enum: ['LICENSE', 'CERTIFICATE', 'INSURANCE', 'PORTFOLIO', 'OTHER'],
        },
        url: String,
        uploadedAt: { type: Date, default: Date.now },
        expiresAt: Date,
      },
    ],
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
      default: 'fr',
    },
    timezone: {
      type: String,
      default: 'Europe/Paris',
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
    type: Number,
    default: 1000,
    min: 0,
  },
  annualBudget: {
    type: Number,
    default: 12000,
    min: 0,
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

const UserSchema = new Schema<User>(userDefinition, {
  timestamps: true,
});

// Hash du mot de passe avant sauvegarde
UserSchema.pre('save', async function (next) {
  const self = this as any;
  if (!self.isModified('password') || !self.password) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    self.password = await bcrypt.hash(self.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Méthode pour comparer les mots de passe
UserSchema.methods['comparePassword'] = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this['password']) return false;
  return bcrypt.compare(candidatePassword, this['password']);
};

// Méthode pour vérifier si l'utilisateur a un rôle spécifique
UserSchema.methods['hasRole'] = function (role: UserRole): boolean {
  return this['roles'].includes(role);
};

// Méthode pour vérifier si l'utilisateur a au moins un des rôles
UserSchema.methods['hasAnyRole'] = function (roles: UserRole[]): boolean {
  return this['roles'].some((role: UserRole) => roles.includes(role));
};

// Méthode pour ajouter un rôle
UserSchema.methods['addRole'] = function (role: UserRole): void {
  if (!this['roles'].includes(role)) {
    this['roles'].push(role);
  }
};

// Méthode pour retirer un rôle
UserSchema.methods['removeRole'] = function (role: UserRole): void {
  this['roles'] = this['roles'].filter((r: UserRole) => r !== role);
};

// Index pour améliorer les performances
UserSchema.index({ roles: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ specialty: 1 });

export default mongoose.models['User'] ||
  mongoose.model<User>('User', UserSchema);
