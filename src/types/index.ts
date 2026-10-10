/**
 * RYVOLT — Phase 1 Type Definitions
 * Architecture: Modular domain-oriented foundation
 */

export type WorkspaceRole = 'guest' | 'candidate' | 'recruiter' | 'admin';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  description?: string;
  plannedPhase?: number;
  isImplementedInPhase1?: boolean;
}

export type CandidateNavId =
  | 'home'
  | 'network'
  | 'discover-jobs'
  | 'career-twin'
  | 'buildlab'
  | 'resume-studio'
  | 'applications'
  | 'settings';

export type RecruiterNavId =
  | 'overview'
  | 'post-job'
  | 'discover-candidates'
  | 'shortlists'
  | 'recruiter-applications'
  | 'interviews'
  | 'organization-settings';

export type AdminNavId =
  | 'platform-overview'
  | 'users'
  | 'access-requests'
  | 'organizations'
  | 'student-verification'
  | 'jobs-moderation'
  | 'moderation'
  | 'admin-integrations'
  | 'audit-logs'
  | 'system-health';

export interface PlannedIntegrationItem {
  id: string;
  name: string;
  category: 'Code & Version Control' | 'Professional Network' | 'Messaging' | 'Cloud & Storage' | 'Messaging & Notifications' | 'Webhook Triggers';
  status: string;
  connectionState: 'Not Connected' | 'Staged' | 'Architecture Staged' | 'Connected';
  description: string;
  securityScope: string;
}

export interface CapabilityFeature {
  id: string;
  title: string;
  tagline: string;
  description: string;
  targetUser: 'Candidates' | 'Recruiters' | 'Both';
  phase: number;
  highlights: string[];
}
