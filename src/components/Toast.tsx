// src/components/Toast.tsx
// Auto-dismiss toast notification (success / info / error). 2.5s timeout, OMK palette.

import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'error';

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
}

const VARIANT_STYLES: Readonly<Record<ToastVariant, { wrap: string; icon: React.ReactNode }>> = {
  success: {
    wrap: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
  },
  info: {
    wrap: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Info className="w-5 h-5 text-blue-600" />,
  },
  error: {
    wrap: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
  },
};

export const Toast: React.FC<ToastProps> = ({ message, variant = 'success', onClose }) => {
  const styles = VARIANT_STYLES[variant];
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 min-w-[280px] max-w-md ${styles.wrap}`}
    >
      {styles.icon}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss notification"
        className="p-1 rounded hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Toast;
