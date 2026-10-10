import React, { useState, useEffect } from 'react';
import {
  Flag,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Filter,
  RefreshCw,
  UserX,
  FileX,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { adminService } from '../../services/adminService';
import {
  PlatformModerationReport,
  ModerationReportStatus,
  ModerationAction,
} from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

export const ContentModerationQueueView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [reports, setReports] = useState<PlatformModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ModerationReportStatus | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<PlatformModerationReport | null>(null);

  // Resolution Modal
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [actionChoice, setActionChoice] = useState<ModerationAction>('warned');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getModerationReports(statusFilter);
      setReports(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenResolution = (r: PlatformModerationReport) => {
    setSelectedReport(r);
    setActionChoice('warned');
    setResolutionNotes('Reviewed user report and addressed content according to platform safety policy.');
    setResolutionModalOpen(true);
  };

  const handleExecuteResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setIsSubmitting(true);
    try {
      await adminService.resolveModerationReport(
        selectedReport.id,
        actionChoice,
        resolutionNotes,
        currentAdmin?.id
      );

      setNotice(`Moderation report resolution recorded: "${actionChoice}".`);
      setResolutionModalOpen(false);
      loadData();
    } catch {
      setNotice('Failed to resolve moderation report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Flag className="w-6 h-6 text-rose-500" />
            <span>Content Moderation & Community Safety</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Investigate community abuse reports across profiles, posts, comments, job requisitions, and messages with full audit tracking.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          className="text-xs"
        >
          Refresh Queue
        </Button>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        {(['pending', 'under_review', 'resolved', 'dismissed', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              statusFilter === tab
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
            }`}
          >
            {tab.replace('_', ' ')} Reports
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {reports.map((r) => (
          <div
            key={r.id}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase text-rose-600 dark:text-rose-400">
                  [{r.category}]
                </span>

                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Target: {r.target_resource_type.toUpperCase()} ({r.target_resource_id})
                </span>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize font-semibold ${
                    r.status === 'pending'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : r.status === 'resolved'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {r.status}
                </span>

                {r.resolution_action && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Action: {r.resolution_action}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                Reason: "{r.reason}"
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>Reporter: {r.reporter_id.slice(0, 8)}...</span>
                <span>Submitted: {new Date(r.created_at).toLocaleString()}</span>
                {r.resolved_at && <span>Resolved: {new Date(r.resolved_at).toLocaleDateString()}</span>}
              </div>

              {r.resolution_notes && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Resolution Notes: </span>
                  {r.resolution_notes}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {r.status === 'pending' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleOpenResolution(r)}
                  className="text-xs h-8 px-3 bg-indigo-600 hover:bg-indigo-700"
                >
                  Take Action
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenResolution(r)}
                  className="text-xs h-8 px-3"
                >
                  Edit Resolution
                </Button>
              )}
            </div>
          </div>
        ))}

        {reports.length === 0 && !loading && (
          <div className="text-center py-12 text-xs text-slate-400">
            No moderation reports in "{statusFilter}" state.
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolutionModalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-500" />
              <span>Record Moderation Action</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Target resource: <strong>{selectedReport.target_resource_type}</strong> ({selectedReport.target_resource_id}).
            </p>

            <form onSubmit={handleExecuteResolution} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Enforcement Action
                </label>
                <select
                  value={actionChoice}
                  onChange={(e) => setActionChoice(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-200 dark:border-slate-700"
                >
                  <option value="warned">Warn User / Formal Notice</option>
                  <option value="content_removed">Remove Offending Content</option>
                  <option value="user_suspended">Suspend User Account</option>
                  <option value="dismissed">Dismiss Report (No Violation Found)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Notes & Rationale
                </label>
                <textarea
                  required
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Detail the safety guidelines applied and findings..."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResolutionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Recording...' : 'Enforce Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
