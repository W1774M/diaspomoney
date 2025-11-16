'use client';

/**
 * Page de chat avec le support
 * Implémente les design patterns :
 * - Custom Hooks Pattern (useSupportChat, useAuth)
 * - Service Layer Pattern (via les API routes)
 * - Logger Pattern (logging structuré côté serveur)
 */

import { useNotificationManager } from '@/components/ui/Notification';
import { useAuth } from '@/hooks';
import { useSupportChat } from '@/hooks/messaging/useSupportChat';
import { MessageSquare, Paperclip, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function SupportChatPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { messages, fetchSupportChat, sendSupportMessage } = useSupportChat();
  const [inputMessage, setInputMessage] = useState('');
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
      fetchSupportChat(user.id);
    }
  }, [isAuthenticated, user?.id, fetchSupportChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && uploadedAttachments.length === 0) || !user?.id)
      return;

    const attachmentIds = uploadedAttachments.map(att => att.id);
    const messageText = inputMessage.trim() || '';

    setInputMessage('');
    setUploadedAttachments([]);

    // Le hook gère déjà la mise à jour des messages et les erreurs via notifications
    await sendSupportMessage(
      user.id,
      messageText,
      attachmentIds.length > 0 ? attachmentIds : undefined
    ).catch(() => {
      // Le hook gère déjà les erreurs via notifications
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
    if (!files || files.length === 0 || !user?.id) return;

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
            `Type de fichier non autorisé pour ${file.name}. Types autorisés: images, PDF, Word, texte.`
          );
        }

        // Valider la taille (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          throw new Error(
            `Le fichier ${file.name} est trop volumineux (max 10MB).`
          );
        }

        // Créer FormData pour l'upload
        // Note: Pour le support, on n'a pas de conversationId, donc on ne l'envoie pas
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/messaging/attachments', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `Erreur lors de l'upload de ${file.name}`
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
            data.error || `Erreur lors de l'upload de ${file.name}`
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900 flex items-center'>
          <MessageSquare className='h-8 w-8 mr-3 text-[hsl(25,100%,53%)]' />
          Chat avec support
        </h1>
        <p className='text-gray-600 mt-2'>
          Communiquez directement avec notre équipe de support en temps réel
        </p>
      </div>

      {/* Chat Container */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-300px)]'>
        {/* Messages Area */}
        <div className='flex-1 overflow-y-auto p-6 space-y-4'>
          {messages.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-center'>
              <MessageSquare className='h-16 w-16 text-gray-300 mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Aucun message
              </h3>
              <p className='text-gray-600 max-w-md'>
                Commencez une conversation avec notre équipe de support. Nous
                sommes là pour vous aider !
              </p>
            </div>
          ) : (
            messages.map(message => {
              const isUser = message.senderId === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-4 ${
                      isUser
                        ? 'bg-[hsl(25,100%,53%)] text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className='text-sm whitespace-pre-wrap'>
                      {message.text}
                    </p>
                    <p
                      className={`text-xs mt-2 ${
                        isUser ? 'text-orange-100' : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}

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
                (!inputMessage.trim() && uploadedAttachments.length === 0) ||
                uploadingFiles
              }
              className='p-3 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
              title='Envoyer'
            >
              <Send className='h-5 w-5' />
            </button>
          </div>
          {uploadingFiles && (
            <p className='text-xs text-gray-500 mt-2'>Upload en cours...</p>
          )}
        </div>
      </div>
    </div>
  );
}
