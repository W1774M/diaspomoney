'use client';

import { useAuth } from '@/hooks';
import imageLoader from '@/lib/image-loader';
import { UIAttachment } from '@/lib/types';
import {
  Download,
  File,
  FileText,
  Filter,
  Image as ImageIcon,
  Paperclip,
  Search,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AttachmentsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [attachments, setAttachments] = useState<UIAttachment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'document'>(
    'all',
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAttachments();
    }
  }, [isAuthenticated, filterType, searchQuery]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(
        `/api/messaging/attachments?${params.toString()}`,
      );
      const data = await response.json();

      if (data.success) {
        setAttachments(
          data.attachments.map((att: any) => ({
            id: att.id,
            name: att.name,
            type: att.type,
            size: att.size,
            url: att.url,
            uploadedBy: att.uploadedBy,
            uploadedAt: new Date(att.uploadedAt),
            conversationId: att.conversationId,
            messageId: att.messageId,
          })),
        );
      }
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes  } B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)  } KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)  } MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type === 'application/pdf') return FileText;
    return File;
  };

  const filteredAttachments = attachments.filter(attachment => {
    const matchesSearch = attachment.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterType === 'all' ||
      (filterType === 'image' && attachment.type.startsWith('image/')) ||
      (filterType === 'document' && !attachment.type.startsWith('image/'));
    return matchesSearch && matchesFilter;
  });

  const handleDownload = (attachment: UIAttachment) => {
    window.open(attachment.url, '_blank');
  };

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette pièce jointe ?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/messaging/attachments?id=${attachmentId}`,
        {
          method: 'DELETE',
        },
      );

      const data = await response.json();

      if (data.success) {
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Erreur lors de la suppression');
    }
  };

  if (isLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated || loading) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900 flex items-center'>
          <Paperclip className='h-8 w-8 mr-3 text-[hsl(25,100%,53%)]' />
          Pièces jointes
        </h1>
        <p className='text-gray-600 mt-2'>
          Gérez toutes les pièces jointes partagées dans vos conversations
        </p>
      </div>

      {/* Filters */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-4'>
        <div className='flex items-center space-x-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
            <input
              type='text'
              placeholder='Rechercher une pièce jointe...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            />
          </div>
          <div className='flex items-center space-x-2'>
            <Filter className='h-5 w-5 text-gray-500' />
            <select
              value={filterType}
              title='Filtrer par type'
              onChange={e =>
                setFilterType(e.target.value as 'all' | 'image' | 'document')
              }
              className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            >
              <option value='all'>Tous les types</option>
              <option value='image'>Images</option>
              <option value='document'>Documents</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attachments Grid */}
      <div className='bg-white rounded-lg shadow-sm border border-gray-200'>
        {filteredAttachments.length === 0 ? (
          <div className='p-12 text-center'>
            <Paperclip className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Aucune pièce jointe
            </h3>
            <p className='text-gray-600'>
              {searchQuery || filterType !== 'all'
                ? 'Aucune pièce jointe ne correspond à vos critères'
                : "Vous n'avez aucune pièce jointe pour le moment"}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6'>
            {filteredAttachments.map(attachment => {
              const FileIcon = getFileIcon(attachment.type);
              const isImage = attachment.type.startsWith('image/');

              return (
                <div
                  key={attachment.id}
                  className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                >
                  {isImage ? (
                    <div className='relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-100'>
                      <Image
                        src={attachment.url}
                        alt={attachment.name}
                        fill
                        className='object-cover'
                        loader={imageLoader}
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className='w-full h-48 mb-4 rounded-lg bg-gray-100 flex items-center justify-center'>
                      <FileIcon className='h-16 w-16 text-gray-400' />
                    </div>
                  )}

                  <div className='space-y-2'>
                    <h3 className='text-sm font-semibold text-gray-900 truncate'>
                      {attachment.name}
                    </h3>
                    <div className='flex items-center justify-between text-xs text-gray-500'>
                      <span>{formatFileSize(attachment.size)}</span>
                      <span>
                        {attachment.uploadedAt.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className='text-xs text-gray-600'>
                      Par {attachment.uploadedBy}
                    </p>

                    <div className='flex items-center space-x-2 pt-2 border-t border-gray-200'>
                      <button
                        onClick={() => handleDownload(attachment)}
                        className='flex-1 flex items-center justify-center px-3 py-2 bg-[hsl(25,100%,53%)] text-white rounded-lg hover:bg-[hsl(25,100%,48%)] transition-colors text-sm'
                      >
                        <Download className='h-4 w-4 mr-2' />
                        Télécharger
                      </button>
                      <button
                        onClick={() => handleDelete(attachment.id)}
                        className='p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors'
                        title='Supprimer'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
