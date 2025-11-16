/**
 * Types pour le système de messagerie
 */

export interface Conversation {
  _id?: string;
  id?: string;
  participants: string[]; // IDs des utilisateurs
  type: 'user' | 'support';
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: { [userId: string]: number };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Message {
  _id?: string;
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: string[]; // IDs des attachments
  read: boolean;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupportTicket {
  _id?: string;
  id?: string;
  userId: string;
  subject?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  messages: Message[];
  assignedTo?: string; // ID du support agent
  createdAt?: Date;
  updatedAt?: Date;
  resolvedAt?: Date;
}

export interface Attachment {
  _id?: string;
  id?: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  conversationId?: string;
  messageId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Types pour l'UI
export interface UIConversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar?: string;
    role: string;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export interface UIMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
  attachments?: string[];
  read?: boolean;
}

export interface UIAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  conversationId?: string;
  messageId?: string;
}

