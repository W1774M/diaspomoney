import mongoose, { Document, Schema } from "mongoose";

export interface IService {
  id?: number;
  name: string;
  price: number;
}

export interface IProviderType {
  id: string | number;
  value: string;
  group: string; // sante, edu, immo
}

export interface IApiGeo {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  class: string;
  type: string;
  place_rank: number;
  importance: number;
  addresstype: string;
  name: string;
  display_name: string;
  boundingbox: string[];
}

export interface IProvider extends Document {
  id: string | number;
  name: string;
  type: IProviderType;
  specialty: string;
  recommended: boolean;
  apiGeo: IApiGeo[];
  images: string[];
  rating: number;
  reviews?: number;
  distance?: string;
  services: IService[];
  description: string;
  phone: string;
  email: string;
  website: string;
  availabilities: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>({
  id: { type: Number, required: false },
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const ProviderTypeSchema = new Schema<IProviderType>({
  id: { type: Schema.Types.Mixed, required: true }, // string | number
  value: { type: String, required: true },
  group: { type: String, required: true, enum: ["sante", "edu", "immo"] }, // sante, edu, immo
});

const ApiGeoSchema = new Schema<IApiGeo>({
  place_id: { type: Number, required: true },
  licence: { type: String, required: true },
  osm_type: { type: String, required: true },
  osm_id: { type: Number, required: true },
  lat: { type: String, required: true },
  lon: { type: String, required: true },
  class: { type: String, required: true },
  type: { type: String, required: true },
  place_rank: { type: Number, required: true },
  importance: { type: Number, required: true },
  addresstype: { type: String, required: true },
  name: { type: String, required: true },
  display_name: { type: String, required: true },
  boundingbox: [{ type: String }],
});

const ProviderSchema = new Schema<IProvider>(
  {
    id: { type: Schema.Types.Mixed, required: true, unique: true }, // string | number
    name: { type: String, required: true },
    type: { type: ProviderTypeSchema, required: true },
    specialty: { type: String, required: true },
    recommended: { type: Boolean, default: false },
    apiGeo: [{ type: ApiGeoSchema }],
    images: [{ type: String }],
    rating: { type: Number, required: true, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    distance: { type: String },
    services: [{ type: ServiceSchema }],
    description: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    website: { type: String, required: true },
    availabilities: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances de recherche
ProviderSchema.index({ "type.id": 1 });
ProviderSchema.index({ specialty: 1 });
ProviderSchema.index({ recommended: 1 });
ProviderSchema.index({ rating: -1 });

export default mongoose.models.Provider ||
  mongoose.model<IProvider>("Provider", ProviderSchema);
