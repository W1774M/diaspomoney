import { SupportTicket } from '@/types/messaging';
import mongoose, { Schema } from 'mongoose';

const SupportTicketSchema = new Schema<SupportTicket>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      required: true,
    },
    messages: {
      type: [String],
      ref: 'Message',
      default: [],
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index pour améliorer les performances
SupportTicketSchema.index({ userId: 1, status: 1 });
SupportTicketSchema.index({ assignedTo: 1 });
SupportTicketSchema.index({ status: 1, priority: -1 });
SupportTicketSchema.index({ createdAt: -1 });

export default mongoose.models['SupportTicket'] ||
  mongoose.model<SupportTicket>('SupportTicket', SupportTicketSchema);
