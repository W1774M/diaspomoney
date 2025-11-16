'use client';

/**
 * Composant pour afficher la progression d'une commande
 * Implémente le Component Pattern
 */

import { OrderProgressBarProps } from '@/types/orders';
import { CheckCircle2, Circle } from 'lucide-react';

export default function OrderProgressBar({
  progress,
  showSteps = true,
}: OrderProgressBarProps) {
  return (
    <div className='space-y-3'>
      {/* Progress Bar */}
      <div className='relative'>
        <div className='h-2 bg-gray-200 rounded-full overflow-hidden'>
          <div
            className='h-full bg-[hsl(25,100%,53%)] transition-all duration-300'
            role='progressbar'
            aria-valuenow={progress.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className='mt-1 text-xs text-gray-600 text-right'>
          {progress.percentage}% complété
        </div>
      </div>

      {/* Steps */}
      {showSteps && progress.steps && progress.steps.length > 0 && (
        <div className='space-y-2'>
          {progress.steps.map(step => (
            <div key={step.id} className='flex items-center gap-3 text-sm'>
              {step.status === 'completed' ? (
                <CheckCircle2 className='h-5 w-5 text-green-500 flex-shrink-0' />
              ) : step.status === 'in_progress' ? (
                <div className='h-5 w-5 rounded-full border-2 border-[hsl(25,100%,53%)] border-t-transparent animate-spin flex-shrink-0' />
              ) : (
                <Circle className='h-5 w-5 text-gray-300 flex-shrink-0' />
              )}
              <div className='flex-1'>
                <p
                  className={
                    step.status === 'completed'
                      ? 'text-gray-900 font-medium line-through'
                      : step.status === 'in_progress'
                      ? 'text-[hsl(25,100%,53%)] font-medium'
                      : 'text-gray-500'
                  }
                >
                  {step.name}
                </p>
                {step.description && (
                  <p className='text-xs text-gray-400'>{step.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
