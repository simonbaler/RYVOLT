-- ============================================================================
-- RYVOLT Migration 20261013000000: Recruiter Platform, Admin Audit & Organizations
-- Phase 05: Real Recruiter Dashboard, Admin Console, and Visual System 2.0
-- ============================================================================

-- 1. Table: organizations (Verified Tech Employers & Enterprises)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  domain_whitelist TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Table: organization_members (Recruiters, Hiring Managers & Admins in Orgs)
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'recruiter', 'hiring_manager', 'interviewer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 3. Enhance jobs table with recruiter and organization relations
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS recruiter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 4. Table: recruiter_shortlists (Collaborative hiring team folders)
CREATE TABLE IF NOT EXISTS public.recruiter_shortlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  candidate_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Table: interview_stages (Structured scorecards and technical rounds)
CREATE TABLE IF NOT EXISTS public.interview_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  round_type TEXT NOT NULL CHECK (round_type IN ('screening', 'system_design', 'coding_challenge', 'architecture_deep_dive', 'behavioral', 'executive')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  interviewer_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  scorecard_notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  evidence_evaluated TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Table: platform_audit_logs (Security & Compliance telemetry)
CREATE TABLE IF NOT EXISTS public.platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL,
  target_resource TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON public.jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org ON public.jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_shortlists_recruiter ON public.recruiter_shortlists(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interviews_app ON public.interview_stages(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_recruiter ON public.interview_stages(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.platform_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.platform_audit_logs(action);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruiter_shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organizations: Read by everyone, manage by staff/admins
CREATE POLICY "Public read organizations" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "Admin manage organizations" ON public.organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'recruiter')
    )
  );

-- Organization Members: Read by members and admins
CREATE POLICY "Members view org roster" ON public.organization_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Staff manage org roster" ON public.organization_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'recruiter')
    )
  );

-- Recruiter shortlists: Managed by owner recruiter or admin
CREATE POLICY "Recruiters manage own shortlists" ON public.recruiter_shortlists
  FOR ALL USING (
    recruiter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Interview stages: Viewable by candidate or recruiter/admin
CREATE POLICY "Parties view interview stages" ON public.interview_stages
  FOR SELECT USING (
    candidate_id = auth.uid() OR
    recruiter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "Recruiters manage interviews" ON public.interview_stages
  FOR ALL USING (
    recruiter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('recruiter', 'admin')
    )
  );

-- Platform Audit Logs: Read-only for admins, insert by system/authenticated
CREATE POLICY "Admins view audit logs" ON public.platform_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

CREATE POLICY "System insert audit logs" ON public.platform_audit_logs
  FOR INSERT WITH CHECK (true);
