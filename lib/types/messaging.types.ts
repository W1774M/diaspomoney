/**
 * Types pour le système de messagerie
 */

import { BaseEntity } from './index';

export interface Conversation extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id?: string;
  participants: string[]; // IDs des utilisateurs
  type: 'user' | 'support';
  lastMessage?: string;
  lastMessageAt?: Date;
  unreadCount?: { [userId: string]: number };
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
}

export interface Message extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id?: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: string[]; // IDs des attachments
  read: boolean;
  readAt?: Date;
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
}

export interface SupportTicket extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id: string;
  userId: string;
  subject?: string;
  description?: string; // Description du ticket
  type?: SupportTicketType;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assignedTo?: string; // ID du support agent
  messages?: string[]; // IDs des messages
  attachments?: string[]; // IDs des attachments
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
  resolvedAt?: Date;
  closedAt?: Date;
}

export type SupportTicketType =
  | 'TECHNICAL'
  | 'BILLING'
  | 'ACCOUNT'
  | 'GENERAL';

export type SupportTicketStatus =
  | 'open'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Attachment extends Omit<BaseEntity, '_id'> {
  _id: string; // Requis pour BaseEntity
  id?: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  conversationId?: string;
  messageId?: string;
  createdAt: Date; // Requis pour BaseEntity
  updatedAt: Date; // Requis pour BaseEntity
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

