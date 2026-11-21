'use client';

/**
 * Page de messagerie avec les utilisateurs
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useMessaging, useAuth)
 * - Service Layer Pattern (via les API routes)
 * - Logger Pattern (logging structuré côté serveur)
 */

import { useNotificationManager } from '@/components/ui/Notification';
import { useAuth } from '@/hooks';
import { useMessaging } from '@/hooks/messaging/useMessaging';
import { MessageSquare, Paperclip, Search, Send, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function UserMessagesPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const {
    conversations,
    messages,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
  } = useMessaging();
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [inputMessage, setInputMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<
    Array<{ id: string; name: string; url: string; type: string }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addError, addSuccess } = useNotificationManager();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchConversations(user.id);
    }
  }, [isAuthenticated, user?.id, fetchConversations]);

  useEffect(() => {
    if (selectedConversation && user?.id) {
      fetchMessages(selectedConversation, user.id);
    } else {
      // Reset messages when no conversation is selected
    }
  }, [selectedConversation, user?.id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (
      (!inputMessage.trim() && uploadedAttachments.length === 0) ||
      !selectedConversation ||
      !user?.id
    )
      return;

    const attachmentIds = uploadedAttachments.map(att => att.id);
    const messageText = inputMessage.trim() || '';

    setInputMessage('');
    setUploadedAttachments([]);

    await sendMessage(
      selectedConversation,
      messageText,
      user.id,
      attachmentIds.length > 0 ? attachmentIds : undefined,
    ).then(() => {
      fetchConversations(user.id);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedConversation || !user?.id)
      return;

    setUploadingFiles(true);

    try {
      const uploadPromises = Array.from(files).map(async file => {
        // Valider le type de fichier
        const allowedTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
        ];

        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            `Type de fichier non autorisé pour ${file.name}. Types autorisés: images, PDF, Word, texte.`,
          );
        }

        // Valider la taille (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error(
            `Le fichier ${file.name} est trop volumineux (max 10MB).`,
          );
        }

        // Créer FormData pour l'upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conversationId', selectedConversation);

        const response = await fetch('/api/messaging/attachments', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Erreur lors de l'upload de ${file.name}`,
          );
        }

        const data = await response.json();
        if (data.success && data.attachment) {
          return {
            id: data.attachment.id,
            name: data.attachment.name,
            url: data.attachment.url,
            type: data.attachment.type,
          };
        } else {
          throw new Error(
            data.error || `Erreur lors de l'upload de ${file.name}`,
          );
        }
      });

      const uploaded = await Promise.all(uploadPromises);
      setUploadedAttachments(prev => [...prev, ...uploaded]);
      addSuccess(`${uploaded.length} fichier(s) ajouté(s) avec succès`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur lors de l'upload";
      addError(errorMessage);
    } finally {
      setUploadingFiles(false);
      // Réinitialiser l'input file pour permettre de sélectionner le même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setUploadedAttachments(prev => prev.filter(att => att.id !== id));
  };

  const filteredConversations = conversations.filter(conv =>
    conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (isLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const currentConversation = conversations.find(
    c => c.id === selectedConversation,
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900 flex items-center'>
          <MessageSquare className='h-8 w-8 mr-3 text-[hsl(25,100%,53%)]' />
          Messages utilisateurs
        </h1>
        <p className='text-gray-600 mt-2'>
          Communiquez avec les autres utilisateurs de la plateforme
        </p>
      </div>

      {/* Main Container */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex h-[calc(100vh-300px)]'>
        {/* Conversations List */}
        <div className='w-1/3 border-r border-gray-200 flex flex-col'>
          {/* Search */}
          <div className='p-4 border-b border-gray-200'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
              <input
                type='text'
                placeholder='Rechercher une conversation...'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
              />
            </div>
          </div>

          {/* Conversations */}
          <div className='flex-1 overflow-y-auto'>
            {filteredConversations.length === 0 ? (
              <div className='p-8 text-center'>
                <MessageSquare className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                <p className='text-gray-600'>
                  {searchQuery
                    ? 'Aucune conversation trouvée'
                    : 'Aucune conversation'}
                </p>
              </div>
            ) : (
              filteredConversations.map(conversation => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedConversation === conversation.id
                      ? 'bg-[hsl(25,100%,53%)]/10 border-l-4 border-l-[hsl(25,100%,53%)]'
                      : ''
                  }`}
                >
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-[hsl(25,100%,53%)] rounded-full flex items-center justify-center flex-shrink-0'>
                      {conversation.participant.avatar ? (
                        <img
                          src={conversation.participant.avatar}
                          alt={conversation.participant.name}
                          className='w-full h-full rounded-full object-cover'
                        />
                      ) : (
                        <User className='h-5 w-5 text-white' />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-1'>
                        <h3 className='text-sm font-semibold text-gray-900 truncate'>
                          {conversation.participant.name}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <span className='flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-[hsl(25,100%,53%)] rounded-full'>
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-gray-600 truncate'>
                        {conversation.lastMessage}
                      </p>
                      <p className='text-xs text-gray-400 mt-1'>
                        {conversation.lastMessageTime.toLocaleTimeString(
                          'fr-FR',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                          },
                        )}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className='flex-1 flex flex-col'>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className='p-4 border-b border-gray-200 bg-gray-50'>
                <div className='flex items-center space-x-3'>
                  <div className='w-10 h-10 bg-[hsl(25,100%,53%)] rounded-full flex items-center justify-center flex-shrink-0'>
                    {currentConversation?.participant.avatar ? (
                      <img
                        src={currentConversation.participant.avatar}
                        alt={currentConversation.participant.name}
                        className='w-full h-full rounded-full object-cover'
                      />
                    ) : (
                      <User className='h-5 w-5 text-white' />
                    )}
                  </div>
                  <div>
                    <h3 className='text-sm font-semibold text-gray-900'>
                      {currentConversation?.participant.name}
                    </h3>
                    <p className='text-xs text-gray-500'>
                      {currentConversation?.participant.role}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className='flex-1 overflow-y-auto p-6 space-y-4'>
                {messages.map(message => {
                  const isOwnMessage = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          isOwnMessage
                            ? 'bg-[hsl(25,100%,53%)] text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className='text-sm whitespace-pre-wrap'>
                          {message.text}
                        </p>
                        <p
                          className={`text-xs mt-2 ${
                            isOwnMessage ? 'text-orange-100' : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.timestamp).toLocaleTimeString(
                            'fr-FR',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className='border-t border-gray-200 p-4'>
                {/* Afficher les fichiers uploadés */}
                {uploadedAttachments.length > 0 && (
                  <div className='mb-3 flex flex-wrap gap-2'>
                    {uploadedAttachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className='flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 text-sm'
                      >
                        <Paperclip className='h-4 w-4 text-gray-600' />
                        <span className='text-gray-700 truncate max-w-[150px]'>
                          {attachment.name}
                        </span>
                        <button
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className='text-gray-400 hover:text-red-500 transition-colors'
                          title='Retirer le fichier'
                        >
                          <X className='h-4 w-4' />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className='flex items-end space-x-2'>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFiles}
                    className='p-2 text-gray-400 hover:text-[hsl(25,100%,53%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    title='Joindre un fichier'
                  >
                    <Paperclip className='h-5 w-5' />
                  </button>
                  <input
                    ref={fileInputRef}
                    type='file'
                    multiple
                    className='hidden'
                    onChange={handleFileUpload}
                    disabled={uploadingFiles}
                    accept='image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'
                    aria-label='Joindre un fichier'
                  />
                  <textarea
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder='Tapez votre message...'
                    rows={3}
                    className='flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      (!inputMessage.trim() &&
                        uploadedAttachments.length === 0) ||
                      uploadingFiles
                    }
                    className='p-3 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                    title='Envoyer'
                  >
                    <Send className='h-5 w-5' />
                  </button>
                </div>
                {uploadingFiles && (
                  <p className='text-xs text-gray-500 mt-2'>
                    Upload en cours...
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className='flex-1 flex items-center justify-center'>
              <div className='text-center'>
                <MessageSquare className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  Sélectionnez une conversation
                </h3>
                <p className='text-gray-600'>
                  Choisissez une conversation dans la liste pour commencer à
                  échanger
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
