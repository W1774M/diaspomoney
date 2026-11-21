import { Conversation } from '@/lib/types';
import mongoose, { Schema } from 'mongoose';

const ConversationSchema = new Schema<Conversation>(
  {
    participants: {
      type: [Schema.Types.ObjectId] as any,
      ref: 'User',
      required: true,
      validate: {
        validator: function (v: any[]) {
          return v.length >= 2;
        },
        message: 'Une conversation doit avoir au moins 2 participants',
      },
    },
    type: {
      type: String,
      enum: ['user', 'support'],
      default: 'user',
      required: true,
    },
    lastMessage: {
      type: String,
      trim: true,
    },
    lastMessageAt: {
      type: Date,
    },
    unreadCount: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

// Index pour améliorer les performances
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ type: 1 });
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ 'participants.0': 1, 'participants.1': 1 }); // Index composé pour les conversations entre 2 utilisateurs

// Méthode pour obtenir l'autre participant
ConversationSchema.methods['getOtherParticipant'] = function (
  userId: string,
): string | null {
  const participants = this['participants'].map((p: any) =>
    p.toString ? p.toString() : p,
  );
  const other = participants.find(
    (p: string) => p !== userId && p !== userId.toString(),
  );
  return other || null;
};

// Méthode pour incrémenter le compteur de messages non lus
ConversationSchema.methods['incrementUnreadCount'] = function (
  userId: string,
): void {
  const self = this as any;
  const userIdStr = userId.toString();
  if (!self['unreadCount']) {
    self['unreadCount'] = {};
  }
  const unreadCount = self['unreadCount'] as any;
  unreadCount[userIdStr] = (unreadCount[userIdStr] || 0) + 1;
};

// Méthode pour réinitialiser le compteur de messages non lus
ConversationSchema.methods['resetUnreadCount'] = function (
  userId: string,
): void {
  const self = this as any;
  if (self['unreadCount']) {
    const unreadCount = self['unreadCount'] as any;
    unreadCount[userId.toString()] = 0;
  }
};

export default mongoose.models['Conversation'] ||
  mongoose.model<Conversation>('Conversation', ConversationSchema);
