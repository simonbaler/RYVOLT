import React, { useState } from 'react';
import {
  GitCommit,
  CheckCircle2,
  Cpu,
  Sparkles,
  Building2,
  ChevronRight,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mic,
  Activity,
  Award,
} from 'lucide-react';
import { audioService } from '../../lib/audioService';

interface ArchetypeTrack {
  id: string;
  name: string;
  targetRole: string;
  matchScore: number;
  salaryBand: string;
  evidenceCount: number;
  nodes: {
    id: string;
    label: string;
    category: 'skill' | 'project' | 'proof' | 'opportunity';
    detail: string;
    verified: boolean;
  }[];
}

const TRACKS: ArchetypeTrack[] = [
  {
    id: 'dist-sys',
    name: 'Distributed Systems',
    targetRole: 'Senior Distributed Systems Engineer',
    matchScore: 94,
    salaryBand: '$175k - $225k',
    evidenceCount: 4,
    nodes: [
      {
        id: 'node-1',
        label: 'Raft State Machine',
        category: 'project',
        detail: 'Hermetic consensus log with io_uring write compaction',
        verified: true,
      },
      {
        id: 'node-2',
        label: 'Go & Rust Systems',
        category: 'skill',
        detail: 'L4 depth verified through 12 merged benchmark commits',
        verified: true,
      },
      {
        id: 'node-3',
        label: 'BuildLab Sandbox Run',
        category: 'proof',
        detail: '38/38 chaos network partition test fixtures passed',
        verified: true,
      },
      {
        id: 'node-4',
        label: 'Nexus Cloud Fabric',
        category: 'opportunity',
        detail: '94% Requisition Match · Tier-0 Database Team',
        verified: true,
      },
    ],
  },
  {
    id: 'ai-infra',
    name: 'AI / LLM Platform',
    targetRole: 'Lead AI Infrastructure Engineer',
    matchScore: 91,
    salaryBand: '$195k - $255k',
    evidenceCount: 3,
    nodes: [
      {
        id: 'node-1',
        label: 'vLLM Paged Attention',
        category: 'project',
        detail: 'Continuous batching cluster with FP8 quantization',
        verified: true,
      },
      {
        id: 'node-2',
        label: 'PyTorch & CUDA',
        category: 'skill',
        detail: 'Low-latency multi-GPU tensor communication',
        verified: true,
      },
      {
        id: 'node-3',
        label: 'Latency Benchmark Run',
        category: 'proof',
        detail: 'Sub-18ms time-to-first-token certified under load',
        verified: true,
      },
      {
        id: 'node-4',
        label: 'Cognitive Frontier Labs',
        category: 'opportunity',
        detail: '91% Match · Model Inference Scaling Lead',
        verified: true,
      },
    ],
  },
  {
    id: 'fullstack',
    name: 'Systems Architect',
    targetRole: 'Staff Full-Stack Architect',
    matchScore: 96,
    salaryBand: '$185k - $240k',
    evidenceCount: 5,
    nodes: [
      {
        id: 'node-1',
        label: 'Reactive Graph Workspace',
        category: 'project',
        detail: 'Real-time Canvas state with zero layout shifts',
        verified: true,
      },
      {
        id: 'node-2',
        label: 'TypeScript & PostgreSQL',
        category: 'skill',
        detail: 'Strict end-to-end schema integrity & sub-50ms queries',
        verified: true,
      },
      {
        id: 'node-3',
        label: 'A11y & Performance Audit',
        category: 'proof',
        detail: '100 Lighthouse score & WCAG 2.1 AA certified',
        verified: true,
      },
      {
        id: 'node-4',
        label: 'RYVOLT Core Technologies',
        category: 'opportunity',
        detail: '96% Match · Product Architecture Team',
        verified: true,
      },
    ],
  },
];

export interface CareerGraphVisualProps {
  onExploreRole?: (roleTitle: string) => void;
  onOpenVoiceCoach?: () => void;
}

export const CareerGraphVisual: React.FC<CareerGraphVisualProps> = ({
  onExploreRole,
  onOpenVoiceCoach,
}) => {
  const [selectedTrackId, setSelectedTrackId] = useState<string>('dist-sys');
  const [activeNodeIndex, setActiveNodeIndex] = useState<number>(0);

  const currentTrack = TRACKS.find((t) => t.id === selectedTrackId) || TRACKS[0];
  const activeNode = currentTrack.nodes[activeNodeIndex] || currentTrack.nodes[0];

  return (
    <div className="w-full bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden text-slate-100 relative">
      {/* Ambient background lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-indigo-500/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-t from-violet-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* Control Strip & Track Selector */}
      <div className="relative z-10 px-6 py-5 border-b border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
              Live Career Intelligence Simulation
            </span>
          </div>
          <h4 className="text-base font-extrabold text-white mt-1">
            Real Project Execution → Verifiable Match Scoring
          </h4>
        </div>

        {/* Track Selector Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {TRACKS.map((track) => (
            <button
              key={track.id}
              onClick={() => {
                audioService.playClick();
                setSelectedTrackId(track.id);
                setActiveNodeIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTrackId === track.id
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {track.name}
            </button>
          ))}
        </div>
      </div>

      {/* Graph Visual Canvas Area */}
      <div className="relative z-10 p-6 sm:p-8 space-y-6">
        {/* Archetype Overview Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              Simulated Target Requisition
            </span>
            <div className="text-lg font-bold text-white mt-0.5">
              {currentTrack.targetRole}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Target Comp: <span className="text-emerald-400 font-semibold">{currentTrack.salaryBand}</span> · {currentTrack.evidenceCount} Verified Code Artifacts Linked
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Deterministic Fit
              </span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                {currentTrack.matchScore}%
              </span>
            </div>

            <div className="h-10 w-px bg-slate-800 hidden sm:block" />

            {onOpenVoiceCoach && (
              <button
                onClick={() => {
                  audioService.playVoiceWake();
                  onOpenVoiceCoach();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <Mic className="w-3.5 h-3.5 text-cyan-400" />
                <span>Voice AI Rehearsal</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive 4-Node Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 lg:gap-4 relative">
          {currentTrack.nodes.map((node, index) => {
            const isActive = activeNodeIndex === index;
            const stepLabels = ['01. Project Artifact', '02. Core Skill Node', '03. Test Evidence', '04. Target Match'];

            return (
              <button
                key={node.id}
                onClick={() => {
                  audioService.playClick();
                  setActiveNodeIndex(index);
                }}
                className={`relative text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-800/90 border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Step badge */}
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                  <span>{stepLabels[index]}</span>
                  {node.verified && (
                    <span className="flex items-center gap-1 text-cyan-400">
                      <ShieldCheck className="w-3 h-3" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-white tracking-tight">
                  {node.label}
                </div>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {node.detail}
                </p>

                {/* Bottom Active Glow Accent */}
                {isActive && (
                  <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Deep Dive Node Inspection Panel */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700/80 flex items-center justify-center shrink-0 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Telemetry Breakdown: {activeNode.label}
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed max-w-2xl">
                {activeNode.detail}. When recruiters search for talent, RYVOLT presents verified code commits, passing sandbox test fixtures, and mathematical match rubrics instead of unverified self-ratings.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Proof Hash: sha256:7f8e...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
