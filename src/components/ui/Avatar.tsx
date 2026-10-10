import React, { useState } from 'react';

export interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  roleTag?: string;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  roleTag,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  const getInitials = (str: string) => {
    const parts = str.trim().split(/\s+/);
    if (parts.length === 0) return 'RY';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold select-none overflow-hidden bg-slate-100 text-slate-700 ring-1 ring-slate-200/80`}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {roleTag && (
        <span
          title={roleTag}
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-indigo-600 ring-2 ring-white"
        />
      )}
    </div>
  );
};
