import React, { useState, useEffect } from 'react';
import {
  Send,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ChevronRight,
  Filter,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { recruiterService } from '../../services/recruiterService';
import { JobApplication, ApplicationStatus } from '../../types/database';
import { audioService } from '../../lib/audioService';

interface RecruiterApplicationsPipelineProps {
  onScheduleInterviewForApp?: (app: JobApplication) => void;
}

const PIPELINE_COLUMNS: { id: ApplicationStatus; label: string; color: string }[] = [
  { id: 'applied', label: 'Applied', color: 'border-slate-300 dark:border-slate-700' },
  { id: 'reviewing', label: 'Reviewing', color: 'border-amber-400 dark:border-amber-600' },
  { id: 'interview_scheduled', label: 'Interview', color: 'border-cyan-400 dark:border-cyan-600' },
  { id: 'interviewed', label: 'Interviewed', color: 'border-indigo-400 dark:border-indigo-600' },
  { id: 'offered', label: 'Offered', color: 'border-emerald-400 dark:border-emerald-600' },
  { id: 'rejected', label: 'Rejected', color: 'border-rose-400 dark:border-rose-600' },
];

export const RecruiterApplicationsPipeline: React.FC<RecruiterApplicationsPipelineProps> = ({
  onScheduleInterviewForApp,
}) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [statusUpdateNote, setStatusUpdateNote] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const apps = await recruiterService.getRecruiterApplications();
        setApplications(apps);
      } catch (err) {
        console.error('Failed to load recruiter applications:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: ApplicationStatus) => {
    audioService.playClick();
    await recruiterService.updateRecruiterApplicationStatus(appId, newStatus, statusUpdateNote);
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, status: newStatus });
    }
    setStatusUpdateNote('');
    audioService.playSubmitSuccess();
  };

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    const candidateName = app.candidate_profile?.display_name?.toLowerCase() || '';
    const jobTitle = app.job?.title?.toLowerCase() || '';
    return candidateName.includes(q) || jobTitle.includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Candidate Pipeline & Submissions
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review submissions, audit verified project artifacts, and progress candidates through structured hiring stages.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Dense List
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter pipeline by candidate name or position..."
          className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
        />
      </div>

      {/* Board View */}
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.map((col) => {
            const colApps = filteredApps.filter((a) => a.status === col.id);
            return (
              <div
                key={col.id}
                className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/60 dark:border-slate-800 flex flex-col min-w-[210px]"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/60 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {col.label}
                  </span>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className={`p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-xs hover:shadow-sm transition-all cursor-pointer space-y-2.5 ${col.color} border-l-4`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {app.candidate_profile?.display_name || 'Candidate'}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {app.match_score}%
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {app.job?.title}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                        <span>{new Date(app.applied_at).toLocaleDateString()}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </div>
                    </div>
                  ))}
                  {colApps.length === 0 && (
                    <div className="text-center py-8 text-[11px] text-slate-400 italic">
                      Empty stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              onClick={() => setSelectedApp(app)}
              className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shrink-0">
                  {app.candidate_profile?.display_name?.charAt(0) || 'C'}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {app.candidate_profile?.display_name || 'Candidate'}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {app.match_score}% Match
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {app.job?.title} • {app.job?.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 capitalize">
                  {app.status.replace('_', ' ')}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect & Transition Drawer Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-lg flex items-center justify-center">
                  {selectedApp.candidate_profile?.display_name?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedApp.candidate_profile?.display_name || 'Candidate'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Applying for: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedApp.job?.title}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xl font-semibold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Match Criteria & Notes */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-indigo-900 dark:text-indigo-300">
                    Career Twin Verified Match
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    Calculated deterministically against repository evidence.
                  </p>
                </div>
                <span className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {selectedApp.match_score}%
                </span>
              </div>

              {selectedApp.cover_letter && (
                <div>
                  <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-1">
                    Candidate Proof Statement
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-200/60 dark:border-slate-700/60">
                    {selectedApp.cover_letter}
                  </div>
                </div>
              )}

              {/* Status Transition Control */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                  Transition Pipeline Stage
                </h4>

                <div className="flex flex-wrap gap-2">
                  {PIPELINE_COLUMNS.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => handleUpdateStatus(selectedApp.id, col.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        selectedApp.status === col.id
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline Audit Events */}
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] mb-2">
                  Application Audit Trail ({selectedApp.timeline?.length || 0})
                </h4>
                <div className="space-y-2">
                  {(selectedApp.timeline || []).map((ev, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-white dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-[11px] flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                          [{ev.actor || 'system'}]
                        </span>{' '}
                        <span className="text-slate-600 dark:text-slate-400">{ev.note}</span>
                      </div>
                      <span className="text-slate-400 font-mono shrink-0 ml-2">
                        {new Date(ev.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              {onScheduleInterviewForApp && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onScheduleInterviewForApp(selectedApp);
                    setSelectedApp(null);
                  }}
                  leftIcon={<Calendar className="w-3.5 h-3.5" />}
                >
                  Schedule Technical Round
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApp(null)}
                className="ml-auto"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
