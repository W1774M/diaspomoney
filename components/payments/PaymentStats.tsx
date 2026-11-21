'use client';

import type { PaymentStatsProps } from '@/lib/types';
import { Calendar, Download, FileText } from 'lucide-react';

export function PaymentStats({
  totalPaid,
  pendingCount,
  receiptsCount,
  currency = 'EUR',
}: PaymentStatsProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
              <FileText className='h-4 w-4 text-green-600' />
            </div>
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium text-gray-500'>Total payé</p>
            <p className='text-2xl font-semibold text-gray-900'>
              {totalPaid.toFixed(2)} {currency}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div className='w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center'>
              <Calendar className='h-4 w-4 text-yellow-600' />
            </div>
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium text-gray-500'>En attente</p>
            <p className='text-2xl font-semibold text-gray-900'>
              {pendingCount}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-lg shadow border border-gray-200 p-6'>
        <div className='flex items-center'>
          <div className='flex-shrink-0'>
            <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
              <Download className='h-4 w-4 text-blue-600' />
            </div>
          </div>
          <div className='ml-4'>
            <p className='text-sm font-medium text-gray-500'>
              Reçus disponibles
            </p>
            <p className='text-2xl font-semibold text-gray-900'>
              {receiptsCount}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
