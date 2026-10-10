import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Kanban,
  ListFilter,
  MapPin,
  Mic,
  MoreVertical,
  Plus,
  RotateCcw,
  Sparkles,
  UserCheck,
  XCircle,
  FileText,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Award,
  ChevronRight,
  X,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { jobService } from '../../services/jobService';
import { useAuth } from '../../contexts/AuthContext';
import {
  JobApplication,
  ApplicationStatus,
  ApplicationTimelineEvent,
  Job,
} from '../../types/database';
import { VoiceCoachModal } from '../voice/VoiceCoachModal';

export interface ApplicationTrackerViewProps {
  onNavigateToJobs?: () => void;
  onNavigateToResumeStudio?: () => void;
}

const STAGES: { id: ApplicationStatus; label: string; color: string; bg: string }[] = [
  { id: 'applied', label: 'Applied', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  { id: 'reviewing', label: 'Reviewing', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  { id: 'interview_scheduled', label: 'Interview Scheduled', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  { id: 'interviewed', label: 'Interviewed', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200' },
  { id: 'offered', label: 'Offer Received', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  { id: 'rejected', label: 'Archived / Rejected', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' },
];

export const ApplicationTrackerView: React.FC<ApplicationTrackerViewProps> = ({
  onNavigateToJobs,
  onNavigateToResumeStudio,
}) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Voice Coach Modal
  const [voiceCoachOpen, setVoiceCoachOpen] = useState(false);
  const [voiceCoachJob, setVoiceCoachJob] = useState<Job | null>(null);

  // Feedback toast
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadApplications();
  }, [user]);

  const loadApplications = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await jobService.getApplications(user.id);
      setApplications(data);
    } catch (e: any) {
      console.error('Error loading applications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (
    applicationId: string,
    newStatus: ApplicationStatus,
    note?: string
  ) => {
    if (!user) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await jobService.updateApplicationStatus(
        user.id,
        applicationId,
        newStatus,
        note
      );
      if (updated) {
        setApplications((prev) =>
          prev.map((a) => (a.id === applicationId ? updated : a))
        );
        if (selectedApp && selectedApp.id === applicationId) {
          setSelectedApp(updated);
        }
        setFeedback({
          type: 'success',
          message: `Application advanced to ${newStatus.replace('_', ' ').toUpperCase()}`,
        });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Failed to update status' });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await jobService.withdrawApplication(user.id, applicationId);
      loadApplications();
      setSelectedApp(null);
      setFeedback({ type: 'success', message: 'Application withdrawn.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      // Ignore
    }
  };

  // Metrics
  const totalApps = applications.length;
  const inPipeline = applications.filter(
    (a) => a.status === 'reviewing' || a.status === 'interview_scheduled' || a.status === 'interviewed'
  ).length;
  const offersCount = applications.filter((a) => a.status === 'offered').length;
  const avgMatch =
    totalApps > 0
      ? Math.round(applications.reduce((acc, a) => acc + (a.match_score || 0), 0) / totalApps)
      : 0;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <span>Career Advancement Engine</span>
            <span>·</span>
            <span>Real-time Status Tracking</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Application Pipeline Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track interview rounds, recruiter responses, and telemetry for every role you applied to.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200/80">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {onNavigateToJobs && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToJobs}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Explore Jobs
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Submitted
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalApps}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Verified requisitions</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
            In Active Rounds
          </div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">{inPipeline}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Review or interview scheduled</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
            Offers Extended
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{offersCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for evaluation</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm">
          <div className="text-[11px] font-semibold text-cyan-600 uppercase tracking-wider">
            Avg Twin Match
          </div>
          <div className="text-2xl font-extrabold text-cyan-700 mt-1">
            {avgMatch > 0 ? `${avgMatch}%` : '--'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Competency fit score</div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 shadow-sm animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Content: Kanban or List */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading your candidate application pipeline...</p>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No applications submitted yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Discover technical opportunities scored directly against your Career Twin skills and submit with one click.
          </p>
          {onNavigateToJobs && (
            <Button
              variant="primary"
              size="sm"
              onClick={onNavigateToJobs}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="mt-2"
            >
              Browse Open Requisitions
            </Button>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageApps = applications.filter((a) => a.status === stage.id);
            return (
              <div
                key={stage.id}
                className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-w-[240px] max-w-full"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold ${stage.color}`}>{stage.label}</span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center">
                    {stageApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[640px]">
                  {stageApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {app.job?.title || 'Engineering Role'}
                        </h4>
                        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                          {app.match_score}%
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span className="font-semibold text-slate-800 line-clamp-1">
                          {app.job?.company || 'Company'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(app.applied_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>

                        {/* Interview voice prep shortcut */}
                        {(app.status === 'interview_scheduled' || app.status === 'reviewing') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setVoiceCoachJob(app.job || null);
                              setVoiceCoachOpen(true);
                            }}
                            className="text-cyan-700 hover:text-cyan-800 font-bold flex items-center gap-1 cursor-pointer"
                            title="Practice interview for this role"
                          >
                            <Mic className="w-3 h-3" /> Prep
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {stageApps.length === 0 && (
                    <div className="py-8 text-center text-[11px] text-slate-400 italic">
                      No applications in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Requisition & Company</th>
                  <th className="p-4">Match Fit</th>
                  <th className="p-4">Current Stage</th>
                  <th className="p-4">Applied Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{app.job?.title || 'Engineering Role'}</div>
                      <div className="text-[11px] text-slate-500">{app.job?.company} · {app.job?.location}</div>
                    </td>
                    <td className="p-4">
                      <span className="font-extrabold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                        {app.match_score}% Match
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 uppercase tracking-wider">
                        {app.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(app.applied_at).toLocaleDateString([], {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setVoiceCoachJob(app.job || null);
                            setVoiceCoachOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 text-cyan-300 text-[11px] font-semibold hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Mic className="w-3 h-3 text-cyan-400" /> Prep
                        </button>
                        <button
                          onClick={() => setSelectedApp(app)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* APPLICATION DETAILS & TIMELINE MODAL */}
      {/* ==================================================================== */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden text-slate-900">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedApp.job?.title || 'Application Details'}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-800">
                    {selectedApp.match_score}% Match
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedApp.job?.company} · Applied on{' '}
                  {new Date(selectedApp.applied_at).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
              {/* Advance Status Control */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Pipeline Stage
                  </span>
                  <span className="font-semibold text-indigo-700 capitalize">
                    Current: {selectedApp.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {STAGES.map((s) => (
                    <button
                      key={s.id}
                      disabled={isUpdatingStatus || selectedApp.status === s.id}
                      onClick={() => handleUpdateStatus(selectedApp.id, s.id)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                        selectedApp.status === s.id
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Interview Prep Button */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                <div>
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span>Practice for Interview Round</span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Launch voice-enabled AI roleplay customized to {selectedApp.job?.title}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setVoiceCoachJob(selectedApp.job || null);
                    setVoiceCoachOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-colors cursor-pointer text-xs"
                >
                  Start Audio Session
                </button>
              </div>

              {/* Cover Letter / Notes */}
              {selectedApp.cover_letter && (
                <div className="space-y-1.5">
                  <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Attached Candidate Note
                  </div>
                  <p className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed">
                    {selectedApp.cover_letter}
                  </p>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="space-y-3">
                <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Application Lifecycle Events</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {selectedApp.timeline?.length || 1} recorded
                  </span>
                </div>

                <div className="space-y-2 border-l-2 border-slate-200 ml-2 pl-4">
                  {(selectedApp.timeline || []).map((event, idx) => (
                    <div key={idx} className="relative space-y-0.5">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white" />
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 capitalize">
                          {event.status.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(event.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600">{event.note}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Custom Note Form */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Add Private Candidate Note / Interview Log
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="e.g., Completed round 2 with hiring manager; discussed Raft replication..."
                    className="flex-1 p-2 rounded-xl border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!newNoteText.trim() || isUpdatingStatus}
                    onClick={async () => {
                      if (!newNoteText.trim()) return;
                      await handleUpdateStatus(
                        selectedApp.id,
                        selectedApp.status,
                        newNoteText.trim()
                      );
                      setNewNoteText('');
                    }}
                  >
                    Save Note
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleWithdraw(selectedApp.id)}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
              >
                Withdraw Application
              </button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedApp(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Coach Modal */}
      <VoiceCoachModal
        isOpen={voiceCoachOpen}
        onClose={() => setVoiceCoachOpen(false)}
        initialJob={voiceCoachJob}
        initialMode="mock_interview"
        context={{
          targetRole: voiceCoachJob?.title || 'Senior Distributed Systems Engineer',
          jobTitle: voiceCoachJob?.title,
          companyName: voiceCoachJob?.company,
          jobRequirements: voiceCoachJob?.requirements,
        }}
      />
    </div>
  );
};
