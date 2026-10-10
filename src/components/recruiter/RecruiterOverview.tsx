import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  FileCheck2,
  CalendarCheck,
  TrendingUp,
  Plus,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { recruiterService } from '../../services/recruiterService';
import { Job, JobApplication, RecruiterShortlist, InterviewStage } from '../../types/database';
import { audioService } from '../../lib/audioService';

interface RecruiterOverviewProps {
  onNavigateTab: (tabId: string) => void;
  onSelectCandidate?: (candidateId: string) => void;
}

export const RecruiterOverview: React.FC<RecruiterOverviewProps> = ({
  onNavigateTab,
}) => {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [shortlists, setShortlists] = useState<RecruiterShortlist[]>([]);
  const [interviews, setInterviews] = useState<InterviewStage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [apps, sls, ints] = await Promise.all([
          recruiterService.getRecruiterApplications(),
          recruiterService.getShortlists('recruiter-active'),
          recruiterService.getInterviews('recruiter-active'),
        ]);
        setApplications(apps);
        setShortlists(sls);
        setInterviews(ints);
      } catch (err) {
        console.error('Failed to load recruiter overview data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingReviews = applications.filter((a) => a.status === 'applied' || a.status === 'reviewing');
  const scheduledInterviews = interviews.filter((i) => i.status === 'scheduled');
  const offersExtended = applications.filter((a) => a.status === 'offered');

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner / Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white border border-indigo-900/50 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deterministic Talent Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Recruiter Command Console
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Zero hallucinated summaries. Evaluate candidates based on verified repository architectures, automated test suites, and deterministic Career Twin skill graphs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                audioService.playClick();
                onNavigateTab('post-job');
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Post Technical Requisition
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                audioService.playClick();
                onNavigateTab('discover-candidates');
              }}
              leftIcon={<Search className="w-4 h-4 text-cyan-400" />}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              Discover Candidates
            </Button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Candidate Queue</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {applications.length}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Verified Submissions</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Across all published requisitions</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {pendingReviews.length}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Action Required</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Submissions waiting for evaluation</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scheduled Rounds</span>
            <CalendarCheck className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {scheduledInterviews.length}
            </span>
            <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Upcoming</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">System design & architecture rounds</p>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Offers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {offersExtended.length}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Top Tier</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Candidates with validated proof</p>
        </div>
      </div>

      {/* Main Dual Grid: Active Applications & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Applications for Review */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Candidate Submissions</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Applications ranked by verified match criteria</p>
            </div>
            <button
              onClick={() => {
                audioService.playClick();
                onNavigateTab('recruiter-applications');
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All Pipeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.slice(0, 4).map((app) => (
              <div
                key={app.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {app.candidate_profile?.display_name?.charAt(0) || 'C'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {app.candidate_profile?.display_name || 'Candidate'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {app.match_score}% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      Applied for: <span className="font-medium text-slate-700 dark:text-slate-300">{app.job?.title}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  <span
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg capitalize ${
                      app.status === 'reviewing'
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : app.status === 'interview_scheduled'
                        ? 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                        : app.status === 'offered'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {app.status.replace('_', ' ')}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      audioService.playClick();
                      onNavigateTab('recruiter-applications');
                    }}
                    className="text-xs h-7 px-2.5"
                  >
                    Inspect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Scheduled Technical Interviews & Shortlists */}
        <div className="space-y-6">
          {/* Upcoming Interview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-indigo-500" />
                <span>Upcoming Interviews</span>
              </h3>
              <button
                onClick={() => {
                  audioService.playClick();
                  onNavigateTab('interviews');
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Schedule
              </button>
            </div>

            <div className="space-y-3">
              {interviews.map((int) => (
                <div
                  key={int.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {int.candidate_profile?.display_name || 'Candidate'}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800 uppercase">
                      {int.round_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Interviewer: <span className="text-slate-700 dark:text-slate-300 font-medium">{int.interviewer_name}</span>
                  </p>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(int.scheduled_at).toLocaleDateString()} at {new Date(int.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hiring Shortlists Summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 space-y-4 shadow-xs transition-colors">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Shortlists</h3>
              <button
                onClick={() => {
                  audioService.playClick();
                  onNavigateTab('shortlists');
                }}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Manage
              </button>
            </div>

            <div className="space-y-2">
              {shortlists.map((sl) => (
                <div
                  key={sl.id}
                  onClick={() => {
                    audioService.playClick();
                    onNavigateTab('shortlists');
                  }}
                  className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer flex items-center justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{sl.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {sl.candidate_ids.length} candidates bookmarked
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
