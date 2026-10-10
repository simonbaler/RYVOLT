import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Users,
  Building2,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Lock,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  GraduationCap,
  Flag,
  FileText,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { adminService, AdminPlatformMetrics } from '../../services/adminService';

interface AdminPlatformOverviewProps {
  onNavigateTab?: (tabId: string) => void;
}

export const AdminPlatformOverview: React.FC<AdminPlatformOverviewProps> = ({
  onNavigateTab,
}) => {
  const [metrics, setMetrics] = useState<AdminPlatformMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const data = await adminService.getPlatformMetrics();
      setMetrics(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 p-6 sm:p-8 text-white border border-indigo-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
              <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
              <span>RYVOLT Command Center · Global Governance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Platform Administration & Operations
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time platform telemetry, student verification queue, anti-spam requisition moderation, and security compliance telemetry.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/30 px-4 py-2.5 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-emerald-300">SYSTEM STATUS: OPERATIONAL</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
              className="text-white border-white/20 hover:bg-white/10"
            >
              Refresh Telemetry
            </Button>
          </div>
        </div>
      </div>

      {/* Main KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Registered Users */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('users')}
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-indigo-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Candidate Engineers</span>
              <Users className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {metrics.totalCandidates.toLocaleString()}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>+{metrics.newRegistrationsLast30Days} in last 30d</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-medium group-hover:underline">Manage users →</span>
            </div>
          </div>

          {/* Student Verifications */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('student-verification')}
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Student Verifications</span>
              <GraduationCap className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 tabular-nums">
              {metrics.studentVerificationsPending} Pending
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>{metrics.studentVerificationsApproved} verified / {metrics.studentVerificationsRejected} rejected</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium group-hover:underline">Review queue →</span>
            </div>
          </div>

          {/* Requisitions Moderation */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('jobs-moderation')}
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Active Requisitions</span>
              <Briefcase className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {metrics.publishedJobsCount}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>{metrics.pendingJobsCount} pending review</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium group-hover:underline">Moderate jobs →</span>
            </div>
          </div>

          {/* Moderation Reports */}
          <div
            onClick={() => onNavigateTab && onNavigateTab('moderation')}
            className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-rose-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Content Reports</span>
              <Flag className="w-4 h-4 text-rose-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
              {metrics.pendingModerationReports} Awaiting Review
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>{metrics.resolvedModerationReports} resolved actions</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium group-hover:underline">Safety queue →</span>
            </div>
          </div>
        </div>
      )}

      {/* Operational Highlights & Shortcuts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Verification Queue Preview */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Student Review Queue</h3>
                <p className="text-[11px] text-slate-400">Higher education verification pipeline</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              {metrics?.studentVerificationsPending || 0} Open
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Review candidate-submitted transcripts, student IDs, and enrollment documentation. Enforces least-privilege review and updates candidate badges.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab && onNavigateTab('student-verification')}
            className="w-full justify-center text-xs"
          >
            Open Verification Center
          </Button>
        </div>

        {/* Organizations & Domain Whitelisting */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Employer Enterprises</h3>
                <p className="text-[11px] text-slate-400">Multi-tenant domain provisioning</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              {metrics?.verifiedOrganizationsCount || 0} Verified
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Manage enterprise employer accounts, authorized hiring team seats, corporate email domain whitelisting, and verified organization badges.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab && onNavigateTab('organizations')}
            className="w-full justify-center text-xs"
          >
            Manage Organizations
          </Button>
        </div>

        {/* System Architecture & Security Health */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">System Diagnostics</h3>
                <p className="text-[11px] text-slate-400">Integrations & live uptime</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
              {metrics?.uptimePercentage || '99.98%'}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Live health checks for PostgreSQL RLS, Twilio Verify, Gemini AI SDK, BuildLab runners, and immutable platform audit logs.
          </p>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigateTab && onNavigateTab('system-health')}
            className="w-full justify-center text-xs"
          >
            View System Health & Integrations
          </Button>
        </div>
      </div>

      {/* Application Pipeline Status Distribution */}
      {metrics && metrics.applicationStatusBreakdown && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Platform Application Pipeline Telemetry</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Total Recorded Applications: {metrics.totalApplications}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {Object.entries(metrics.applicationStatusBreakdown).map(([status, count]) => (
              <div
                key={status}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700"
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {status}
                </span>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
