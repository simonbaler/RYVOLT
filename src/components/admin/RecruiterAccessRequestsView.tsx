import React, { useState, useEffect } from 'react';
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ExternalLink,
  Mail,
  User,
  Users,
  AlertTriangle,
  RefreshCw,
  Filter,
  Check,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { adminService } from '../../services/adminService';
import { RecruiterAccessRequest } from '../../types/database';
import { audioService } from '../../lib/audioService';

export const RecruiterAccessRequestsView: React.FC = () => {
  const [requests, setRequests] = useState<RecruiterAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRequest, setSelectedRequest] = useState<RecruiterAccessRequest | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [targetReq, setTargetReq] = useState<RecruiterAccessRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await adminService.getRecruiterAccessRequests();
      setRequests(data);
    } catch {
      setActionNotice({ type: 'error', message: 'Failed to load access requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async () => {
    if (!targetReq) return;
    setIsProcessing(true);
    try {
      const res = await adminService.reviewRecruiterAccessRequest(targetReq.id, 'approve');
      if (res.success) {
        audioService.playSubmitSuccess();
        setActionNotice({
          type: 'success',
          message: `Access granted for ${targetReq.full_name} (${targetReq.company_name}). Recruiter workspace permissions provisioned.`,
        });
        setRequests((prev) =>
          prev.map((r) =>
            r.id === targetReq.id
              ? { ...r, status: 'approved', reviewed_at: new Date().toISOString() }
              : r
          )
        );
        setShowApproveModal(false);
        setTargetReq(null);
      } else {
        setActionNotice({ type: 'error', message: res.error || 'Approval failed.' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!targetReq) return;
    setIsProcessing(true);
    try {
      const res = await adminService.reviewRecruiterAccessRequest(targetReq.id, 'reject', rejectionReason);
      if (res.success) {
        audioService.playClick();
        setActionNotice({
          type: 'success',
          message: `Access request from ${targetReq.full_name} has been marked as rejected.`,
        });
        setRequests((prev) =>
          prev.map((r) =>
            r.id === targetReq.id
              ? { ...r, status: 'rejected', rejection_reason: rejectionReason, reviewed_at: new Date().toISOString() }
              : r
          )
        );
        setShowRejectModal(false);
        setTargetReq(null);
        setRejectionReason('');
      } else {
        setActionNotice({ type: 'error', message: res.error || 'Rejection failed.' });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      r.full_name.toLowerCase().includes(q) ||
      r.company_name.toLowerCase().includes(q) ||
      r.work_email.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Recruiter & Enterprise Access Queue
            </h1>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review employer credential applications, verify corporate domains, and provision authorized Recruiter Workspaces.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadRequests}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          className="text-xs self-start sm:self-center"
        >
          Refresh Queue
        </Button>
      </div>

      {/* Action Notification */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="font-bold hover:underline cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="sm:col-span-3 flex items-center gap-2 px-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by recruiter name, employer, or work email..."
            className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700"
          >
            <option value="all">All Request Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Requests Queue Cards */}
      <div className="space-y-4">
        {filtered.map((req) => (
          <div
            key={req.id}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md">
                  <Building2 className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {req.company_name}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        req.status === 'approved'
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : req.status === 'rejected'
                          ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 animate-pulse'
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Applicant: <span className="font-semibold text-slate-800 dark:text-slate-200">{req.full_name}</span>
                    {req.job_title ? ` (${req.job_title})` : ''}
                  </p>
                </div>
              </div>

              {/* Action buttons if pending */}
              {req.status === 'pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setTargetReq(req);
                      setShowApproveModal(true);
                    }}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Approve & Grant Role
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTargetReq(req);
                      setShowRejectModal(true);
                    }}
                    leftIcon={<X className="w-3.5 h-3.5 text-rose-500" />}
                    className="text-xs border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>

            {/* Details Box */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono truncate">{req.work_email}</span>
              </div>

              {req.company_website && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <a
                    href={req.company_website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                  >
                    {req.company_website}
                  </a>
                </div>
              )}

              {req.team_size && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Team: {req.team_size}</span>
                </div>
              )}
            </div>

            {/* Use case quote */}
            {req.use_case && (
              <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 text-xs text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-indigo-700 dark:text-indigo-400 block mb-1">
                  Hiring Intent & Proof Scope:
                </span>
                <p className="italic">"{req.use_case}"</p>
              </div>
            )}

            {/* Rejection notice if present */}
            {req.status === 'rejected' && req.rejection_reason && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
                <span className="font-semibold">Rejection Note: </span>
                <span>{req.rejection_reason}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Submitted: {new Date(req.created_at).toLocaleString()}</span>
              {req.reviewed_at && (
                <span>Reviewed: {new Date(req.reviewed_at).toLocaleString()}</span>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No requests found</p>
            <p className="text-xs text-slate-400 mt-1">No access applications match the current filter parameters.</p>
          </div>
        )}
      </div>

      {/* Approve Confirmation Modal */}
      {showApproveModal && targetReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Approve Recruiter Access
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Confirm promoting <span className="font-semibold text-slate-900 dark:text-white">{targetReq.full_name}</span> ({targetReq.work_email}) to the <span className="font-semibold text-indigo-600">Recruiter</span> role for <span className="font-semibold text-slate-900 dark:text-white">{targetReq.company_name}</span>?
            </p>

            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700">
              <li>✓ Assigns <code className="text-indigo-600">recruiter</code> role in public.user_roles</li>
              <li>✓ Provisions verified organization "{targetReq.company_name}"</li>
              <li>✓ Grants access to post jobs and view candidate project proofs</li>
            </ul>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowApproveModal(false);
                  setTargetReq(null);
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isProcessing ? 'Provisioning...' : 'Confirm Approval'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && targetReq && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
              <XCircle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Reject Access Request
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Provide an administrative rationale for declining the request from <span className="font-semibold">{targetReq.full_name}</span>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Rejection
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Unverifiable corporate email domain, insufficient company proof, or duplicate submission..."
                className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowRejectModal(false);
                  setTargetReq(null);
                }}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleReject}
                disabled={isProcessing}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isProcessing ? 'Rejecting...' : 'Reject Application'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
