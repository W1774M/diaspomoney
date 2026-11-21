'use client';
import {
  notificationActions,
  useDispatch,
  useNotifications,
} from '@/store/simple-store';
import type { INotificationUIType } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useMemo } from 'react';

const notificationVariants = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

const notificationStyles: { [key in INotificationUIType]: string } = {
  info: 'bg-blue-500 text-white',
  success: 'bg-green-500 text-white',
  warning: 'bg-yellow-500 text-white',
  error: 'bg-red-500 text-white',
};

export default function NotificationContainer() {
  const notifications = useNotifications();
  const dispatch = useDispatch();

  const removeNotification = (id: string) => {
    dispatch(notificationActions.remove(id));
  };

  const clearAllNotifications = () => {
    dispatch(notificationActions.clearAll());
  };

  return (
    <div className='fixed bottom-0 right-0 p-2 sm:p-4 space-y-2 sm:space-y-4 z-50 max-w-[calc(100vw-1rem)] sm:max-w-md'>
      {notifications.length > 0 && (
        <div className='flex justify-between items-center mb-1 sm:mb-2 px-2 sm:px-0'>
          <span className='text-xs sm:text-sm text-gray-600'>
            {notifications.length} notification
            {notifications.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={clearAllNotifications}
            className='text-xs text-gray-500 hover:text-gray-700 underline'
          >
            Effacer tout
          </button>
        </div>
      )}

      <AnimatePresence>
        {notifications.map(notification => {
          // Correction: on s'assure que notification.type est bien un NotificationType
          // Si ce n'est pas le cas, on utilise une valeur par défaut
          const type: INotificationUIType =
            (notification.type === 'info' ||
            notification.type === 'success' ||
            notification.type === 'warning' ||
            notification.type === 'error')
              ? (notification.type as INotificationUIType)
              : 'info';
          return (
            <motion.div
              key={notification.id}
              variants={notificationVariants}
              initial='initial'
              animate='animate'
              exit='exit'
              className={`rounded-lg shadow-lg p-3 sm:p-4 w-full min-w-0 max-w-full sm:min-w-[280px] sm:max-w-md ${notificationStyles[type]}`}
            >
              <div className='flex items-start justify-between gap-2 sm:gap-3'>
                <p className='text-xs sm:text-sm font-medium break-words flex-1 min-w-0'>{notification.message}</p>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className='flex-shrink-0 text-white hover:text-gray-200 transition-colors'
                  aria-label='close'
                >
                  <X size={16} className='sm:w-4 sm:h-4' />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Hook utilitaire pour ajouter des notifications
export const useNotificationManager = () => {
  const dispatch = useDispatch();

  return useMemo(() => ({
    addSuccess: (message: string, duration = 5000) => {
      dispatch(
        notificationActions.add({
          type: 'success',
          message,
          duration,
        }),
      );
    },

    addError: (message: string, duration = 8000) => {
      dispatch(
        notificationActions.add({
          type: 'error',
          message,
          duration,
        }),
      );
    },

    addWarning: (message: string, duration = 6000) => {
      dispatch(
        notificationActions.add({
          type: 'warning',
          message,
          duration,
        }),
      );
    },

    addInfo: (message: string, duration = 5000) => {
      dispatch(
        notificationActions.add({
          type: 'info',
          message,
          duration,
        }),
      );
    },
  }), [dispatch]);
};
