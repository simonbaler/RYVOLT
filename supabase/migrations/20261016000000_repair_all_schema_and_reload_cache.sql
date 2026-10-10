-- ==============================================================================
-- RYVOLT Comprehensive Schema Repair & Schema Cache Reload Script
-- Fixes: "Could not find the table 'public.candidate_skills' in the schema cache"
-- Safe, fully idempotent script for Supabase SQL Editor.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BASE PROFILES & USER ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_path TEXT,
    headline TEXT,
    location TEXT,
    target_role TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    phone_number TEXT,
    phone_verified BOOLEAN DEFAULT FALSE NOT NULL,
    phone_verified_at TIMESTAMPTZ,
    bio TEXT,
    primary_skills TEXT[] DEFAULT '{}',
    years_experience NUMERIC DEFAULT 0,
    github_handle TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure all columns exist even if profiles already was created earlier
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS primary_skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS github_handle TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_profiles_target_role ON public.profiles(target_role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON public.profiles(phone_verified);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ------------------------------------------------------------------------------
-- 2. CAREER TWIN ENTITIES
-- ------------------------------------------------------------------------------
-- 2.1 Candidate Skills
CREATE TABLE IF NOT EXISTS public.candidate_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Core Engineering',
    proficiency_level TEXT NOT NULL DEFAULT 'Working Knowledge',
    evidence_type TEXT DEFAULT 'none',
    evidence_url TEXT,
    evidence_description TEXT,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_user_id ON public.candidate_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_skills_name ON public.candidate_skills(name);

-- 2.2 Candidate Education
CREATE TABLE IF NOT EXISTS public.candidate_education (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution TEXT NOT NULL,
    degree TEXT NOT NULL,
    field_of_study TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    grade_or_gpa TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_education_user_id ON public.candidate_education(user_id);

-- 2.3 Candidate Experience
CREATE TABLE IF NOT EXISTS public.candidate_experience (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization TEXT NOT NULL,
    role_title TEXT NOT NULL,
    employment_type TEXT DEFAULT 'Full-time',
    location TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    description TEXT,
    achievements TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_experience_user_id ON public.candidate_experience(user_id);

-- 2.4 Candidate Projects
CREATE TABLE IF NOT EXISTS public.candidate_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    technologies TEXT[] DEFAULT '{}',
    repo_url TEXT,
    live_url TEXT,
    highlights TEXT[] DEFAULT '{}',
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_projects_user_id ON public.candidate_projects(user_id);

-- 2.5 Candidate Certifications
CREATE TABLE IF NOT EXISTS public.candidate_certifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuing_organization TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    expiration_date TEXT,
    credential_id TEXT,
    credential_url TEXT,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_certifications_user_id ON public.candidate_certifications(user_id);

-- 2.6 Candidate Achievements
CREATE TABLE IF NOT EXISTS public.candidate_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT,
    url TEXT,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_achievements_user_id ON public.candidate_achievements(user_id);

-- 2.7 Candidate Preferences
CREATE TABLE IF NOT EXISTS public.candidate_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    preferred_roles TEXT[] DEFAULT '{}',
    target_locations TEXT[] DEFAULT '{}',
    remote_preference TEXT DEFAULT 'Hybrid',
    salary_expectation_min NUMERIC DEFAULT 0,
    salary_currency TEXT DEFAULT 'USD',
    github_url TEXT,
    linkedin_url TEXT,
    portfolio_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_preferences_user_id ON public.candidate_preferences(user_id);

-- ------------------------------------------------------------------------------
-- 3. RESUME STUDIO
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_role TEXT NOT NULL,
    template_id TEXT NOT NULL DEFAULT 'classic-ats',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);

CREATE TABLE IF NOT EXISTS public.resume_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_label TEXT NOT NULL,
    snapshot_content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON public.resume_versions(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id ON public.resume_versions(user_id);

-- ------------------------------------------------------------------------------
-- 4. JOBS & APPLICATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    location TEXT NOT NULL,
    remote_type TEXT NOT NULL DEFAULT 'remote',
    employment_type TEXT NOT NULL DEFAULT 'Full-time',
    experience_level TEXT NOT NULL DEFAULT 'senior',
    department TEXT NOT NULL,
    salary_min NUMERIC NOT NULL,
    salary_max NUMERIC NOT NULL,
    salary_currency TEXT NOT NULL DEFAULT 'USD',
    equity TEXT,
    description TEXT NOT NULL,
    responsibilities TEXT[] DEFAULT '{}',
    requirements TEXT[] DEFAULT '{}',
    required_skills TEXT[] DEFAULT '{}',
    preferred_skills TEXT[] DEFAULT '{}',
    evidence_criteria JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'published',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_department ON public.jobs(department);

CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id TEXT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_saved_job UNIQUE (user_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);

CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    cover_note TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    match_score NUMERIC DEFAULT 0,
    match_breakdown JSONB DEFAULT '{}'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    recruiter_feedback TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_application UNIQUE (user_id, job_id)
);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.job_applications(job_id);

-- ------------------------------------------------------------------------------
-- 5. BUILDLAB & GITHUB AUTOMATIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.buildlab_repositories (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    repo_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    clone_url TEXT NOT NULL,
    default_branch TEXT DEFAULT 'main',
    language TEXT NOT NULL,
    framework TEXT,
    stars_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE,
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_buildlab_repositories_user_id ON public.buildlab_repositories(user_id);

CREATE TABLE IF NOT EXISTS public.buildlab_test_runs (
    id TEXT PRIMARY KEY,
    repository_id TEXT REFERENCES public.buildlab_repositories(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    commit_sha TEXT NOT NULL,
    commit_message TEXT NOT NULL,
    branch TEXT DEFAULT 'main',
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'passed', 'failed', 'error')),
    suite_name TEXT NOT NULL,
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    skipped_tests INTEGER DEFAULT 0,
    coverage_percentage NUMERIC DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    certification_badge_id TEXT,
    certified BOOLEAN DEFAULT FALSE,
    certified_skills TEXT[] DEFAULT '{}',
    logs_excerpt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_buildlab_test_runs_user_id ON public.buildlab_test_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_buildlab_test_runs_repo_id ON public.buildlab_test_runs(repository_id);

-- ------------------------------------------------------------------------------
-- 6. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildlab_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildlab_test_runs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 7. IDEMPOTENT RLS POLICIES (Safe drop and recreate)
-- ------------------------------------------------------------------------------
-- Profiles
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;
CREATE POLICY "profiles_select_public" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Candidate Skills
DROP POLICY IF EXISTS "skills_all_own" ON public.candidate_skills;
CREATE POLICY "skills_all_own" ON public.candidate_skills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "skills_select_public" ON public.candidate_skills;
CREATE POLICY "skills_select_public" ON public.candidate_skills FOR SELECT USING (true);

-- Candidate Education
DROP POLICY IF EXISTS "education_all_own" ON public.candidate_education;
CREATE POLICY "education_all_own" ON public.candidate_education FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Candidate Experience
DROP POLICY IF EXISTS "experience_all_own" ON public.candidate_experience;
CREATE POLICY "experience_all_own" ON public.candidate_experience FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Candidate Projects
DROP POLICY IF EXISTS "projects_all_own" ON public.candidate_projects;
CREATE POLICY "projects_all_own" ON public.candidate_projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_select_public" ON public.candidate_projects;
CREATE POLICY "projects_select_public" ON public.candidate_projects FOR SELECT USING (true);

-- Candidate Certifications
DROP POLICY IF EXISTS "certifications_all_own" ON public.candidate_certifications;
CREATE POLICY "certifications_all_own" ON public.candidate_certifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Candidate Achievements
DROP POLICY IF EXISTS "achievements_all_own" ON public.candidate_achievements;
CREATE POLICY "achievements_all_own" ON public.candidate_achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Candidate Preferences
DROP POLICY IF EXISTS "preferences_all_own" ON public.candidate_preferences;
CREATE POLICY "preferences_all_own" ON public.candidate_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Resumes
DROP POLICY IF EXISTS "resumes_all_own" ON public.resumes;
CREATE POLICY "resumes_all_own" ON public.resumes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Resume Versions
DROP POLICY IF EXISTS "resume_versions_all_own" ON public.resume_versions;
CREATE POLICY "resume_versions_all_own" ON public.resume_versions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Jobs (Public read for published jobs)
DROP POLICY IF EXISTS "jobs_select_published" ON public.jobs;
CREATE POLICY "jobs_select_published" ON public.jobs FOR SELECT USING (status = 'published');

-- Saved Jobs
DROP POLICY IF EXISTS "saved_jobs_all_own" ON public.saved_jobs;
CREATE POLICY "saved_jobs_all_own" ON public.saved_jobs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Job Applications
DROP POLICY IF EXISTS "applications_all_own" ON public.job_applications;
CREATE POLICY "applications_all_own" ON public.job_applications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- BuildLab Repositories
DROP POLICY IF EXISTS "buildlab_repos_all_own" ON public.buildlab_repositories;
CREATE POLICY "buildlab_repos_all_own" ON public.buildlab_repositories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- BuildLab Test Runs
DROP POLICY IF EXISTS "buildlab_test_runs_all_own" ON public.buildlab_test_runs;
CREATE POLICY "buildlab_test_runs_all_own" ON public.buildlab_test_runs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- 8. PERMISSIONS & POSTGREST SCHEMA CACHE RELOAD
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Force PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
