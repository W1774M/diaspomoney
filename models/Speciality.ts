import { SpecialityExtended } from '@/types';
import mongoose, { Schema } from 'mongoose';

const SpecialitySchema = new Schema<SpecialityExtended>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    group: { type: String, required: true },
    isActive: { type: Boolean, required: true },
  },
  {
    timestamps: true,
  },
);

export default mongoose.models['SpecialityType'] ||
  mongoose.model<SpecialityExtended>('SpecialityType', SpecialitySchema);
