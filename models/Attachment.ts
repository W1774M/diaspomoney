import { Attachment } from '@/types/messaging';
import mongoose, { Schema } from 'mongoose';

const AttachmentSchema = new Schema<Attachment>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    url: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: String,
      ref: 'User',
      required: true,
    },
    conversationId: {
      type: String,
      ref: 'Conversation',
    },
    messageId: {
      type: String,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
AttachmentSchema.index({ uploadedBy: 1, createdAt: -1 });
AttachmentSchema.index({ conversationId: 1 });
AttachmentSchema.index({ messageId: 1 });
AttachmentSchema.index({ type: 1 });

export default mongoose.models['Attachment'] ||
  mongoose.model<Attachment>('Attachment', AttachmentSchema);
