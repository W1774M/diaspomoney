import { Schema, model, models } from "mongoose";

const PartnerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, required: true },
    description: { type: String, required: true },
    website: { type: String, required: true },
    category: { type: String, required: true }, // Santé | Éducation | Immobilier | Technologie | Finance ...
    services: { type: [String], default: [] },
    location: { type: String, required: true },
    established: { type: String },
  },
  { timestamps: true }
);

export default models["Partner"] || model("Partner", PartnerSchema);
