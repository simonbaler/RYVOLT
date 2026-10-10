import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  Shield,
  UserX,
  UserCheck,
  CheckCircle2,
  Mail,
  Calendar,
  Download,
  AlertTriangle,
  GraduationCap,
  Filter,
  RefreshCw,
  ExternalLink,
  Plus,
  KeyRound,
  Lock,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { adminService, UserManagementFilter } from '../../services/adminService';
import { AppRole, ProfileRow, StudentVerification } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';
import { audioService } from '../../lib/audioService';

type EnrichedUser = ProfileRow & {
  roles: AppRole[];
  studentVerification?: StudentVerification | null;
  email?: string;
};

export const UsersManagementView: React.FC = () => {
  const { user: currentAuthUser } = useAuth();
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AppRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'incomplete'>('all');
  const [verifFilter, setVerifFilter] = useState<'all' | 'verified' | 'pending' | 'unverified'>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected user inspection modal
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createDisplayName, setCreateDisplayName] = useState('');
  const [createRole, setCreateRole] = useState<AppRole>('candidate');
  const [createHeadline, setCreateHeadline] = useState('');

  // Confirmation Modal State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant: 'primary' | 'danger';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Confirm',
    confirmVariant: 'primary',
    onConfirm: async () => {},
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers({
        query: search,
        role: roleFilter,
        status: statusFilter,
        verificationStatus: verifFilter,
      });
      setUsers(data as EnrichedUser[]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, roleFilter, statusFilter, verifFilter]);

  // Count total administrators for lockout protection
  const totalAdminsCount = users.filter((u) => u.roles?.includes('admin')).length;

  const isLastActiveAdmin = (u: EnrichedUser): boolean => {
    return u.roles?.includes('admin') && totalAdminsCount <= 1;
  };

  // 1. Suspension handler
  const promptToggleSuspension = (u: EnrichedUser) => {
    const nextSuspended = !u.is_suspended;
    setConfirmDialog({
      isOpen: true,
      title: nextSuspended ? 'Suspend User Account' : 'Reinstate User Account',
      description: nextSuspended
        ? `Are you sure you want to suspend "${u.display_name}"? This account will be immediately barred from applying to jobs or posting technical artifacts.`
        : `Reinstate "${u.display_name}"? Account capabilities will be restored.`,
      confirmLabel: nextSuspended ? 'Suspend Account' : 'Reinstate Account',
      confirmVariant: nextSuspended ? 'danger' : 'primary',
      onConfirm: async () => {
        setIsProcessing(true);
        setActionError(null);
        try {
          const reason = nextSuspended ? 'Administrative compliance review' : undefined;
          await adminService.setAccountSuspension(u.id, nextSuspended, reason, currentAuthUser?.id);
          setActionSuccess(`Account "${u.display_name}" ${nextSuspended ? 'suspended' : 'reinstated'} successfully.`);
          audioService.playClick();
          loadUsers();
          if (selectedUser?.id === u.id) {
            setSelectedUser({ ...selectedUser, is_suspended: nextSuspended });
          }
        } catch (err: any) {
          setActionError(err?.message || 'Failed to update account status.');
        } finally {
          setIsProcessing(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // 2. Role Change handler with Lockout Protection
  const promptRoleChange = (targetUser: EnrichedUser, roleToModify: AppRole, action: 'grant' | 'revoke') => {
    if (action === 'revoke' && roleToModify === 'admin' && isLastActiveAdmin(targetUser)) {
      setActionError('Administrative Lockout Protection: Cannot revoke the last active platform administrator.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: action === 'grant' ? `Grant ${roleToModify.toUpperCase()} Role` : `Revoke ${roleToModify.toUpperCase()} Role`,
      description: `Confirm changing permissions for "${targetUser.display_name}". This updates database privileges in public.user_roles.`,
      confirmLabel: action === 'grant' ? `Grant ${roleToModify}` : `Revoke ${roleToModify}`,
      confirmVariant: action === 'revoke' ? 'danger' : 'primary',
      onConfirm: async () => {
        setIsProcessing(true);
        setActionError(null);
        try {
          const res = await adminService.updateUserRole(
            targetUser.id,
            roleToModify,
            action,
            currentAuthUser?.email || undefined
          );

          if (res.success) {
            audioService.playSubmitSuccess();
            setActionSuccess(`Role "${roleToModify}" ${action === 'grant' ? 'granted to' : 'revoked from'} ${targetUser.display_name}.`);
            loadUsers();
            if (selectedUser?.id === targetUser.id) {
              const nextRoles = action === 'grant'
                ? [...selectedUser.roles, roleToModify]
                : selectedUser.roles.filter((r) => r !== roleToModify);
              setSelectedUser({ ...selectedUser, roles: nextRoles });
            }
          } else {
            setActionError(res.error || 'Privilege update failed.');
          }
        } catch (err: any) {
          setActionError(err?.message || 'Privilege update failed.');
        } finally {
          setIsProcessing(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // 3. Password Reset handler
  const promptResetPassword = (u: EnrichedUser) => {
    const userEmail = u.email || `${u.display_name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
    setConfirmDialog({
      isOpen: true,
      title: 'Initiate Password Recovery',
      description: `Dispatch a secure password recovery authorization link to ${userEmail}?`,
      confirmLabel: 'Send Reset Link',
      confirmVariant: 'primary',
      onConfirm: async () => {
        setIsProcessing(true);
        setActionError(null);
        try {
          const res = await adminService.resetUserPassword(userEmail);
          if (res.success) {
            audioService.playSubmitSuccess();
            setActionSuccess(res.message || `Password recovery link dispatched to ${userEmail}.`);
          } else {
            setActionError(res.error || 'Failed to dispatch password recovery.');
          }
        } catch (err: any) {
          setActionError(err?.message || 'Password reset failed.');
        } finally {
          setIsProcessing(false);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // 4. Create User handler
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createEmail.trim() || !createPassword.trim() || !createDisplayName.trim()) return;

    setIsProcessing(true);
    setActionError(null);
    try {
      const res = await adminService.createUser({
        email: createEmail.trim(),
        password: createPassword.trim(),
        displayName: createDisplayName.trim(),
        role: createRole,
        headline: createHeadline.trim() || undefined,
      });

      if (res.success) {
        audioService.playSubmitSuccess();
        setActionSuccess(`User account "${createEmail}" provisioned with role "${createRole}".`);
        setShowCreateModal(false);
        setCreateEmail('');
        setCreatePassword('');
        setCreateDisplayName('');
        setCreateHeadline('');
        setCreateRole('candidate');
        loadUsers();
      } else {
        setActionError(res.error || 'Failed to create user account.');
      }
    } catch (err: any) {
      setActionError(err?.message || 'Account creation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const csv = adminService.exportUsersToCSV(users);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ryvolt-platform-users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    audioService.playClick();
  };

  // Pagination calculation
  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-500" />
            <span>User Accounts & Identity Governance</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Provision user accounts, assign database roles, review candidate verification credentials, and enforce account standing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Create User Account
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 font-bold hover:underline cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 font-bold hover:underline cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="sm:col-span-2 flex items-center gap-2 px-2">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, headline, role, or ID..."
            className="w-full text-xs bg-transparent text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700"
          >
            <option value="all">All Roles</option>
            <option value="candidate">Candidates</option>
            <option value="recruiter">Recruiters</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <div>
          <select
            value={verifFilter}
            onChange={(e) => setVerifFilter(e.target.value as any)}
            className="w-full text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg p-2 border border-slate-200/60 dark:border-slate-700"
          >
            <option value="all">All Verification</option>
            <option value="verified">Student Verified</option>
            <option value="pending">Verification Pending</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {paginatedUsers.map((u) => {
          const isProtectedAdmin = isLastActiveAdmin(u);

          return (
            <div
              key={u.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm">
                  {u.display_name?.charAt(0) || 'U'}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {u.display_name}
                    </span>

                    {/* Role Badges */}
                    {u.roles?.map((r) => (
                      <span
                        key={r}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          r === 'admin'
                            ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                            : r === 'recruiter'
                            ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {r}
                      </span>
                    ))}

                    {/* Lockout Guard Badge */}
                    {isProtectedAdmin && (
                      <span
                        title="Last Platform Administrator — Demotion strictly protected"
                        className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Root Admin (Locked)</span>
                      </span>
                    )}

                    {/* Status Badge */}
                    {u.is_suspended && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                        Suspended
                      </span>
                    )}

                    {/* Student Verification Badge */}
                    {u.studentVerification?.status === 'verified' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                        <GraduationCap className="w-3 h-3" />
                        <span>Student Verified</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                    {u.headline || u.target_role || 'Registered User'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUser(u)}
                  leftIcon={<Eye className="w-3.5 h-3.5 text-indigo-500" />}
                  className="text-xs"
                >
                  Inspect
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => promptResetPassword(u)}
                  leftIcon={<KeyRound className="w-3.5 h-3.5 text-amber-500" />}
                  className="text-xs"
                  title="Initiate password recovery flow"
                >
                  Reset PW
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => promptToggleSuspension(u)}
                  disabled={isProtectedAdmin}
                  leftIcon={
                    u.is_suspended ? (
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <UserX className="w-3.5 h-3.5 text-rose-500" />
                    )
                  }
                  className={`text-xs ${
                    u.is_suspended
                      ? 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {u.is_suspended ? 'Reinstate' : 'Suspend'}
                </Button>
              </div>
            </div>
          );
        })}

        {paginatedUsers.length === 0 && (
          <div className="text-center py-12 text-xs text-slate-400">
            No users found matching current filters.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Showing {Math.min(users.length, (currentPage - 1) * pageSize + 1)}–{Math.min(users.length, currentPage * pageSize)} of {users.length} accounts</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-slate-700 dark:text-slate-300"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Previous
          </Button>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Next
          </Button>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-500" />
                <span>Provision New User Account</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name / Display Name *
                </label>
                <input
                  type="text"
                  required
                  value={createDisplayName}
                  onChange={(e) => setCreateDisplayName(e.target.value)}
                  placeholder="e.g. Dr. Maya Patel"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="e.g. maya.patel@example.com"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={createPassword}
                  onChange={(e) => setCreatePassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Primary Role *
                </label>
                <select
                  value={createRole}
                  onChange={(e) => setCreateRole(e.target.value as AppRole)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="candidate">Candidate (Talent, Builder, Job Seeker)</option>
                  <option value="recruiter">Recruiter (Hiring Manager, Talent Acquisition)</option>
                  <option value="admin">Platform Administrator (Governance & Ops)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Professional Headline / Team
                </label>
                <input
                  type="text"
                  value={createHeadline}
                  onChange={(e) => setCreateHeadline(e.target.value)}
                  placeholder="e.g. Staff Distributed Systems Engineer"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isProcessing}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {isProcessing ? 'Provisioning...' : 'Provision Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Inspection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-lg shadow-sm">
                  {selectedUser.display_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedUser.display_name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">UUID: {selectedUser.id}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Role Grant & Revocation Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Role Clearance & Database Privileges
              </h4>

              <div className="grid grid-cols-3 gap-2">
                {(['candidate', 'recruiter', 'admin'] as AppRole[]).map((role) => {
                  const hasThisRole = selectedUser.roles.includes(role);
                  const isProtected = role === 'admin' && hasThisRole && isLastActiveAdmin(selectedUser);

                  return (
                    <div
                      key={role}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                        hasThisRole
                          ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold capitalize">{role}</span>
                        {hasThisRole && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </div>

                      {hasThisRole ? (
                        <button
                          disabled={isProtected}
                          onClick={() => promptRoleChange(selectedUser, role, 'revoke')}
                          title={isProtected ? 'Protected: Cannot demote the last Platform Administrator.' : ''}
                          className={`text-[10px] font-semibold px-2 py-1 rounded transition-colors ${
                            isProtected
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 hover:bg-rose-200 cursor-pointer'
                          }`}
                        >
                          {isProtected ? 'Locked (Root)' : 'Revoke Role'}
                        </button>
                      ) : (
                        <button
                          onClick={() => promptRoleChange(selectedUser, role, 'grant')}
                          className="text-[10px] font-semibold px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer transition-colors"
                        >
                          Grant Role
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Profile Overview */}
            <div className="space-y-2 text-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Identity Record
              </h4>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Headline:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedUser.headline || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Location:</span>
                  <span className="text-slate-900 dark:text-white">{selectedUser.location || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone Verified:</span>
                  <span className="text-slate-900 dark:text-white">{selectedUser.phone_verified ? 'Yes (Verified)' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Standing:</span>
                  <span className={selectedUser.is_suspended ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
                    {selectedUser.is_suspended ? 'Suspended' : 'Good Standing (Active)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {confirmDialog.title}
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmDialog.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmDialog.onConfirm}
                disabled={isProcessing}
                className={
                  confirmDialog.confirmVariant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }
              >
                {isProcessing ? 'Processing...' : confirmDialog.confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
