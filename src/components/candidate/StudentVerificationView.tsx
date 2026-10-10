import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { studentVerificationService } from '../../services/studentVerificationService';
import { StudentVerification, StudentVerificationStatus } from '../../types/database';
import { Button } from '../ui/Button';
import {
  GraduationCap,
  ShieldCheck,
  Clock,
  AlertTriangle,
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
  FileCheck,
  RefreshCw,
  Info,
} from 'lucide-react';

interface StudentVerificationViewProps {
  onBackToProfile?: () => void;
}

export const StudentVerificationView: React.FC<StudentVerificationViewProps> = ({
  onBackToProfile,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'demo-candidate';

  const [verification, setVerification] = useState<StudentVerification | null>(null);
  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [department, setDepartment] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [expectedGradYear, setExpectedGradYear] = useState<number>(2026);
  const [evidenceDataUrl, setEvidenceDataUrl] = useState<string | null>(null);
  const [evidenceFileName, setEvidenceFileName] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVerificationStatus();
  }, [user]);

  const loadVerificationStatus = async () => {
    setIsLoading(true);
    try {
      const data = await studentVerificationService.getVerification(currentUserId);
      if (data) {
        setVerification(data);
        setInstitution(data.institution);
        setDegree(data.degree);
        setDepartment(data.department);
        setStudentIdNumber(data.student_id_number || '');
        setExpectedGradYear(data.expected_graduation_year);
        setEvidenceFileName(data.evidence_file_name || null);
        setEvidenceDataUrl(data.evidence_url || null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const processed = await studentVerificationService.processEvidenceDocument(file);
      setEvidenceDataUrl(processed.dataUrl);
      setEvidenceFileName(processed.fileName);
      setFeedback({ message: `File "${file.name}" attached securely.`, type: 'success' });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback({ message: err.message || 'Failed to attach document.', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution.trim() || !degree.trim() || !department.trim()) {
      setFeedback({ message: 'Please complete all required fields.', type: 'error' });
      return;
    }

    if (!evidenceDataUrl && !verification?.evidence_url) {
      setFeedback({
        message: 'Please attach proof of enrollment (Student ID, transcript, or acceptance letter).',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const record = await studentVerificationService.submitVerification({
        userId: currentUserId,
        institution: institution.trim(),
        degree: degree.trim(),
        department: department.trim(),
        studentIdNumber: studentIdNumber.trim() || undefined,
        expectedGraduationYear: Number(expectedGradYear),
        evidenceUrl: evidenceDataUrl || verification?.evidence_url || undefined,
        evidenceFileName: evidenceFileName || verification?.evidence_file_name || undefined,
      });

      setVerification(record);
      setFeedback({
        message: 'Verification application submitted. Status is now Pending Review.',
        type: 'success',
      });
    } catch {
      setFeedback({ message: 'Failed to submit verification application.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = verification?.status || 'not_started';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
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

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Student Verification Program
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify your active academic enrollment to unlock verified student badges, early career opportunities, and hackathon programs.
          </p>
        </div>

        {onBackToProfile && (
          <Button variant="outline" size="sm" onClick={onBackToProfile}>
            View Profile
          </Button>
        )}
      </div>

      {/* Verification Status Card */}
      <div
        className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          status === 'verified'
            ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            : status === 'pending'
            ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            : status === 'rejected'
            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'
            : status === 'action_required'
            ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs shrink-0 mt-0.5">
            {status === 'verified' ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            ) : status === 'pending' ? (
              <Clock className="w-5 h-5 text-amber-600" />
            ) : status === 'rejected' ? (
              <XCircle className="w-5 h-5 text-rose-600" />
            ) : (
              <Info className="w-5 h-5 text-slate-500" />
            )}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Current Status:
              </span>
              <span
                className={`text-xs font-bold font-mono ${
                  status === 'verified'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : status === 'pending'
                    ? 'text-amber-700 dark:text-amber-300'
                    : status === 'rejected'
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {status === 'verified'
                  ? 'Officially Verified'
                  : status === 'pending'
                  ? 'Pending Review'
                  : status === 'rejected'
                  ? 'Review Rejected — Resubmission Enabled'
                  : status === 'action_required'
                  ? 'Action Required by Reviewer'
                  : 'Not Started'}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {status === 'verified'
                ? 'Your student credentials have been confirmed by institutional reviewer. The verified student badge is visible on your profile.'
                : status === 'pending'
                ? `Submitted on ${new Date(verification?.submitted_at || Date.now()).toLocaleDateString()}. Your documentation is in the verification queue.`
                : status === 'rejected'
                ? `Reason: ${verification?.reviewer_notes || 'Documentation could not be validated. Please provide an updated ID or enrollment verification.'}`
                : 'Upload proof of active enrollment below to begin verification.'}
            </p>
          </div>
        </div>

        {status === 'rejected' && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => setVerification(null)}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Resubmit
          </Button>
        )}
      </div>

      {/* Application Form */}
      {status !== 'verified' && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-5 shadow-xs transition-colors"
        >
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {status === 'pending' ? 'Edit & Resubmit Application' : 'Institutional Credentials'}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                College or University *
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. Stanford University, MIT, UC Berkeley"
                className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Degree Program *
              </label>
              <input
                type="text"
                required
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.S., M.S., B.Tech, Ph.D."
                className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department / Field of Study *
              </label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Student ID / Roll Number (Optional)
              </label>
              <input
                type="text"
                value={studentIdNumber}
                onChange={(e) => setStudentIdNumber(e.target.value)}
                placeholder="e.g. STU-2024-912"
                className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Expected Graduation Year *
              </label>
              <select
                value={expectedGradYear}
                onChange={(e) => setExpectedGradYear(Number(e.target.value))}
                className="w-full text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
                <option value={2027}>2027</option>
                <option value={2028}>2028</option>
                <option value={2029}>2029</option>
                <option value={2030}>2030</option>
              </select>
            </div>
          </div>

          {/* Document Upload Area */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Proof of Enrollment Document *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-400 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/40"
            >
              <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {evidenceFileName ? `Attached: ${evidenceFileName}` : 'Click to upload proof of enrollment'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Accepted: Student ID Card, Official Enrollment Letter, Tuition Receipt, or University Portal Screenshot (PDF, PNG, JPG up to 8MB)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              onChange={handleFileSelected}
              className="hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 max-w-sm">
              Documents are encrypted and kept strictly confidential. They are never published on your public profile.
            </p>

            <Button
              type="submit"
              size="sm"
              variant="primary"
              disabled={isSubmitting}
              leftIcon={<ShieldCheck className="w-3.5 h-3.5" />}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
