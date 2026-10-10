/**
 * RYVOLT — Supabase Database Types & Domain Contracts (Phases 1-3)
 */

export type AppRole = 'candidate' | 'recruiter' | 'admin';

export interface ProfileRow {
  id: string;
  display_name: string;
  avatar_path: string | null;
  headline: string | null;
  location: string | null;
  target_role: string | null;
  onboarding_completed: boolean;
  phone_number?: string | null;
  phone_verified?: boolean;
  phone_verified_at?: string | null;
  bio?: string | null;
  primary_skills?: string[];
  years_experience?: number | null;
  github_handle?: string | null;
  portfolio_url?: string | null;
  created_at: string;
  updated_at: string;
  is_suspended?: boolean;
  suspension_reason?: string | null;
  suspended_at?: string | null;
  suspended_by?: string | null;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface ProfileUpdatePayload {
  display_name?: string;
  avatar_path?: string | null;
  headline?: string | null;
  location?: string | null;
  target_role?: string | null;
  onboarding_completed?: boolean;
  phone_number?: string | null;
  phone_verified?: boolean;
  phone_verified_at?: string | null;
  bio?: string | null;
  primary_skills?: string[];
  years_experience?: number | null;
  github_handle?: string | null;
  portfolio_url?: string | null;
  updated_at?: string;
}

// ==============================================================================
// Career Twin Entities (Phase 3)
// ==============================================================================

export type SkillProficiency =
  | 'Foundational'
  | 'Working Knowledge'
  | 'Proficient'
  | 'Advanced'
  | 'Staff / Expert';

export type SkillEvidenceType =
  | 'project'
  | 'github_repo'
  | 'work_experience'
  | 'certification'
  | 'portfolio_link'
  | 'none';

export interface CandidateSkill {
  id: string;
  user_id: string;
  name: string;
  category: string;
  proficiency_level: SkillProficiency;
  evidence_type: SkillEvidenceType;
  evidence_url: string | null;
  evidence_description: string | null;
  verified: boolean; // Distinguishes user-provided claims from externally verified proof
  created_at: string;
  updated_at: string;
}

export interface CandidateEducation {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  grade_or_gpa: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export type EmploymentType =
  | 'Full-time'
  | 'Part-time'
  | 'Contract'
  | 'Internship'
  | 'Co-op'
  | 'Open Source';

export interface CandidateExperience {
  id: string;
  user_id: string;
  organization: string;
  role_title: string;
  employment_type: EmploymentType;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  achievements: string[];
  created_at: string;
  updated_at: string;
}

export interface CandidateProject {
  id: string;
  user_id: string;
  title: string;
  tagline: string | null;
  description: string;
  repo_url: string | null;
  live_url: string | null;
  technologies: string[];
  highlights: string[];
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CandidateCertification {
  id: string;
  user_id: string;
  name: string;
  issuing_org: string;
  issue_date: string;
  expiration_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CandidateAchievement {
  id: string;
  user_id: string;
  title: string;
  issuer: string | null;
  date: string;
  description: string;
  url: string | null;
  created_at: string;
  updated_at: string;
}

export type RemotePreference = 'Remote' | 'Hybrid' | 'Onsite' | 'Flexible';

export interface CandidatePreferences {
  id: string;
  user_id: string;
  preferred_roles: string[];
  target_locations: string[];
  remote_preference: RemotePreference;
  target_industries: string[];
  salary_expectation_min: number | null;
  salary_currency: string;
  github_url: string | null;
  portfolio_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
}

// ==============================================================================
// Resume Studio Entities (Phase 3)
// ==============================================================================

export type ResumeTemplateId = 'classic-ats' | 'modern-pro' | 'tech-portfolio';

export interface ResumeContactInfo {
  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  headline?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export interface ResumeExperienceItem {
  id: string;
  roleTitle: string;
  organization: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  bullets: string[];
}

export interface ResumeEducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate?: string;
  gradeOrGpa?: string;
  highlights?: string[];
}

export interface ResumeProjectItem {
  id: string;
  title: string;
  repoUrl?: string;
  liveUrl?: string;
  technologies: string[];
  bullets: string[];
}

export interface ResumeSkillGroup {
  id: string;
  category: string;
  skills: string[];
}

export interface ResumeCertificationItem {
  id: string;
  name: string;
  issuingOrg: string;
  date: string;
  credentialUrl?: string;
}

export interface ResumeAchievementItem {
  id: string;
  title: string;
  issuer?: string;
  date: string;
  description: string;
}

export interface ResumeContent {
  contactInfo: ResumeContactInfo;
  summary: string;
  skills: ResumeSkillGroup[];
  experience: ResumeExperienceItem[];
  projects: ResumeProjectItem[];
  education: ResumeEducationItem[];
  certifications: ResumeCertificationItem[];
  achievements: ResumeAchievementItem[];
}

export interface ResumeRecord {
  id: string;
  user_id: string;
  title: string;
  target_role: string;
  template_id: ResumeTemplateId;
  content: ResumeContent;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface ResumeVersionRecord {
  id: string;
  resume_id: string;
  user_id: string;
  version_number: number;
  version_label: string;
  snapshot_content: ResumeContent;
  created_at: string;
}

// ==============================================================================
// Phase 04: Jobs, Applications, Integrations & Voice Types
// ==============================================================================

export type RemoteType = 'remote' | 'hybrid' | 'onsite';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'principal';
export type JobStatus = 'published' | 'draft' | 'closed';

export interface EvidenceCriteria {
  type: string;
  label: string;
  weight: 'low' | 'medium' | 'high';
}

export interface Job {
  id: string;
  title: string;
  company: string;
  company_logo: string | null;
  location: string;
  remote_type: RemoteType;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  department: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  equity: string | null;
  description: string;
  responsibilities: string[];
  requirements: string[];
  required_skills: string[];
  preferred_skills: string[];
  evidence_criteria: EvidenceCriteria[];
  recruiter_id?: string | null;
  organization_id?: string | null;
  applicant_count?: number;
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offered'
  | 'rejected'
  | 'withdrawn';

export interface ApplicationTimelineEvent {
  timestamp: string;
  status: ApplicationStatus;
  note: string;
  actor?: 'candidate' | 'recruiter' | 'system';
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  resume_id: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  match_score: number;
  notes: string | null;
  timeline: ApplicationTimelineEvent[];
  applied_at: string;
  updated_at: string;
  job?: Job;
  resume?: ResumeRecord;
  candidate_profile?: ProfileRow;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
  job?: Job;
}

export interface CandidateIntegration {
  id: string;
  user_id: string;
  telegram_chat_id: string | null;
  telegram_username: string | null;
  telegram_pairing_code: string | null;
  telegram_enabled: boolean;
  telegram_notify_status: boolean;
  telegram_notify_jobs: boolean;
  n8n_webhook_url: string | null;
  n8n_webhook_secret: string | null;
  n8n_events: string[];
  n8n_enabled: boolean;
  updated_at: string;
}

export interface TwinMatchBreakdown {
  score: number;
  matchedRequired: string[];
  missingRequired: string[];
  matchedPreferred: string[];
  evidenceBonus: number;
  matchLevel: 'Exceptional' | 'Strong' | 'Competitive' | 'Developing';
  feedback: string;
}

// ==============================================================================
// Recruiter & Enterprise Entities (Phase 5)
// ==============================================================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  verified: boolean;
  verified_at: string | null;
  domain_whitelist: string[];
  created_at: string;
  updated_at: string;
}

export type OrgMemberRole = 'owner' | 'admin' | 'recruiter' | 'hiring_manager' | 'interviewer';

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrgMemberRole;
  created_at: string;
  profile?: ProfileRow;
}

export interface RecruiterShortlist {
  id: string;
  recruiter_id: string;
  job_id: string | null;
  title: string;
  description: string | null;
  candidate_ids: string[];
  created_at: string;
  updated_at: string;
}

export type InterviewRoundType =
  | 'screening'
  | 'system_design'
  | 'coding_challenge'
  | 'architecture_deep_dive'
  | 'behavioral'
  | 'executive';

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export interface InterviewStage {
  id: string;
  application_id: string;
  job_id: string;
  recruiter_id: string;
  candidate_id: string;
  round_type: InterviewRoundType;
  scheduled_at: string;
  interviewer_name: string;
  status: InterviewStatus;
  scorecard_notes: string | null;
  rating: number | null;
  evidence_evaluated: string[];
  created_at: string;
  updated_at: string;
  job?: Job;
  candidate_profile?: ProfileRow;
}

export interface PlatformAuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string;
  action: string;
  target_resource: string;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export type ModerationReportCategory = 'spam' | 'harassment' | 'fraud' | 'impersonation' | 'inappropriate_content' | 'other';
export type ModerationReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';
export type ModerationAction = 'none' | 'warned' | 'content_removed' | 'user_suspended' | 'dismissed';

export interface PlatformModerationReport {
  id: string;
  reporter_id: string;
  target_resource_type: 'profile' | 'post' | 'comment' | 'job' | 'organization' | 'message';
  target_resource_id: string;
  target_user_id?: string | null;
  reason: string;
  category: ModerationReportCategory;
  status: ModerationReportStatus;
  reviewer_id?: string | null;
  resolution_action?: ModerationAction | null;
  resolution_notes?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateDiscoveryFilter {
  query?: string;
  skills?: string[];
  minScore?: number;
  proficiencyLevel?: string;
  location?: string;
}

// ==============================================================================
// BuildLab Entities (Phase 6)
// ==============================================================================

export type BuildLabRunStatus = 'queued' | 'running' | 'passed' | 'failed' | 'error';

export interface BuildLabRepository {
  id: string;
  user_id: string;
  repo_name: string;
  full_name: string;
  clone_url: string;
  default_branch: string;
  language: string;
  framework?: string | null;
  stars_count: number;
  forks_count: number;
  is_private: boolean;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

export interface BuildLabTestRun {
  id: string;
  repository_id: string | null;
  user_id: string;
  commit_sha: string;
  commit_message: string;
  branch: string;
  status: BuildLabRunStatus;
  suite_name: string;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  skipped_tests: number;
  coverage_percentage: number;
  duration_ms: number;
  certification_badge_id?: string | null;
  certified: boolean;
  certified_skills: string[];
  logs_excerpt?: string | null;
  created_at: string;
  completed_at?: string | null;
  repository?: BuildLabRepository;
}

// ==============================================================================
// Phase 7: Candidate Social, Networking, Messaging & Verification Entities
// ==============================================================================

export type PostType = 'general' | 'project_update' | 'achievement' | 'milestone';

export interface FeedPost {
  id: string;
  author_id: string;
  content: string;
  image_url?: string | null;
  link_url?: string | null;
  post_type: PostType;
  likes_count: number;
  comments_count: number;
  has_liked?: boolean;
  author_profile?: {
    display_name: string;
    headline: string | null;
    avatar_path: string | null;
    location: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  author_profile?: {
    display_name: string;
    avatar_path: string | null;
    headline: string | null;
  };
  created_at: string;
  updated_at: string;
}

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface NetworkConnection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectionStatus;
  note?: string | null;
  created_at: string;
  updated_at: string;
  partner_profile?: {
    id: string;
    display_name: string;
    headline: string | null;
    avatar_path: string | null;
    location: string | null;
    primary_skills?: string[];
  };
}

export interface Conversation {
  id: string;
  participant_one: string;
  participant_two: string;
  last_message_text: string | null;
  last_message_at: string;
  created_at: string;
  other_participant?: {
    id: string;
    display_name: string;
    headline: string | null;
    avatar_path: string | null;
  };
  unread_count?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export type NotificationType =
  | 'connection_request'
  | 'connection_accepted'
  | 'message'
  | 'application_update'
  | 'interview_scheduled'
  | 'post_reaction'
  | 'post_comment'
  | 'student_verification'
  | 'job_alert';

export interface CandidateNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
  read: boolean;
  created_at: string;
}

export type StudentVerificationStatus =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'action_required';

export interface StudentVerification {
  id: string;
  user_id: string;
  institution: string;
  degree: string;
  department: string;
  student_id_number?: string | null;
  expected_graduation_year: number;
  evidence_url?: string | null;
  evidence_file_name?: string | null;
  status: StudentVerificationStatus;
  reviewer_notes?: string | null;
  submitted_at: string;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type InterviewFormat = 'video' | 'phone' | 'onsite' | 'ai_mock';
// Note: InterviewStatus is declared above in stage definitions

export interface CandidateInterview {
  id: string;
  user_id: string;
  job_id?: string | null;
  application_id?: string | null;
  job_title: string;
  company_name: string;
  round_name: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link?: string | null;
  format: InterviewFormat;
  status: InterviewStatus;
  prep_notes?: string | null;
  candidate_feedback?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPrivacySettings {
  user_id: string;
  profile_visibility: 'public' | 'network_only' | 'private';
  allow_connection_requests: boolean;
  allow_direct_messages: 'all' | 'connections_only' | 'none';
  show_email: boolean;
  show_phone: boolean;
  notify_connections: boolean;
  notify_messages: boolean;
  notify_jobs: boolean;
  notify_applications: boolean;
  updated_at: string;
}

export interface UserBlockReport {
  id: string;
  reporter_id: string;
  target_user_id: string;
  action_type: 'block' | 'report' | 'mute';
  reason?: string | null;
  created_at: string;
}

// ==============================================================================
// Database Schema Mapping for Supabase Client
// ==============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string; display_name: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      user_roles: {
        Row: UserRoleRow;
        Insert: Partial<UserRoleRow> & { user_id: string; role: AppRole };
        Update: Partial<UserRoleRow>;
        Relationships: [];
      };
      candidate_skills: {
        Row: CandidateSkill;
        Insert: Partial<CandidateSkill> & { user_id: string; name: string };
        Update: Partial<CandidateSkill>;
        Relationships: [];
      };
      candidate_education: {
        Row: CandidateEducation;
        Insert: Partial<CandidateEducation> & { user_id: string; institution: string; degree: string };
        Update: Partial<CandidateEducation>;
        Relationships: [];
      };
      candidate_experience: {
        Row: CandidateExperience;
        Insert: Partial<CandidateExperience> & { user_id: string; organization: string; role_title: string };
        Update: Partial<CandidateExperience>;
        Relationships: [];
      };
      candidate_projects: {
        Row: CandidateProject;
        Insert: Partial<CandidateProject> & { user_id: string; title: string; description: string };
        Update: Partial<CandidateProject>;
        Relationships: [];
      };
      candidate_certifications: {
        Row: CandidateCertification;
        Insert: Partial<CandidateCertification> & { user_id: string; name: string; issuing_org: string };
        Update: Partial<CandidateCertification>;
        Relationships: [];
      };
      candidate_achievements: {
        Row: CandidateAchievement;
        Insert: Partial<CandidateAchievement> & { user_id: string; title: string; date: string; description: string };
        Update: Partial<CandidateAchievement>;
        Relationships: [];
      };
      candidate_preferences: {
        Row: CandidatePreferences;
        Insert: Partial<CandidatePreferences> & { user_id: string };
        Update: Partial<CandidatePreferences>;
        Relationships: [];
      };
      resumes: {
        Row: ResumeRecord;
        Insert: Partial<ResumeRecord> & { user_id: string; title: string; target_role: string };
        Update: Partial<ResumeRecord>;
        Relationships: [];
      };
      resume_versions: {
        Row: ResumeVersionRecord;
        Insert: Partial<ResumeVersionRecord> & { resume_id: string; user_id: string; version_number: number; version_label: string };
        Update: Partial<ResumeVersionRecord>;
        Relationships: [];
      };
      jobs: {
        Row: Job;
        Insert: Partial<Job> & { title: string; company: string; location: string; description: string };
        Update: Partial<Job>;
        Relationships: [];
      };
      saved_jobs: {
        Row: SavedJob;
        Insert: { user_id: string; job_id: string };
        Update: Partial<SavedJob>;
        Relationships: [];
      };
      job_applications: {
        Row: JobApplication;
        Insert: Partial<JobApplication> & { user_id: string; job_id: string };
        Update: Partial<JobApplication>;
        Relationships: [];
      };
      candidate_integrations: {
        Row: CandidateIntegration;
        Insert: Partial<CandidateIntegration> & { user_id: string };
        Update: Partial<CandidateIntegration>;
        Relationships: [];
      };
      organizations: {
        Row: Organization;
        Insert: Partial<Organization> & { name: string; slug: string };
        Update: Partial<Organization>;
        Relationships: [];
      };
      organization_members: {
        Row: OrganizationMember;
        Insert: Partial<OrganizationMember> & { organization_id: string; user_id: string; role: OrgMemberRole };
        Update: Partial<OrganizationMember>;
        Relationships: [];
      };
      recruiter_shortlists: {
        Row: RecruiterShortlist;
        Insert: Partial<RecruiterShortlist> & { recruiter_id: string; title: string };
        Update: Partial<RecruiterShortlist>;
        Relationships: [];
      };
      interview_stages: {
        Row: InterviewStage;
        Insert: Partial<InterviewStage> & { application_id: string; job_id: string; recruiter_id: string; candidate_id: string };
        Update: Partial<InterviewStage>;
        Relationships: [];
      };
      platform_audit_logs: {
        Row: PlatformAuditLog;
        Insert: Partial<PlatformAuditLog> & { action: string; target_resource: string };
        Update: Partial<PlatformAuditLog>;
        Relationships: [];
      };
      buildlab_repositories: {
        Row: BuildLabRepository;
        Insert: Partial<BuildLabRepository> & { user_id: string; repo_name: string; full_name: string; clone_url: string; language: string };
        Update: Partial<BuildLabRepository>;
        Relationships: [];
      };
      buildlab_test_runs: {
        Row: BuildLabTestRun;
        Insert: Partial<BuildLabTestRun> & { user_id: string; commit_sha: string; commit_message: string; status: BuildLabRunStatus; suite_name: string };
        Update: Partial<BuildLabTestRun>;
        Relationships: [];
      };
      feed_posts: {
        Row: FeedPost;
        Insert: Partial<FeedPost> & { author_id: string; content: string };
        Update: Partial<FeedPost>;
        Relationships: [];
      };
      post_reactions: {
        Row: PostReaction;
        Insert: Partial<PostReaction> & { post_id: string; user_id: string };
        Update: Partial<PostReaction>;
        Relationships: [];
      };
      post_comments: {
        Row: PostComment;
        Insert: Partial<PostComment> & { post_id: string; author_id: string; content: string };
        Update: Partial<PostComment>;
        Relationships: [];
      };
      network_connections: {
        Row: NetworkConnection;
        Insert: Partial<NetworkConnection> & { requester_id: string; recipient_id: string };
        Update: Partial<NetworkConnection>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Conversation> & { participant_one: string; participant_two: string };
        Update: Partial<Conversation>;
        Relationships: [];
      };
      messages: {
        Row: ChatMessage;
        Insert: Partial<ChatMessage> & { conversation_id: string; sender_id: string; content: string };
        Update: Partial<ChatMessage>;
        Relationships: [];
      };
      candidate_notifications: {
        Row: CandidateNotification;
        Insert: Partial<CandidateNotification> & { user_id: string; title: string; message: string; type: NotificationType };
        Update: Partial<CandidateNotification>;
        Relationships: [];
      };
      student_verifications: {
        Row: StudentVerification;
        Insert: Partial<StudentVerification> & { user_id: string; institution: string; degree: string; department: string; expected_graduation_year: number };
        Update: Partial<StudentVerification>;
        Relationships: [];
      };
      candidate_interviews: {
        Row: CandidateInterview;
        Insert: Partial<CandidateInterview> & { user_id: string; job_title: string; company_name: string; round_name: string; scheduled_at: string };
        Update: Partial<CandidateInterview>;
        Relationships: [];
      };
      user_privacy_settings: {
        Row: UserPrivacySettings;
        Insert: Partial<UserPrivacySettings> & { user_id: string };
        Update: Partial<UserPrivacySettings>;
        Relationships: [];
      };
      user_blocks_reports: {
        Row: UserBlockReport;
        Insert: Partial<UserBlockReport> & { reporter_id: string; target_user_id: string; action_type: 'block' | 'report' | 'mute' };
        Update: Partial<UserBlockReport>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: { check_user_id: string; check_role: string };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_recruiter: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
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
