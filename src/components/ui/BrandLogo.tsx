import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  const textSizes = {
    sm: 'text-base font-bold tracking-tight',
    md: 'text-xl font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Quantum brand emblem: geometric hexagon lattice with upward electric spark vector */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center rounded-lg bg-slate-950 text-white shadow-md shadow-violet-500/20 ring-1 ring-violet-500/40 overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-transparent to-cyan-500/20 pointer-events-none" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5 text-white relative z-10"
          aria-hidden="true"
        >
          {/* Hexagon perimeter */}
          <path
            d="M12 2.5L20 7.2V16.8L12 21.5L4 16.8V7.2L12 2.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-40"
          />
          {/* Rising quantum volt spark */}
          <path
            d="M13 4.5L8 12H13.5L10.5 19.5L17.5 11H12.5L13 4.5Z"
            fill="url(#ryvolt-quantum-spark)"
            stroke="#ffffff"
            strokeWidth="0.5"
          />
          <defs>
            <linearGradient id="ryvolt-quantum-spark" x1="8" y1="4.5" x2="17.5" y2="19.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#22D3EE" />
              <stop offset="0.5" stopColor="#8B5CF6" />
              <stop offset="1" stopColor="#F43F5E" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="flex flex-col">
        <span className={`${textSizes[size]} text-slate-900 dark:text-white tracking-tight leading-none`}>
          RYVOLT
        </span>
        {showTagline && (
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Build · Prove · Rise
          </span>
        )}
      </div>
    </div>
  );
};
