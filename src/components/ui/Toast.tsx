import React from 'react';
import { NotificationToast } from './NotificationToast';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
  title?: string;
}

export function Toast({ message, type = 'error', onClose, duration = 4000, title }: ToastProps) {
  return (
    <NotificationToast
      message={message}
      type={type}
      onClose={onClose}
      duration={duration}
      title={title}
    />
  );
}

export default Toast;
