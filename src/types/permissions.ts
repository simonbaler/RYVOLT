/**
 * RYVOLT — Typed Role & Permission Model (Phase 10)
 *
 * Enforces centralized, typed role-based access control across:
 * - Administrators
 * - Recruiters
 * - Candidates
 */

import { AppRole } from './database';

export type Permission =
  // Admin permissions
  | 'users:create_candidate'
  | 'users:create_recruiter'
  | 'users:create_admin'
  | 'users:assign_role'
  | 'users:revoke_role'
  | 'users:view_all'
  | 'users:suspend'
  | 'users:activate'
  | 'users:reset_password'
  | 'access_requests:review'
  | 'access_requests:approve'
  | 'access_requests:reject'
  | 'jobs:manage_all'
  | 'jobs:moderate'
  | 'applications:oversight'
  | 'verification:review'
  | 'content:moderate'
  | 'audit:view_logs'
  | 'analytics:platform_view'
  | 'platform:configure'
  // Recruiter permissions
  | 'jobs:create_own'
  | 'jobs:edit_own'
  | 'jobs:publish_own'
  | 'jobs:pause_own'
  | 'jobs:close_own'
  | 'candidates:discover'
  | 'candidates:view_applied'
  | 'applications:review_own'
  | 'applications:update_stage'
  | 'interviews:schedule'
  | 'interviews:manage_notes'
  | 'shortlists:manage'
  | 'org:manage_settings'
  | 'analytics:job_view'
  // Candidate permissions
  | 'profile:edit_own'
  | 'jobs:view_public'
  | 'jobs:apply'
  | 'applications:view_own'
  | 'resumes:build'
  | 'buildlab:test_code'
  | 'twin:view_edit'
  | 'interviews:view_own'
  | 'access_request:submit';

export const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  admin: [
    'users:create_candidate',
    'users:create_recruiter',
    'users:create_admin',
    'users:assign_role',
    'users:revoke_role',
    'users:view_all',
    'users:suspend',
    'users:activate',
    'users:reset_password',
    'access_requests:review',
    'access_requests:approve',
    'access_requests:reject',
    'jobs:manage_all',
    'jobs:moderate',
    'applications:oversight',
    'verification:review',
    'content:moderate',
    'audit:view_logs',
    'analytics:platform_view',
    'platform:configure',
    // Admins also have recruiter oversight capabilities
    'jobs:create_own',
    'jobs:edit_own',
    'jobs:publish_own',
    'jobs:pause_own',
    'jobs:close_own',
    'candidates:discover',
    'candidates:view_applied',
    'applications:review_own',
    'applications:update_stage',
    'interviews:schedule',
    'shortlists:manage',
    'org:manage_settings',
    'analytics:job_view',
    // Candidate capabilities
    'profile:edit_own',
    'jobs:view_public',
    'jobs:apply',
    'applications:view_own',
    'resumes:build',
    'buildlab:test_code',
    'twin:view_edit',
    'interviews:view_own',
  ],
  recruiter: [
    'jobs:create_own',
    'jobs:edit_own',
    'jobs:publish_own',
    'jobs:pause_own',
    'jobs:close_own',
    'candidates:discover',
    'candidates:view_applied',
    'applications:review_own',
    'applications:update_stage',
    'interviews:schedule',
    'interviews:manage_notes',
    'shortlists:manage',
    'org:manage_settings',
    'analytics:job_view',
    // Baseline capabilities
    'profile:edit_own',
    'jobs:view_public',
    'interviews:view_own',
  ],
  candidate: [
    'profile:edit_own',
    'jobs:view_public',
    'jobs:apply',
    'applications:view_own',
    'resumes:build',
    'buildlab:test_code',
    'twin:view_edit',
    'interviews:view_own',
    'access_request:submit',
  ],
};

/**
 * Check if a set of roles grants a specific permission
 */
export function hasPermission(userRoles: AppRole[], permission: Permission): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  return userRoles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
}

/**
 * Check if a specific single role grants a permission
 */
export function roleHasPermission(role: AppRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all combined permissions for a set of roles
 */
export function getAllPermissions(userRoles: AppRole[]): Permission[] {
  const set = new Set<Permission>();
  userRoles.forEach((role) => {
    const perms = ROLE_PERMISSIONS[role] || [];
    perms.forEach((p) => set.add(p));
  });
  return Array.from(set);
}

export interface RecruiterAccessRequest {
  id: string;
  user_id: string;
  full_name: string;
  work_email: string;
  company_name: string;
  company_website?: string | null;
  job_title?: string | null;
  team_size?: string | null;
  use_case?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}
