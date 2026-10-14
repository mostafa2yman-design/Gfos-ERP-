import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { eventBus } from '../lib/events';
import { BusinessEvent } from '../lib/events/eventTypes';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // duration in milliseconds, default 4500. 0 means persistent
  createdAt: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface NotificationOptions {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ShowNotificationOptions {
  type?: NotificationType;
  title?: string | NotificationOptions;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (options: ShowNotificationOptions) => string;
  notifySuccess: (message: string, titleOrOptions?: string | NotificationOptions, options?: NotificationOptions) => string;
  notifyError: (message: string, titleOrOptions?: string | NotificationOptions, options?: NotificationOptions) => string;
  notifyWarning: (message: string, titleOrOptions?: string | NotificationOptions, options?: NotificationOptions) => string;
  notifyInfo: (message: string, titleOrOptions?: string | NotificationOptions, options?: NotificationOptions) => string;
  dismissNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Helper for dispatching toast notification from anywhere (including non-react code)
export const dispatchNotification = (options: ShowNotificationOptions) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gfos_show_notification', { detail: options }));
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const recentMessagesRef = useRef<Map<string, number>>(new Map());

  // Dismiss a notification by id
  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Show a notification with deduplication to prevent flood
  const showNotification = useCallback((options: ShowNotificationOptions): string => {
    let cleanTitle: string | undefined = undefined;
    let action = options.action;

    if (typeof options.title === 'string') {
      cleanTitle = options.title;
    } else if (options.title && typeof options.title === 'object') {
      if (typeof options.title.title === 'string') {
        cleanTitle = options.title.title;
      }
      if (!action && options.title.action) {
        action = options.title.action;
      }
    }

    const {
      type = 'info',
      duration = 4500
    } = options;

    const message = typeof options.message === 'string' ? options.message : String(options.message || '');

    // Check duplicate within 1.5 seconds
    const key = `${type}:${cleanTitle || ''}:${message}`;
    const now = Date.now();
    const lastSeen = recentMessagesRef.current.get(key);
    if (lastSeen && now - lastSeen < 1500) {
      return ''; // deduplicated
    }
    recentMessagesRef.current.set(key, now);

    // Clean old keys from map periodically
    if (recentMessagesRef.current.size > 50) {
      recentMessagesRef.current.forEach((time, k) => {
        if (now - time > 5000) recentMessagesRef.current.delete(k);
      });
    }

    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem: NotificationItem = {
      id,
      type,
      title: cleanTitle,
      message,
      duration,
      createdAt: now,
      action
    };

    setNotifications((prev) => {
      // Limit to max 5 simultaneous visible notifications
      const updated = [newItem, ...prev.slice(0, 4)];
      return updated;
    });

    return id;
  }, []);

  const resolveArgs = useCallback(
    (
      type: NotificationType,
      defaultTitle: string,
      message: string,
      titleOrOptions?: string | NotificationOptions,
      options?: NotificationOptions
    ): ShowNotificationOptions => {
      if (typeof titleOrOptions === 'string') {
        return {
          type,
          message,
          title: titleOrOptions,
          duration: options?.duration,
          action: options?.action
        };
      }
      if (titleOrOptions && typeof titleOrOptions === 'object') {
        return {
          type,
          message,
          title: typeof titleOrOptions.title === 'string' ? titleOrOptions.title : defaultTitle,
          duration: titleOrOptions.duration ?? options?.duration,
          action: titleOrOptions.action ?? options?.action
        };
      }
      return {
        type,
        message,
        title: defaultTitle,
        duration: options?.duration,
        action: options?.action
      };
    },
    []
  );

  const notifySuccess = useCallback(
    (message: string, titleOrOptions?: string | NotificationOptions, options?: NotificationOptions) =>
      showNotification(resolveArgs('success', 'تم بنجاح', message, titleOrOptions, options)),
    [showNotification, resolveArgs]
  );

  const notifyError = useCallback(
    (message: string, titleOrOptions?: string | NotificationOptions, options?: NotificationOptions) =>
      showNotification(resolveArgs('error', 'خطأ أو تنبيه', message, titleOrOptions, options)),
    [showNotification, resolveArgs]
  );

  const notifyWarning = useCallback(
    (message: string, titleOrOptions?: string | NotificationOptions, options?: NotificationOptions) =>
      showNotification(resolveArgs('warning', 'تنبيه', message, titleOrOptions, options)),
    [showNotification, resolveArgs]
  );

  const notifyInfo = useCallback(
    (message: string, titleOrOptions?: string | NotificationOptions, options?: NotificationOptions) =>
      showNotification(resolveArgs('info', 'إشعار نظام', message, titleOrOptions, options)),
    [showNotification, resolveArgs]
  );

  // Global listeners for events (both window events and business eventBus)
  useEffect(() => {
    // 1. Listen for custom window notifications dispatched from anywhere
    const handleCustomNotification = (e: Event) => {
      const customEvent = e as CustomEvent<ShowNotificationOptions>;
      if (customEvent.detail) {
        showNotification(customEvent.detail);
      }
    };
    window.addEventListener('gfos_show_notification', handleCustomNotification);

    // 2. Listen for business events on eventBus for production orders
    const handleProductionEvent = (event: BusinessEvent<any>) => {
      if (event.type === 'ProductionOrderSaved') {
        const orderNum = event.payload?.orderNumber ? ` (${event.payload.orderNumber})` : '';
        notifySuccess(`تم حفظ أمر الإنتاج بنجاح${orderNum}`, 'أوامر الإنتاج');
      } else if (event.type === 'ProductionOrderCreated') {
        const orderNum = event.payload?.orderNumber ? ` (${event.payload.orderNumber})` : '';
        notifySuccess(`تم إنشاء وحفظ أمر الإنتاج الجديد بنجاح${orderNum}`, 'أمر إنتاج جديد');
      } else if (event.type === 'ProductionOrderApproved') {
        notifySuccess('تم اعتماد أمر الإنتاج وقائمة المواد وخطة التشغيل بنجاح', 'اعتماد أمر الإنتاج');
      } else if (event.type === 'CutOrderApproved') {
        notifySuccess('تم اعتماد أمر القص وخصم استهلاك الخامات بنجاح', 'قسم القص والمخازن');
      } else if (event.type === 'BatchesLocked') {
        notifySuccess('تم اعتماد وتثبيت تشغيلات الباتشات بنجاح', 'مرحلة الباتشات');
      }
    };

    const unsubSaved = eventBus.subscribe('ProductionOrderSaved', handleProductionEvent);
    const unsubCreated = eventBus.subscribe('ProductionOrderCreated', handleProductionEvent);
    const unsubApproved = eventBus.subscribe('ProductionOrderApproved', handleProductionEvent);
    const unsubCutApproved = eventBus.subscribe('CutOrderApproved', handleProductionEvent);
    const unsubBatches = eventBus.subscribe('BatchesLocked', handleProductionEvent);

    // 3. Listen for inventory update events
    const handleInventoryStockUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ message?: string; title?: string }>;
      if (customEvent.detail?.message) {
        notifySuccess(customEvent.detail.message, customEvent.detail.title || 'تحديث المخزون');
      }
    };
    window.addEventListener('inventory_stock_updated', handleInventoryStockUpdate);

    return () => {
      window.removeEventListener('gfos_show_notification', handleCustomNotification);
      window.removeEventListener('inventory_stock_updated', handleInventoryStockUpdate);
      unsubSaved();
      unsubCreated();
      unsubApproved();
      unsubCutApproved();
      unsubBatches();
    };
  }, [showNotification, notifySuccess]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,
        dismissNotification,
        clearAll
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Convenient alias
export const useToast = useNotification;
