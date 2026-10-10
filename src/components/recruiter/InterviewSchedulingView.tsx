import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Clock,
  User,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Star,
  FileText,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { recruiterService } from '../../services/recruiterService';
import { InterviewStage, InterviewRoundType } from '../../types/database';
import { audioService } from '../../lib/audioService';

interface InterviewSchedulingViewProps {
  initialCandidate?: any;
}

export const InterviewSchedulingView: React.FC<InterviewSchedulingViewProps> = ({
  initialCandidate,
}) => {
  const [interviews, setInterviews] = useState<InterviewStage[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [candidateName, setCandidateName] = useState(initialCandidate?.display_name || '');
  const [roundType, setRoundType] = useState<InterviewRoundType>('system_design');
  const [scheduledDate, setScheduledDate] = useState('2026-10-14T15:00');
  const [interviewerName, setInterviewerName] = useState('Staff Infrastructure Architect');
  const [scorecardNotes, setScorecardNotes] = useState(
    'Assess distributed consensus trade-offs, Raft log compaction, and Linux kernel memory barriers.'
  );

  useEffect(() => {
    async function load() {
      const data = await recruiterService.getInterviews('recruiter-active');
      setInterviews(data);
    }
    load();
  }, []);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await recruiterService.scheduleInterview({
      applicationId: 'app-seed-rec-1',
      jobId: 'job-seed-1',
      recruiterId: 'recruiter-active',
      candidateId: initialCandidate?.id || 'cand-seed-1',
      roundType,
      scheduledAt: new Date(scheduledDate).toISOString(),
      interviewerName,
      notes: scorecardNotes,
    });

    audioService.playSubmitSuccess();
    setInterviews([created, ...interviews]);
    setShowScheduleModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Technical Evaluation & Interviews
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Structured scorecards, artifact evaluation rounds, and technical engineering interviews.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowScheduleModal(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Schedule Evaluation Round
        </Button>
      </div>

      {/* Interviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {interviews.map((int) => (
          <div
            key={int.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                  {int.round_type.replace(/_/g, ' ')}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-2">
                  {int.candidate_profile?.display_name || 'Candidate'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Role: <span className="font-medium text-slate-700 dark:text-slate-300">{int.job?.title}</span>
                </p>
              </div>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                  int.status === 'completed'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {int.status}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Interviewer:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{int.interviewer_name}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Scheduled Time:</span>
                <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  {new Date(int.scheduled_at).toLocaleDateString()} at{' '}
                  {new Date(int.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {int.rating && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span>Scorecard Rating:</span>
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{int.rating} / 5</span>
                  </div>
                </div>
              )}
            </div>

            {int.scorecard_notes && (
              <div>
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Focus & Scorecard Notes:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {int.scorecard_notes}
                </p>
              </div>
            )}

            {int.evidence_evaluated && int.evidence_evaluated.length > 0 && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                  Artifacts Evaluated in Round:
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {int.evidence_evaluated.map((ev) => (
                    <span
                      key={ev}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300"
                    >
                      {ev}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-500" />
              <span>Schedule Technical Round</span>
            </h3>

            <form onSubmit={handleScheduleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Round Type
                </label>
                <select
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value as InterviewRoundType)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="screening">Technical Screening</option>
                  <option value="system_design">System Design & Distributed Primitives</option>
                  <option value="coding_challenge">Pair Coding & Sandbox Challenge</option>
                  <option value="architecture_deep_dive">Architecture Deep Dive</option>
                  <option value="behavioral">Engineering Principles & Leadership</option>
                  <option value="executive">Executive & Vision</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lead Interviewer Name
                </label>
                <input
                  type="text"
                  required
                  value={interviewerName}
                  onChange={(e) => setInterviewerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Scheduled Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Evaluation Criteria & Scorecard Notes
                </label>
                <textarea
                  rows={3}
                  value={scorecardNotes}
                  onChange={(e) => setScorecardNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Confirm Schedule
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
