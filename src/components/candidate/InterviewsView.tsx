import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { interviewService } from '../../services/interviewService';
import { CandidateInterview, InterviewFormat, InterviewStatus } from '../../types/database';
import { Button } from '../ui/Button';
import {
  CalendarCheck,
  Video,
  Phone,
  Building2,
  Mic,
  Clock,
  Download,
  Plus,
  CheckCircle2,
  Calendar,
  ExternalLink,
  Sparkles,
  HelpCircle,
  FileText,
  ChevronRight,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface InterviewsViewProps {
  onOpenVoiceCoach?: () => void;
  onNavigateToApplications?: () => void;
}

export const InterviewsView: React.FC<InterviewsViewProps> = ({
  onOpenVoiceCoach,
  onNavigateToApplications,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'demo-candidate';

  const [interviews, setInterviews] = useState<CandidateInterview[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'prep_guide'>('upcoming');
  const [isLoading, setIsLoading] = useState(true);

  // New interview modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [roundName, setRoundName] = useState('Technical Systems Architecture');
  const [scheduledAt, setScheduledAt] = useState('');
  const [durationMin, setDurationMin] = useState(45);
  const [meetingLink, setMeetingLink] = useState('');
  const [format, setFormat] = useState<InterviewFormat>('video');
  const [prepNotes, setPrepNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadInterviews();
  }, [user]);

  const loadInterviews = async () => {
    setIsLoading(true);
    try {
      const data = await interviewService.getInterviews(currentUserId);
      setInterviews(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadIcs = (interview: CandidateInterview) => {
    const icsString = interviewService.generateIcsContent(interview);
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-${interview.company_name.toLowerCase().replace(/\s+/g, '-')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !jobTitle.trim() || !scheduledAt) {
      setFeedback({ message: 'Please complete all required fields.', type: 'error' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await interviewService.scheduleInterview({
        user_id: currentUserId,
        company_name: companyName.trim(),
        job_title: jobTitle.trim(),
        round_name: roundName.trim(),
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: Number(durationMin),
        meeting_link: meetingLink.trim() || null,
        format,
        status: 'scheduled',
        prep_notes: prepNotes.trim() || null,
        candidate_feedback: null,
      });

      setInterviews((prev) => [...prev, created].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));
      setIsModalOpen(false);
      setCompanyName('');
      setJobTitle('');
      setMeetingLink('');
      setPrepNotes('');
      setFeedback({ message: 'Interview added to schedule.', type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ message: 'Failed to record interview.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInterview = async (id: string) => {
    if (!confirm('Remove this interview entry?')) return;
    await interviewService.deleteInterview(id, currentUserId);
    setInterviews((prev) => prev.filter((i) => i.id !== id));
  };

  const upcomingInterviews = interviews.filter(
    (i) => i.status === 'scheduled' || new Date(i.scheduled_at).getTime() > Date.now()
  );
  const pastInterviews = interviews.filter(
    (i) => i.status === 'completed' || (i.status !== 'scheduled' && new Date(i.scheduled_at).getTime() <= Date.now())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Interview Management & Preparation
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage confirmed employer rounds, export calendar invitations, and practice technical questions with the AI Voice Coach.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVoiceCoach && (
            <button
              onClick={onOpenVoiceCoach}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold shadow-xs cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Practice Mock Interview</span>
            </button>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Record Interview
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Upcoming Confirmed ({upcomingInterviews.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'past'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Past & Completed ({pastInterviews.length})
        </button>
        <button
          onClick={() => setActiveTab('prep_guide')}
          className={`px-3.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            activeTab === 'prep_guide'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Preparation Checklist & Rubric
        </button>
      </div>

      {/* Tab 1: Upcoming Interviews */}
      {activeTab === 'upcoming' && (
        <div className="space-y-4">
          {upcomingInterviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-3">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No upcoming interviews scheduled
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When recruiters invite you to an interview, or when you receive a confirmed external round, record it here to track preparation.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => setIsModalOpen(true)}>
                  Record Interview
                </Button>
                {onOpenVoiceCoach && (
                  <Button size="sm" variant="primary" onClick={onOpenVoiceCoach}>
                    Start AI Mock Practice
                  </Button>
                )}
              </div>
            </div>
          ) : (
            upcomingInterviews.map((int) => {
              const dateObj = new Date(int.scheduled_at);

              return (
                <div
                  key={int.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 shadow-xs transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-mono">
                          {int.company_name}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="text-xs text-slate-500 capitalize">{int.format} round</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {int.round_name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Role: {int.job_title}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadIcs(int)}
                        leftIcon={<Download className="w-3.5 h-3.5" />}
                        title="Download .ics calendar event"
                      >
                        Add to Calendar
                      </Button>

                      {int.meeting_link && (
                        <a
                          href={int.meeting_link.startsWith('http') ? int.meeting_link : undefined}
                          onClick={() => {
                            if (int.meeting_link === '#voice-coach' && onOpenVoiceCoach) {
                              onOpenVoiceCoach();
                            }
                          }}
                          target={int.meeting_link.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Meeting</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>
                        {dateObj.toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        at {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({int.duration_minutes} min)
                      </span>
                    </div>

                    {int.prep_notes && (
                      <div className="sm:text-right text-slate-500 italic truncate">
                        Notes: {int.prep_notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Past Interviews */}
      {activeTab === 'past' && (
        <div className="space-y-4">
          {pastInterviews.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-500">
              No completed interviews recorded.
            </div>
          ) : (
            pastInterviews.map((int) => (
              <div
                key={int.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-5 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {int.company_name} — {int.round_name}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {new Date(int.scheduled_at).toLocaleDateString()} · {int.job_title}
                    </p>
                  </div>

                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    Completed
                  </span>
                </div>

                {int.candidate_feedback && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-semibold text-slate-700 dark:text-slate-200">Feedback Notes: </span>
                    {int.candidate_feedback}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Prep Rubric & Checklist */}
      {activeTab === 'prep_guide' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 shadow-xs">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Systems Architecture Interview Checklist
            </h3>
            <p className="text-xs text-slate-500">
              Best practices calibrated for tier-1 engineering interviews.
            </p>
          </div>

          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white">1. Clarify Non-Functional Requirements First</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Always state explicit latency bounds (p99 &lt; 50ms), throughput goals (e.g. 50k writes/sec), durability levels (zero data loss via WAL), and partition tolerance assumptions before diagramming.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white">2. Address Failure Modes Proactively</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Explain how your cluster recovers when the leader crashes mid-commit, when network splits isolate quorum nodes, and how disk write-ahead log replay guarantees linearizability.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white">3. Cite Concrete Artifact Evidence</h4>
              <p className="text-slate-600 dark:text-slate-400">
                Reference your RYVOLT Career Twin repositories and BuildLab commit attestations to ground theoretical discussions in concrete production code.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Record Interview Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Record Scheduled Interview
            </h3>

            <form onSubmit={handleCreateInterview} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Nexus Cloud Fabric"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Distributed Systems Engineer"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Round Title / Stage *
                </label>
                <input
                  type="text"
                  required
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="e.g. System Design & Concurrency"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value as InterviewFormat)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="video">Video Call</option>
                    <option value="phone">Phone Call</option>
                    <option value="onsite">Onsite</option>
                    <option value="ai_mock">AI Voice Mock</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Meeting Link (Optional)
                </label>
                <input
                  type="text"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button size="sm" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="primary" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Recording...' : 'Save Interview'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
