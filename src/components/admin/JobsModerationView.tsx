import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  ShieldCheck,
  RefreshCw,
  Clock,
  DollarSign,
  Building2,
  FileCheck,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { adminService } from '../../services/adminService';
import { Job } from '../../types/database';

export const JobsModerationView: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getJobsForModeration(statusFilter);
      setJobs(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const handleUpdateStatus = async (jobId: string, newStatus: 'published' | 'draft' | 'closed', reason: string) => {
    setIsProcessing(true);
    try {
      await adminService.setJobModerationStatus(jobId, newStatus, reason);
      setNotice(`Requisition status updated to "${newStatus}".`);
      loadJobs();
      if (selectedJob?.id === jobId) {
        setSelectedJob({ ...selectedJob, status: newStatus });
      }
    } catch {
      setNotice('Failed to update job status.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = jobs.filter((j) => {
    const q = search.toLowerCase();
    return j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-indigo-500" />
            <span>Requisitions Moderation & Anti-Spam Governance</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit employer job requisitions to enforce transparent salary ranges, verifiable code proof requirements, and anti-ghosting policies.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadJobs}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          className="text-xs"
        >
          Refresh Requisitions
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

      {/* Filter and Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="sm:col-span-2 flex items-center gap-2 px-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requisitions by title or employer..."
            className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700"
          >
            <option value="all">All States</option>
            <option value="published">Published</option>
            <option value="draft">Draft / Under Review</option>
            <option value="closed">Closed / Expired</option>
          </select>
        </div>
      </div>

      {/* Jobs Listing */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filtered.map((job) => (
          <div
            key={job.id}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white">{job.title}</span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize font-semibold ${
                    job.status === 'published'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : job.status === 'draft'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {job.status}
                </span>

                <span className="text-[10px] font-mono text-slate-400 capitalize">
                  {job.employment_type} • {job.experience_level}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                {job.company} • {job.department} •{' '}
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                </span>
              </p>

              <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  Required Proof Criteria: {job.evidence_criteria?.[0]?.label || 'Production code repository with benchmark test'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedJob(job)}
                className="text-xs h-8 px-3"
              >
                Inspect Details
              </Button>

              {job.status === 'published' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateStatus(job.id, 'closed', 'Administrative closure')}
                  disabled={isProcessing}
                  className="text-xs h-8 px-3 text-rose-600 hover:bg-rose-50 border-rose-200"
                >
                  Unpublish / Close
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleUpdateStatus(job.id, 'published', 'Passed moderation audit')}
                  disabled={isProcessing}
                  className="text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve & Publish
                </Button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-12 text-xs text-slate-400">
            No requisitions found matching current filter.
          </div>
        )}
      </div>

      {/* Requisition Inspection Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scaleUp max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedJob.title}</h3>
                <p className="text-xs text-slate-400">{selectedJob.company} • ID: {selectedJob.id}</p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Description Overview</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedJob.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Required Skills</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedJob.required_skills?.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono text-[10px]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400">Compensation Transparency</span>
                <p className="font-mono text-slate-800 dark:text-slate-200">
                  ${selectedJob.salary_min?.toLocaleString()} - ${selectedJob.salary_max?.toLocaleString()} USD (Transparent band required)
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setSelectedJob(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
