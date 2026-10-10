import React, { useState } from 'react';
import { CAPABILITIES } from '../../lib/constants';
import { Compass, Hammer, Briefcase, FileText, BrainCircuit, UserCheck, ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export interface CapabilitiesSectionProps {
  onSelectFeaturePreview: (featureId: string) => void;
}

export const CapabilitiesSection: React.FC<CapabilitiesSectionProps> = ({
  onSelectFeaturePreview,
}) => {
  const [selectedUserFilter, setSelectedUserFilter] = useState<'All' | 'Candidates' | 'Recruiters'>('All');

  const filteredCapabilities = CAPABILITIES.filter((cap) => {
    if (selectedUserFilter === 'All') return true;
    if (cap.targetUser === 'Both') return true;
    return cap.targetUser === selectedUserFilter;
  });

  const getCapabilityIcon = (id: string) => {
    switch (id) {
      case 'career-twin':
        return <Compass className="w-5 h-5 text-indigo-600" />;
      case 'buildlab':
        return <Hammer className="w-5 h-5 text-indigo-600" />;
      case 'job-matching':
        return <Briefcase className="w-5 h-5 text-indigo-600" />;
      case 'resume-studio':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'career-mission-ai':
        return <BrainCircuit className="w-5 h-5 text-indigo-600" />;
      case 'recruiter-intel':
        return <UserCheck className="w-5 h-5 text-indigo-600" />;
      default:
        return <Compass className="w-5 h-5 text-indigo-600" />;
    }
  };

  return (
    <section id="capabilities" className="py-20 sm:py-28 border-t border-slate-200/80 dark:border-indigo-950/60 bg-[#F7F8FF]/80 dark:bg-[#080B18] transition-colors relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold text-violet-600 dark:text-cyan-400 uppercase tracking-widest mb-2.5">
              Platform Architecture
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Product Capabilities
            </h2>
            <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Explore the six interconnected modules planned across RYVOLT’s development roadmap. Connect code artifacts to real career leverage.
            </p>
          </div>

          {/* Clean Segmented Filter Controls */}
          <div className="inline-flex items-center p-1 bg-white/90 dark:bg-[#11162A] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm shrink-0">
            <button
              onClick={() => setSelectedUserFilter('All')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedUserFilter === 'All'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Modules
            </button>
            <button
              onClick={() => setSelectedUserFilter('Candidates')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedUserFilter === 'Candidates'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Candidate Suite
            </button>
            <button
              onClick={() => setSelectedUserFilter('Recruiters')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                selectedUserFilter === 'Recruiters'
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Recruiter Suite
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCapabilities.map((cap) => (
            <div
              key={cap.id}
              className="bg-white/90 dark:bg-[#11162A]/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-6 sm:p-7 flex flex-col justify-between hover:border-violet-500/50 dark:hover:border-cyan-500/50 shadow-sm hover:shadow-xl hover:shadow-violet-500/10 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 dark:bg-cyan-500/10 border border-violet-500/20 dark:border-cyan-500/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getCapabilityIcon(cap.id)}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      Phase {cap.phase}
                    </span>
                    <span className="block text-[10px] text-violet-600 dark:text-cyan-400 font-semibold uppercase tracking-wider">
                      {cap.targetUser}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {cap.title}
                </h3>
                <div className="text-xs font-medium text-violet-600 dark:text-cyan-400 mb-2">
                  {cap.tagline}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {cap.description}
                </p>

                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  {cap.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-violet-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Specification staged
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectFeaturePreview(cap.id)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="text-xs font-semibold text-violet-600 dark:text-cyan-400 hover:text-violet-700 dark:hover:text-cyan-300 p-0"
                >
                  Preview Layout
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
