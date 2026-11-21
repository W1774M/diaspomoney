import { Message } from '@/lib/types';
import mongoose, { Schema } from 'mongoose';

const MessageSchema = new Schema<Message>(
  {
    conversationId: {
      type: String,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: String,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [Schema.Types.ObjectId],
      ref: 'Attachment',
      default: [],
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Index pour améliorer les performances
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ read: 1 });

// Middleware pour mettre à jour la conversation après création d'un message
MessageSchema.post('save', async function () {
  const Conversation = mongoose.model('Conversation');
  await Conversation.findByIdAndUpdate(this.conversationId, {
    lastMessage: this.text,
    lastMessageAt: this.createdAt || new Date(),
  });
});

export default mongoose.models['Message'] ||
  mongoose.model<Message>('Message', MessageSchema);
