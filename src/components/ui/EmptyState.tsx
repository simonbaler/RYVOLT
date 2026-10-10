import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  plannedPhase?: number;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  plannedPhase,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-slate-200 bg-white/60 rounded-xl ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 mb-4 ring-1 ring-slate-200/60">
        {icon || <Layers className="w-6 h-6 text-slate-400" />}
      </div>

      {plannedPhase && (
        <div className="text-xs font-semibold text-indigo-600 mb-1.5 uppercase tracking-wider">
          Roadmap · Phase {plannedPhase} Module
        </div>
      )}

      <h3 className="text-base font-semibold text-slate-900 tracking-tight max-w-md">
        {title}
      </h3>

      <p className="text-xs text-slate-500 max-w-md mt-1.5 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
