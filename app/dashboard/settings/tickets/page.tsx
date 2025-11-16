'use client';

/**
 * Page Tickets Support
 * Affiche les réclamations, statut des tickets et historique des échanges
 * Déplacée depuis Messagerie Interne vers Paramètres
 */

import { useAuth } from '@/hooks';
import { SupportTicket } from '@/types/messaging';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  Search,
  Ticket,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SupportTicketsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'open' | 'in_progress' | 'closed' | 'resolved'
  >('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messaging/support/tickets');
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des tickets');
      }
      const data = await response.json();
      if (data.success && data.tickets) {
        setTickets(data.tickets);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ouvert';
      case 'in_progress':
        return 'En cours';
      case 'closed':
        return 'Fermé';
      case 'resolved':
        return 'Résolu';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-orange-600';
      case 'low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch =
      !searchTerm ||
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.messages.some(message =>
        message.text?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesStatus =
      filterStatus === 'all' || ticket.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(25,100%,53%)]'></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Mes Réclamations</h1>
          <p className='text-gray-600 mt-1'>
            Gérez vos tickets de support et suivez leur statut
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/messaging/support')}
          className='flex items-center gap-2 px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-md hover:bg-[hsl(25,100%,48%)] transition-colors'
        >
          <Plus className='h-4 w-4' />
          Nouveau ticket
        </button>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Total</p>
              <p className='text-2xl font-bold text-gray-900'>
                {tickets.length}
              </p>
            </div>
            <Ticket className='h-8 w-8 text-blue-500' />
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Ouverts</p>
              <p className='text-2xl font-bold text-blue-600'>
                {tickets.filter(t => t.status === 'open').length}
              </p>
            </div>
            <Clock className='h-8 w-8 text-blue-500' />
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>En cours</p>
              <p className='text-2xl font-bold text-orange-600'>
                {tickets.filter(t => t.status === 'in_progress').length}
              </p>
            </div>
            <MessageSquare className='h-8 w-8 text-orange-500' />
          </div>
        </div>
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>Résolus</p>
              <p className='text-2xl font-bold text-green-600'>
                {tickets.filter(t => t.status === 'resolved').length}
              </p>
            </div>
            <CheckCircle2 className='h-8 w-8 text-green-500' />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='flex-1 relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
            <input
              type='text'
              placeholder='Rechercher un ticket...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
            />
          </div>
          <select
            value={filterStatus}
            title='Filtrer par statut'
            onChange={e =>
              setFilterStatus(
                e.target.value as
                  | 'all'
                  | 'open'
                  | 'in_progress'
                  | 'closed'
                  | 'resolved'
              )
            }
            className='px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[hsl(25,100%,53%)] focus:border-transparent'
          >
            <option value='all'>Tous les statuts</option>
            <option value='open'>Ouverts</option>
            <option value='in_progress'>En cours</option>
            <option value='closed'>Fermés</option>
            <option value='resolved'>Résolus</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(25,100%,53%)]'></div>
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className='text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200'>
          <Ticket className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Aucun ticket
          </h3>
          <p className='text-gray-600 mb-4'>
            Vous n&apos;avez pas encore créé de ticket de support
          </p>
          <button
            onClick={() => router.push('/dashboard/messaging/support')}
            className='px-4 py-2 bg-[hsl(25,100%,53%)] text-white rounded-md hover:bg-[hsl(25,100%,48%)] transition-colors'
          >
            Créer un ticket
          </button>
        </div>
      ) : (
        <div className='space-y-4'>
          {filteredTickets.map(ticket => (
            <div
              key={ticket._id?.toString()}
              className='bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer'
              onClick={() =>
                router.push(`/dashboard/messaging/support?ticket=${ticket._id}`)
              }
            >
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <div className='flex items-center gap-3 mb-2'>
                    <h3 className='text-lg font-semibold text-gray-900'>
                      {ticket.subject || 'Sans objet'}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span
                      className={`text-xs font-medium ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {ticket.priority === 'high'
                        ? 'Haute'
                        : ticket.priority === 'medium'
                        ? 'Moyenne'
                        : 'Basse'}
                    </span>
                  </div>
                  {ticket.messages.length > 0 && (
                    <p className='text-sm text-gray-600 line-clamp-2'>
                      {ticket.messages[0]?.text}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
