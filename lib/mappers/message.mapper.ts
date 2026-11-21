/**
 * Mappers pour les messages
 * Transforme les documents message en réponses API
 */

import type { IMapper, MappingOptions } from '@/lib/types';
// Message and Conversation types are used in the function signatures

/**
 * Type pour un document Message MongoDB
 */
export interface MessageDocument {
  _id?: any;
  id?: string;
  conversationId?: string;
  senderId?: string;
  text?: string;
  attachments?: string[];
  read?: boolean;
  readAt?: Date | string;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour un document Conversation MongoDB
 */
export interface ConversationDocument {
  _id?: any;
  id?: string;
  participants?: string[];
  type?: 'user' | 'support';
  lastMessage?: string;
  lastMessageAt?: Date | string;
  unreadCount?: Record<string, number>;
  metadata?: Record<string, any>;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

/**
 * Type pour une réponse API de message
 */
export interface MessageResponse {
  id: string;
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: string[];
  read: boolean;
  readAt?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Type pour une réponse API de conversation
 */
export interface ConversationResponse {
  id: string;
  _id: string;
  participants: string[];
  type: 'user' | 'support';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: Record<string, number>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convertit une date en ISO string de manière sécurisée
 */
function toISOString(date: Date | string | undefined | null): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  try {
    return new Date(date as string | number).toISOString();
  } catch {
    return undefined;
  }
}

/**
 * Classe MessageMapper implémentant IMapper
 */
export class MessageMapper implements IMapper<MessageDocument, MessageResponse> {
  /**
   * Transforme un document message vers une réponse API
   */
  map(input: MessageDocument, options?: MappingOptions): MessageResponse {
    return mapMessageToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents message
   */
  mapMany(inputs: MessageDocument[], options?: MappingOptions): MessageResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Classe ConversationMapper implémentant IMapper
 */
export class ConversationMapper implements IMapper<ConversationDocument, ConversationResponse> {
  /**
   * Transforme un document conversation vers une réponse API
   */
  map(input: ConversationDocument, options?: MappingOptions): ConversationResponse {
    return mapConversationToResponse(input, options);
  }

  /**
   * Transforme un tableau de documents conversation
   */
  mapMany(inputs: ConversationDocument[], options?: MappingOptions): ConversationResponse[] {
    return inputs.map((input) => this.map(input, options));
  }
}

/**
 * Instance singleton du mapper
 */
export const messageMapper = new MessageMapper();
export const conversationMapper = new ConversationMapper();

/**
 * Mappe un document message vers une réponse API
 * 
 * @param messageDoc - Document message depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapMessageToResponse(
  messageDoc: MessageDocument,
  _options?: MappingOptions,
): MessageResponse {
  // Extraire l'ID
  const id = messageDoc.id || messageDoc._id?.toString() || '';
  const _id = messageDoc._id?.toString() || id;

  const readAtValue = messageDoc.readAt ? toISOString(messageDoc.readAt) : undefined;
  
  return {
    id,
    _id,
    conversationId: messageDoc.conversationId || '',
    senderId: messageDoc.senderId || '',
    text: messageDoc.text || '',
    ...(messageDoc.attachments && messageDoc.attachments.length > 0 && { attachments: messageDoc.attachments }),
    read: messageDoc.read ?? false,
    ...(readAtValue && { readAt: readAtValue }),
    ...(messageDoc.metadata && { metadata: messageDoc.metadata }),
    createdAt: toISOString(messageDoc.createdAt) || new Date().toISOString(),
    updatedAt: toISOString(messageDoc.updatedAt) || new Date().toISOString(),
  };
}

/**
 * Mappe un document conversation vers une réponse API
 * 
 * @param conversationDoc - Document conversation depuis le repository
 * @param options - Options de mapping
 * @returns Réponse API formatée
 */
export function mapConversationToResponse(
  conversationDoc: ConversationDocument,
  _options?: MappingOptions,
): ConversationResponse {
  // Extraire l'ID
  const id = conversationDoc.id || conversationDoc._id?.toString() || '';
  const _id = conversationDoc._id?.toString() || id;

  const lastMessageAtValue = conversationDoc.lastMessageAt ? toISOString(conversationDoc.lastMessageAt) : undefined;
  
  return {
    id,
    _id,
    participants: conversationDoc.participants || [],
    type: conversationDoc.type || 'user',
    ...(conversationDoc.lastMessage && { lastMessage: conversationDoc.lastMessage }),
    ...(lastMessageAtValue && { lastMessageAt: lastMessageAtValue }),
    ...(conversationDoc.unreadCount && { unreadCount: conversationDoc.unreadCount }),
    ...(conversationDoc.metadata && { metadata: conversationDoc.metadata }),
    createdAt: toISOString(conversationDoc.createdAt) || new Date().toISOString(),
    updatedAt: toISOString(conversationDoc.updatedAt) || new Date().toISOString(),
  };
}

