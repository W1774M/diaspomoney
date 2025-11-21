'use client';

import { MOCK_USERS } from '@/mocks';
import { ROLES, USER_STATUSES } from '@/lib/constants';
import { AlertCircle, CheckCircle, Clock, MapPin, User } from 'lucide-react';

export default function TrackingServicesPage() {
  // Filter providers from mock data for tracking services
  const mockServices = MOCK_USERS.filter(
    user => user.roles.includes(ROLES.PROVIDER) && user.status === USER_STATUSES.ACTIVE,
  )
    .slice(0, 2)
    .map((provider, index) => ({
      id: provider._id,
      title: 'Service professionnel',
      provider: provider.name,
      startTime: '09:00',
      endTime: '10:00',
      location: 'En ligne',
      status: index === 0 ? 'in_progress' : 'waiting',
      progress: index === 0 ? 65 : 0,
      type: provider.specialty?.toLowerCase() || 'professional',
      company: '',
      specialty: provider.specialty,
    }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'En cours';
      case 'waiting':
        return 'En attente';
      case 'completed':
        return 'Terminé';
      default:
        return 'Inconnu';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'in_progress':
        return <Clock className='h-4 w-4' />;
      case 'waiting':
        return <AlertCircle className='h-4 w-4' />;
      case 'completed':
        return <CheckCircle className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-gray-900'>
            Suivi des services
          </h2>
          <p className='text-gray-600 mt-1'>Services en cours de réalisation</p>
        </div>
      </div>

      {/* Services List */}
      <div className='grid gap-4'>
        {mockServices.map(service => (
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
                    className={`ml-3 px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(
                      service.status,
                    )}`}
                  >
                    {getStatusIcon(service.status)}
                    <span className='ml-1'>
                      {getStatusText(service.status)}
                    </span>
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
                    <Clock className='h-4 w-4 mr-2' />
                    <span>
                      {service.startTime} - {service.endTime}
                    </span>
                  </div>

                  <div className='flex items-center text-gray-600'>
                    <MapPin className='h-4 w-4 mr-2' />
                    <span>{service.location}</span>
                  </div>

                  {service.specialty && (
                    <div className='flex items-center text-gray-600'>
                      <span className='text-sm bg-gray-100 px-2 py-1 rounded'>
                        {service.specialty}
                      </span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {service.status === 'in_progress' && (
                  <div className='mt-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm text-gray-600'>Progression</span>
                      <span className='text-sm font-medium text-gray-900'>
                        {service.progress}%
                      </span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div
                        className='bg-[hsl(25,100%,53%)] h-2 rounded-full transition-all duration-300'
                        style={{ width: `${service.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className='flex space-x-2 ml-4'>
                <button className='px-3 py-1 text-sm text-[hsl(25,100%,53%)] hover:bg-[hsl(25,100%,53%)]/10 rounded-lg transition-colors'>
                  Détails
                </button>
                {service.status === 'in_progress' && (
                  <button className='px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors'>
                    Marquer terminé
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockServices.length === 0 && (
        <div className='text-center py-12'>
          <Clock className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Aucun service en cours
          </h3>
          <p className='text-gray-500'>
            Vous n&apos;avez aucun service en cours de réalisation.
          </p>
        </div>
      )}
    </div>
  );
}
