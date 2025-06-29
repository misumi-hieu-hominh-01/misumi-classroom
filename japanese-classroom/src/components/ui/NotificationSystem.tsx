"use client";

import { useState, useEffect } from "react";

export interface Notification {
  id: string;
  message: string;
  type: "seat" | "desk" | "board" | "door" | "custom";
  duration?: number; // ms
  timestamp: number;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onRemoveNotification: (id: string) => void;
}

export default function NotificationSystem({
  notifications,
  onRemoveNotification,
}: NotificationSystemProps) {
  useEffect(() => {
    // Tự động xóa notification sau thời gian duration
    notifications.forEach((notification) => {
      const duration = notification.duration || 4000; // 4 giây mặc định
      const timeElapsed = Date.now() - notification.timestamp;

      if (timeElapsed < duration) {
        const remainingTime = duration - timeElapsed;
        setTimeout(() => {
          onRemoveNotification(notification.id);
        }, remainingTime);
      } else {
        // Notification đã hết hạn
        onRemoveNotification(notification.id);
      }
    });
  }, [notifications, onRemoveNotification]);

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case "seat":
        return "bg-gradient-to-r from-green-400 to-green-600 border-green-300";
      case "desk":
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 border-yellow-300";
      case "board":
        return "bg-gradient-to-r from-blue-400 to-blue-600 border-blue-300";
      case "door":
        return "bg-gradient-to-r from-red-400 to-red-600 border-red-300";
      default:
        return "bg-gradient-to-r from-purple-400 to-purple-600 border-purple-300";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "seat":
        return "🪑";
      case "desk":
        return "📚";
      case "board":
        return "📝";
      case "door":
        return "🚪";
      default:
        return "⭐";
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-40 space-y-3 max-w-sm">
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          className={`
            ${getNotificationStyle(notification.type)}
            text-white p-4 rounded-lg shadow-lg border-2
            transform transition-all duration-500 ease-out
            animate-slide-in-right
          `}
          style={{
            animationDelay: `${index * 100}ms`,
          }}
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="text-2xl flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-5 text-white drop-shadow-sm">
                {notification.message}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={() => onRemoveNotification(notification.id)}
              className="flex-shrink-0 text-white/80 hover:text-white transition-colors duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-white/20 rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-white/60 rounded-full animate-progress-bar"
              style={{
                animationDuration: `${notification.duration || 4000}ms`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook để quản lý notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    message: string,
    type: Notification["type"] = "custom",
    duration?: number
  ) => {
    const newNotification: Notification = {
      id: `notification-${Date.now()}-${Math.random()}`,
      message,
      type,
      duration,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
  };
}
