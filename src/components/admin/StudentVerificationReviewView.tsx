import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  User,
  Building,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { adminService } from '../../services/adminService';
import { StudentVerification } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

export const StudentVerificationReviewView: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [verifications, setVerifications] = useState<StudentVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'verified' | 'rejected' | 'all'>('pending');
  const [selectedVerif, setSelectedVerif] = useState<StudentVerification | null>(null);

  // Decision Modal state
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<'verified' | 'rejected' | 'action_required'>('verified');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getStudentVerificationQueue(statusFilter);
      setVerifications(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleOpenDecision = (v: StudentVerification, type: 'verified' | 'rejected' | 'action_required') => {
    setSelectedVerif(v);
    setDecisionType(type);
    setReviewerNotes(
      type === 'verified'
        ? 'Confirmed student enrollment and academic standing via registrar evidence document.'
        : type === 'rejected'
        ? 'Submitted document does not show valid enrollment dates or student identification number.'
        : 'Please upload a formal registrar letter with clear graduation year and seal.'
    );
    setDecisionModalOpen(true);
  };

  const handleExecuteDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVerif) return;

    setIsSubmitting(true);
    setNotice(null);
    try {
      await adminService.reviewStudentVerification(
        selectedVerif.id,
        decisionType,
        reviewerNotes,
        currentAdmin?.id
      );

      setNotice({
        type: 'success',
        message: `Student verification record marked as "${decisionType}" successfully.`,
      });
      setDecisionModalOpen(false);
      loadData();
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err?.message || 'Failed to submit review decision.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-amber-500" />
            <span>Student Verification Review Center</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authoritative evaluation queue for candidate academic credentials, institutional enrollment verification, and verified student badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            notice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-bold hover:underline">
            ✕
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
        {(['pending', 'verified', 'rejected', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
              statusFilter === tab
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60'
            }`}
          >
            {tab} Requests
          </button>
        ))}
      </div>

      {/* Verification Queue List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {verifications.map((v) => (
          <div
            key={v.id}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-xs text-slate-900 dark:text-white">
                  {v.institution}
                </span>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize font-semibold ${
                    v.status === 'verified'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : v.status === 'rejected'
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : v.status === 'action_required'
                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800'
                  }`}
                >
                  {v.status}
                </span>

                <span className="text-[10px] font-mono text-slate-400">
                  Class of {v.expected_graduation_year}
                </span>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-center gap-4">
                <span>Degree: <strong className="text-slate-900 dark:text-white">{v.degree}</strong></span>
                <span>Department: <strong className="text-slate-900 dark:text-white">{v.department}</strong></span>
                {v.student_id_number && (
                  <span>Student ID: <code className="font-mono text-indigo-600 dark:text-indigo-400">{v.student_id_number}</code></span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span>User: {v.user_id.slice(0, 8)}...</span>
                <span>Submitted: {new Date(v.submitted_at).toLocaleString()}</span>
                {v.reviewed_at && <span>Reviewed: {new Date(v.reviewed_at).toLocaleDateString()}</span>}
              </div>

              {v.reviewer_notes && (
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Reviewer Notes: </span>
                  {v.reviewer_notes}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
              {v.evidence_url && (
                <a
                  href={v.evidence_url}
                  download={v.evidence_file_name || 'student-evidence.pdf'}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Inspect Evidence</span>
                </a>
              )}

              {v.status === 'pending' ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenDecision(v, 'verified')}
                    className="text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDecision(v, 'rejected')}
                    className="text-xs h-8 px-3 text-rose-600 hover:bg-rose-50 border-rose-200"
                  >
                    Reject
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenDecision(v, v.status === 'verified' ? 'rejected' : 'verified')}
                  className="text-xs h-8 px-3"
                >
                  Change Decision
                </Button>
              )}
            </div>
          </div>
        ))}

        {verifications.length === 0 && !loading && (
          <div className="text-center py-12 text-xs text-slate-400">
            No verification requests in "{statusFilter}" state.
          </div>
        )}
      </div>

      {/* Decision Review Modal */}
      {decisionModalOpen && selectedVerif && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-amber-500" />
              <span>Record Student Verification Decision</span>
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Recording a decision for <strong>{selectedVerif.institution}</strong>. This updates the candidate's profile badges and audit trail.
            </p>

            <form onSubmit={handleExecuteDecision} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Verification Decision
                </label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-200 dark:border-slate-700"
                >
                  <option value="verified">Approve & Grant Verified Student Badge</option>
                  <option value="rejected">Reject (Invalid or Unreadable Evidence)</option>
                  <option value="action_required">Action Required (Request Resubmission)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Authoritative Reviewer Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Detail the reasoning or document confirmation reference..."
                  className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg p-2.5 border border-slate-200 dark:border-slate-700 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  className={decisionType === 'verified' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
