import { AvailabilityRule } from '@/lib/types';
import mongoose, { Schema } from 'mongoose';

const AvailabilityTimeSlotSchema = new Schema(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false },
);

const AvailabilityRuleSchema = new Schema<AvailabilityRule>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['weekly', 'monthly', 'custom'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: String,
      required: function (this: AvailabilityRule) {
        return this.type === 'monthly' || this.type === 'custom';
      },
    },
    endDate: {
      type: String,
      required: function (this: AvailabilityRule) {
        return this.type === 'monthly' || this.type === 'custom';
      },
    },
    timeSlots: {
      type: [AvailabilityTimeSlotSchema],
      default: [],
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  {
    timestamps: true,
    collection: 'availabilityRules',
  },
);

// Index pour améliorer les performances
AvailabilityRuleSchema.index({ userId: 1, type: 1 });
AvailabilityRuleSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models['AvailabilityRule'] ||
  mongoose.model<AvailabilityRule>('AvailabilityRule', AvailabilityRuleSchema);

