'use client';

import { MOCK_USERS } from '@/mocks';
import { Calendar, Clock, History, MapPin, Star, User } from 'lucide-react';
import { useState } from 'react';

export default function HistoryServicesPage() {
  const [filter, setFilter] = useState('all');

  // Filter providers from mock data for history services
  const mockServices = MOCK_USERS.filter(
    user => user.roles.includes('PROVIDER') && user.status === 'ACTIVE'
  )
    .slice(0, 3)
    .map((provider, index) => ({
      id: provider._id,
      title: 'Service professionnel',
      provider: provider.name,
      date: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // Past dates
      time: '14:30',
      location: 'En ligne',
      status: index === 2 ? 'cancelled' : 'completed',
      rating: index === 2 ? null : 4.5,
      type: provider.specialty?.toLowerCase() || 'professional',
      duration: '45 min',
      company: '',
      specialty: provider.specialty,
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
      case 'no_show':
        return 'Absent';
      default:
        return 'Inconnu';
    }
  };

  const filteredServices = mockServices.filter(service => {
    if (filter === 'all') return true;
    if (filter === 'completed') return service.status === 'completed';
    if (filter === 'cancelled') return service.status === 'cancelled';
    return true;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Historique des services
          </h2>
          <p className='text-gray-600 mt-1'>Services terminés et archivés</p>
        </div>
      </div>

      {/* Filters */}
      <div className='flex space-x-4'>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-[hsl(25,100%,53%)] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'completed'
              ? 'bg-[hsl(25,100%,53%)] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Terminés
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'cancelled'
              ? 'bg-[hsl(25,100%,53%)] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Annulés
        </button>
      </div>

      {/* Services List */}
      <div className='grid gap-4'>
        {filteredServices.map(service => (
          <div
            key={service.id}
            className='bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow'
          >
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center mb-2'>
                  <h3 className='text-lg font-semibold text-gray-900'>
                    {service.title}
                  </h3>
                  <span
                    className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      service.status
                    )}`}
                  >
                    {getStatusText(service.status)}
                  </span>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                  <div className='flex items-center text-gray-600'>
                    <User className='h-4 w-4 mr-2' />
                    <span>{service.provider}</span>
                    {service.company && (
                      <span className='ml-2 text-sm text-gray-500'>
                        ({service.company})
                      </span>
                    )}
                  </div>

                  <div className='flex items-center text-gray-600'>
                    <Calendar className='h-4 w-4 mr-2' />
                    <span>
                      {service.date} à {service.time}
                    </span>
                  </div>

                  <div className='flex items-center text-gray-600'>
                    <MapPin className='h-4 w-4 mr-2' />
                    <span>{service.location}</span>
                  </div>

                  <div className='flex items-center text-gray-600'>
                    <Clock className='h-4 w-4 mr-2' />
                    <span>{service.duration}</span>
                  </div>

                  {service.specialty && (
                    <div className='flex items-center text-gray-600'>
                      <span className='text-sm bg-gray-100 px-2 py-1 rounded'>
                        {service.specialty}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rating */}
                {service.rating && (
                  <div className='mt-4'>
                    <div className='flex items-center'>
                      <span className='text-sm text-gray-600 mr-2'>Note:</span>
                      <div className='flex items-center'>
                        {renderStars(service.rating)}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className='flex space-x-2 ml-4'>
                <button className='px-3 py-1 text-sm text-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/10 rounded-lg transition-colors'>
                  Détails
                </button>
                {service.status === 'completed' && (
                  <button className='px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors'>
                    Réévaluer
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <div className='text-center py-12'>
          <History className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Aucun service dans l'historique
          </h3>
          <p className='text-gray-500'>
            Vous n&apos;avez encore aucun service terminé.
          </p>
        </div>
      )}
    </div>
  );
}
