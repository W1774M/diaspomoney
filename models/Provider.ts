import { ApiGeo, Provider, ProviderType, Service } from "@/lib/definitions";
import mongoose, { Schema } from "mongoose";

const ServiceSchema = new Schema<Service>({
  id: { type: Number, required: false },
  name: { type: String, required: true },
  price: { type: Number, required: true },
});

const ProviderTypeSchema = new Schema<ProviderType>({
  id: { type: Schema.Types.Mixed, required: true }, // string | number
  value: { type: String, required: true },
  group: { type: String, required: true, enum: ["sante", "edu", "immo"] }, // sante, edu, immo
});

const ApiGeoSchema = new Schema<ApiGeo>({
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

const ProviderSchema = new Schema<Provider>(
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
// ProviderSchema.index({ "type.id": 1 });
// ProviderSchema.index({ specialty: 1 });
// ProviderSchema.index({ recommended: 1 });
// ProviderSchema.index({ rating: -1 });

export default mongoose.models.Provider ||
  mongoose.model<Provider>("Provider", ProviderSchema);
