'use client';
import {
  notificationActions,
  useDispatch,
  useNotifications,
} from '@/store/simple-store';
import { NotificationType } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

// Pour corriger l'erreur TS7053 (Element implicitly has an 'any' type...),
// on s'assure que notification.type est bien de type NotificationType.
// Si ce n'est pas garanti par le store, on peut faire une vérification ou un cast de type.

const notificationVariants = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

const notificationStyles: { [key in NotificationType]: string } = {
  EMAIL: 'bg-green-500 text-white',
  SMS: 'bg-red-500 text-white',
  PUSH: 'bg-yellow-500 text-white',
  WHATSAPP: 'bg-blue-500 text-white',
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
    <div className='fixed bottom-0 right-0 p-4 space-y-4 z-50'>
      {notifications.length > 0 && (
        <div className='flex justify-between items-center mb-2'>
          <span className='text-sm text-gray-600'>
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
          const type: NotificationType =
            notification.type === 'success' ||
            notification.type === 'error' ||
            notification.type === 'warning' ||
            notification.type === 'info'
              ? notification.type
              : 'info';
          return (
            <motion.div
              key={notification.id}
              variants={notificationVariants}
              initial='initial'
              animate='animate'
              exit='exit'
              className={`rounded-lg shadow-lg p-4 min-w-[300px] max-w-md ${notificationStyles[type]}`}
            >
              <div className='flex items-start justify-between'>
                <p className='text-sm font-medium'>{notification.message}</p>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className='ml-4 text-white hover:text-gray-200 transition-colors'
                  aria-label='close'
                >
                  <X size={16} />
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

  return {
    addSuccess: (message: string, duration = 5000) => {
      dispatch(
        notificationActions.add({
          type: 'success',
          message,
          duration,
        })
      );
    },

    addError: (message: string, duration = 8000) => {
      dispatch(
        notificationActions.add({
          type: 'error',
          message,
          duration,
        })
      );
    },

    addWarning: (message: string, duration = 6000) => {
      dispatch(
        notificationActions.add({
          type: 'warning',
          message,
          duration,
        })
      );
    },

    addInfo: (message: string, duration = 5000) => {
      dispatch(
        notificationActions.add({
          type: 'info',
          message,
          duration,
        })
      );
    },
  };
};
