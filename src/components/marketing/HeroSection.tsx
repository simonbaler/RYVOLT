import React from 'react';
import {
  ArrowRight,
  Compass,
  Mic,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Sparkles,
  Layers,
  Building2,
  Search,
  Code2,
  Lock,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { CareerGraphVisual } from './CareerGraphVisual';
import { ThreeNeuralCanvas } from './ThreeNeuralCanvas';
import { audioService } from '../../lib/audioService';

export interface HeroSectionProps {
  onStartBuilding: () => void;
  onExplore: () => void;
  onOpenVoiceCoach?: () => void;
  onOpenRecruiter?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onStartBuilding,
  onExplore,
  onOpenVoiceCoach,
  onOpenRecruiter,
}) => {
  const handleStart = () => {
    audioService.playClick();
    onStartBuilding();
  };

  const handleExplore = () => {
    audioService.playClick();
    onExplore();
  };

  const handleVoice = () => {
    audioService.playVoiceWake();
    if (onOpenVoiceCoach) onOpenVoiceCoach();
  };

  const handleRecruiter = () => {
    audioService.playClick();
    if (onOpenRecruiter) onOpenRecruiter();
  };

  return (
    <section id="hero" className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden transition-colors bg-tech-grid">
      {/* Cinematic ambient background glow and 3D Neural Canvas */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[700px] bg-gradient-to-b from-violet-950/20 via-slate-950/10 to-transparent" />
        <div className="absolute top-10 right-1/4 w-[600px] h-[600px] bg-violet-600/15 dark:bg-violet-600/25 rounded-full blur-[120px]" />
        <div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-cyan-400/10 dark:bg-cyan-500/20 rounded-full blur-[120px]" />
        <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-rose-500/10 dark:bg-rose-500/15 rounded-full blur-[140px]" />
        <ThreeNeuralCanvas className="opacity-45 dark:opacity-75" intensity={0.9} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main Hero Header */}
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Clean unboxed category label - zero pill discipline */}
          <div className="flex items-center justify-center gap-2.5 text-xs font-semibold tracking-wider uppercase text-violet-600 dark:text-cyan-300 mb-5">
            <Sparkles className="w-4 h-4 text-violet-500 dark:text-cyan-400" />
            <span>Deterministic Career Platform</span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono text-[11px]">Phase 9 Quantum Studio</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.08] text-balance">
            Build with code.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-cyan-500 to-indigo-500 dark:from-violet-400 dark:via-cyan-300 dark:to-indigo-300">
              Prove with evidence.
            </span>{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">
              Rise with certainty.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed text-balance">
            Replace keyword inflation with verified code artifacts, automated test suites, and deterministic Career Twin graphs. Built for real engineering builders and hiring teams.
          </p>

          {/* Call to Actions */}
          <div className="mt-9 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
            <Button
              variant="quantum"
              size="lg"
              onClick={handleStart}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto justify-center shadow-xl shadow-violet-900/25 px-6 font-semibold"
            >
              Build your Career Twin
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={handleExplore}
              leftIcon={<Compass className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
              className="w-full sm:w-auto justify-center"
            >
              Discover opportunities
            </Button>

            {onOpenRecruiter && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleRecruiter}
                leftIcon={<Building2 className="w-4 h-4 text-violet-500" />}
                className="w-full sm:w-auto justify-center"
              >
                Recruiter Portal
              </Button>
            )}

            {onOpenVoiceCoach && (
              <button
                onClick={handleVoice}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-slate-950 hover:bg-slate-800 text-cyan-300 border border-slate-700 dark:border-slate-800 text-xs font-bold transition-all shadow-md cursor-pointer hover:border-cyan-400/50"
              >
                <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>AI Voice Coach</span>
              </button>
            )}
          </div>

          {/* Value Props Bar */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              Zero keyword games
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-violet-500 shrink-0" />
              Verified code artifacts
            </span>
            <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
              Deterministic match scoring
            </span>
          </div>
        </div>

        {/* Polished Interactive Product Visual */}
        <div className="mt-12 lg:mt-16 max-w-5xl mx-auto">
          <CareerGraphVisual onOpenVoiceCoach={onOpenVoiceCoach} />
        </div>

        {/* Architectural Pillars (truthful, anti-slop, verifiable capabilities) */}
        <div className="mt-12 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Verification Engine
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Hermetic Sandboxes
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Real test fixtures and benchmark commits prove claims before applications leave your desk.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Talent Pipeline
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Recruiter Console
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Real Kanban pipeline stages, collaborative shortlists, and technical scorecards.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
              AI Voice Coaching
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Sub-Second Speech
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Simulate technical screeners and refine elevator pitches using browser speech synthesis.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs transition-colors">
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Compliance & Audit
            </div>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              Enterprise Governance
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Domain whitelist SSO bounds, organization verification, and platform audit logs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
