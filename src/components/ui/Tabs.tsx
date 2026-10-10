import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
  size = 'md',
}) => {
  return (
    <div
      role="tablist"
      aria-label="Navigation Tabs"
      className={`inline-flex items-center p-1 bg-slate-100/90 rounded-lg border border-slate-200/60 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`font-medium transition-all rounded-md cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
            } ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`tabular-nums text-xs font-semibold ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
