import { SpecialityType } from "@/lib/definitions";
import mongoose, { Schema } from "mongoose";

const SpecialitySchema = new Schema<SpecialityType>(
  {
    id: { type: Number, required: false },
    name: { type: String, required: true },
    type: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SpecialityType ||
  mongoose.model<SpecialityType>("ServiceType", SpecialitySchema);
