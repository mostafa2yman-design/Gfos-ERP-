import React, { useEffect, useState, useRef } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X, 
  Boxes, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useNotification, NotificationItem, NotificationType } from '../../context/NotificationContext';

export interface NotificationToastProps {
  message?: string;
  title?: string;
  type?: NotificationType;
  duration?: number;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Single Toast Item Component with progress bar and hover-pause
 */
export const ToastCard: React.FC<{
  item: NotificationItem | (NotificationToastProps & { id?: string; createdAt?: number });
  onDismiss: () => void;
}> = ({ item, onDismiss }) => {
  const duration = item.duration !== undefined ? item.duration : 4500;
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const remainingTimeRef = useRef<number>(duration);

  useEffect(() => {
    if (duration <= 0) return;

    let animFrame: number;
    const updateProgress = () => {
      if (!isPaused) {
        const elapsedSinceResume = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingTimeRef.current - elapsedSinceResume);
        const percent = (currentRemaining / duration) * 100;
        setProgress(percent);

        if (currentRemaining <= 0) {
          onDismiss();
          return;
        }
      }
      animFrame = requestAnimationFrame(updateProgress);
    };

    animFrame = requestAnimationFrame(updateProgress);

    return () => {
      cancelAnimationFrame(animFrame);
    };
  }, [duration, isPaused, onDismiss]);

  const handleMouseEnter = () => {
    if (duration <= 0) return;
    setIsPaused(true);
    // save remaining time
    const elapsedSinceResume = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsedSinceResume);
  };

  const handleMouseLeave = () => {
    if (duration <= 0) return;
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  // Determine styling based on type
  const type = item.type || 'info';

  const typeConfig = {
    success: {
      bgCard: 'bg-white/95 dark:bg-slate-900/95 border-emerald-500/30 text-slate-800 dark:text-slate-100 shadow-emerald-500/10',
      badgeBg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      stripColor: 'bg-emerald-500',
      icon: CheckCircle2,
      defaultTitle: 'تم بنجاح'
    },
    error: {
      bgCard: 'bg-white/95 dark:bg-slate-900/95 border-rose-500/30 text-slate-800 dark:text-slate-100 shadow-rose-500/10',
      badgeBg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50',
      iconColor: 'text-rose-600 dark:text-rose-400',
      progressBar: 'bg-gradient-to-r from-rose-500 to-red-400',
      stripColor: 'bg-rose-500',
      icon: AlertCircle,
      defaultTitle: 'تنبيه خطأ'
    },
    warning: {
      bgCard: 'bg-white/95 dark:bg-slate-900/95 border-amber-500/30 text-slate-800 dark:text-slate-100 shadow-amber-500/10',
      badgeBg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
      progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      stripColor: 'bg-amber-500',
      icon: AlertTriangle,
      defaultTitle: 'تنبيه'
    },
    info: {
      bgCard: 'bg-white/95 dark:bg-slate-900/95 border-indigo-500/30 text-slate-800 dark:text-slate-100 shadow-indigo-500/10',
      badgeBg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      progressBar: 'bg-gradient-to-r from-indigo-500 to-blue-400',
      stripColor: 'bg-indigo-500',
      icon: Sparkles,
      defaultTitle: 'إشعار النظام'
    }
  };

  const config = typeConfig[type];
  const IconComponent = config.icon;
  
  let displayTitle = config.defaultTitle;
  if (typeof item.title === 'string' && item.title.trim()) {
    displayTitle = item.title;
  } else if (item.title && typeof item.title === 'object' && typeof (item.title as any).title === 'string') {
    displayTitle = (item.title as any).title;
  }

  const displayMessage = typeof item.message === 'string'
    ? item.message
    : (item.message && typeof (item.message as any).message === 'string'
      ? (item.message as any).message
      : String(item.message || ''));

  return (
    <div
      role="status"
      aria-live="polite"
      dir="rtl"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 transform translate-y-0 opacity-100 hover:scale-[1.01] ${config.bgCard}`}
    >
      {/* Visual side accent bar */}
      <div className={`absolute top-0 bottom-0 right-0 w-1.5 ${config.stripColor}`} />

      <div className="p-4 pr-5 flex items-start gap-3.5">
        {/* Icon pill */}
        <div className={`p-2 rounded-xl flex-shrink-0 flex items-center justify-center ${config.badgeBg}`}>
          <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {displayTitle}
            </h4>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-400 tabular-nums">
              الآن
            </span>
          </div>

          <p className="mt-1 text-xs md:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed break-words">
            {displayMessage}
          </p>

          {/* Action button if present */}
          {item.action && (
            <div className="mt-2.5 flex items-center">
              <button
                type="button"
                onClick={() => {
                  item.action?.onClick();
                  onDismiss();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:underline transition-colors"
              >
                <span>{item.action.label}</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="إغلاق التنبيه"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress countdown indicator */}
      {duration > 0 && (
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 overflow-hidden">
          <div
            className={`h-full transition-all duration-75 ease-linear ${config.progressBar}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * NotificationToastContainer:
 * Placed in AppContent or root to render all active toasts managed by NotificationContext.
 */
export const NotificationToastContainer: React.FC = () => {
  const { notifications, dismissNotification } = useNotification();

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="fixed top-5 left-4 md:left-6 z-50 flex flex-col gap-3 max-w-sm md:max-w-md w-full pointer-events-none transition-all duration-200"
    >
      {notifications.map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          onDismiss={() => dismissNotification(item.id)}
        />
      ))}
    </div>
  );
};

/**
 * NotificationToast:
 * Can be used either without props (rendering the container of global toasts)
 * OR with props as a standalone notification component for direct usage.
 */
export const NotificationToast: React.FC<NotificationToastProps> = (props) => {
  // If message prop is provided, render as single standalone toast
  if (props.message) {
    return (
      <div dir="rtl" className="fixed top-5 left-4 md:left-6 z-50 max-w-sm md:max-w-md w-full pointer-events-none">
        <ToastCard
          item={{
            id: 'standalone',
            type: props.type || 'info',
            title: props.title,
            message: props.message,
            duration: props.duration !== undefined ? props.duration : 4500,
            createdAt: Date.now(),
            action: props.action
          }}
          onDismiss={props.onClose || (() => {})}
        />
      </div>
    );
  }

  // Otherwise render global toast stack
  return <NotificationToastContainer />;
};

export default NotificationToast;
