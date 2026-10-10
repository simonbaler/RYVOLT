import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export interface VisualScoreNodeProps {
  score: number;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
  verifiedCount?: number;
}

export const VisualScoreNode: React.FC<VisualScoreNodeProps> = ({
  score,
  label = 'Calibrated Completeness',
  size = 'md',
  showBreakdown = true,
  verifiedCount = 3,
}) => {
  const radius = size === 'lg' ? 44 : size === 'md' ? 34 : 26;
  const stroke = size === 'lg' ? 6 : size === 'md' ? 5 : 4;
  const viewBoxSize = (radius + stroke) * 2;
  const center = radius + stroke;
  const circumference = 2 * Math.PI * radius;
  const safeScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: viewBoxSize, height: viewBoxSize }}>
        <svg
          className="w-full h-full -rotate-90 transform"
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={stroke}
            fill="transparent"
          />
          {/* Progress */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            className="stroke-indigo-600 dark:stroke-cyan-400 transition-all duration-700 ease-out"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span
            className={`font-mono font-bold tracking-tight text-slate-900 dark:text-white tabular-nums ${
              size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-xs'
            }`}
          >
            {safeScore}%
          </span>
        </div>
      </div>

      {showBreakdown && (
        <div className="space-y-1 min-w-0">
          <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {label}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{verifiedCount} verified artifacts</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {safeScore >= 80 ? 'Comprehensive' : safeScore >= 50 ? 'Competitive' : 'Calibrating'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export interface CareerNetworkGraphProps {
  skills: string[];
  role: string;
  className?: string;
}

export const CareerNetworkGraph: React.FC<CareerNetworkGraphProps> = ({
  skills,
  role,
  className = '',
}) => {
  const displaySkills = skills.slice(0, 5);

  return (
    <div
      className={`relative p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-hidden ${className}`}
    >
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-mono text-cyan-300">Target Core Node</span>
          <span>5-Node Lattice</span>
        </div>

        {/* Central hub */}
        <div className="p-2.5 rounded-lg bg-indigo-950/80 border border-indigo-700/50 text-white flex items-center justify-between">
          <div className="font-semibold text-xs text-white truncate">{role}</div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Anchor
          </span>
        </div>

        {/* Satellite nodes */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {displaySkills.map((skill, index) => (
            <span
              key={skill}
              className="text-[11px] font-mono bg-slate-900/90 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>{skill}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
