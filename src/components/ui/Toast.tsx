import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  type?: 'success' | 'warning' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
    warning: <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-600 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-200 bg-emerald-50/40 text-emerald-950',
    warning: 'border-amber-200 bg-amber-50/40 text-amber-950',
    info: 'border-indigo-200 bg-indigo-50/40 text-indigo-950',
  };

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border bg-white shadow-md text-sm ${borders[type]} ${className}`}
    >
      {icons[type]}
      <div className="flex-1">
        <h4 className="font-semibold text-slate-900 leading-tight">{title}</h4>
        {message && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss message"
          className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
