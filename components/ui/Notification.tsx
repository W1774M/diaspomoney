"use client";
import { cn } from "@/lib/utils";
import { NotificationType, useNotificationStore } from "@/store/notifications";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const notificationVariants = {
  initial: { opacity: 0, y: 50, scale: 0.3 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } },
};

const notificationStyles: Record<NotificationType, string> = {
  success: "bg-green-500 text-white",
  error: "bg-red-500 text-white",
  warning: "bg-yellow-500 text-white",
  info: "bg-blue-500 text-white",
};

export function NotificationContainer() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed bottom-0 right-0 p-4 space-y-4 z-50">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            variants={notificationVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "rounded-lg shadow-lg p-4 min-w-[300px] max-w-md",
              notificationStyles[notification.type]
            )}
          >
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => removeNotification(notification.id)}
                className="ml-4 text-white hover:text-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
