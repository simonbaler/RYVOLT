-- ==============================================================================
-- RYVOLT Migration 20261015000000: BuildLab Test Suites & GitHub Automations
-- Phase 6: Automated repository test environments, commit proof certification,
--          and verifiable code artifact pipelines.
-- ==============================================================================

-- 1. BuildLab Connected Repositories Table
CREATE TABLE IF NOT EXISTS public.buildlab_repositories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    repo_name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    clone_url TEXT NOT NULL,
    default_branch TEXT DEFAULT 'main' NOT NULL,
    language TEXT NOT NULL,
    framework TEXT,
    stars_count INTEGER DEFAULT 0,
    forks_count INTEGER DEFAULT 0,
    is_private BOOLEAN DEFAULT FALSE NOT NULL,
    last_synced_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_repo UNIQUE (user_id, full_name)
);

-- 2. BuildLab Test Runs / Certifications Table
CREATE TABLE IF NOT EXISTS public.buildlab_test_runs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    repository_id UUID REFERENCES public.buildlab_repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    commit_sha TEXT NOT NULL,
    commit_message TEXT NOT NULL,
    branch TEXT DEFAULT 'main' NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'passed', 'failed', 'error')),
    suite_name TEXT NOT NULL,
    total_tests INTEGER DEFAULT 0 NOT NULL,
    passed_tests INTEGER DEFAULT 0 NOT NULL,
    failed_tests INTEGER DEFAULT 0 NOT NULL,
    skipped_tests INTEGER DEFAULT 0 NOT NULL,
    coverage_percentage NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    duration_ms INTEGER DEFAULT 0 NOT NULL,
    certification_badge_id TEXT,
    certified BOOLEAN DEFAULT FALSE NOT NULL,
    certified_skills TEXT[] DEFAULT '{}',
    logs_excerpt TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_buildlab_repos_user_id ON public.buildlab_repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_buildlab_test_runs_user_id ON public.buildlab_test_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_buildlab_test_runs_repo_id ON public.buildlab_test_runs(repository_id);
CREATE INDEX IF NOT EXISTS idx_buildlab_test_runs_certified ON public.buildlab_test_runs(certified);

-- Enable Row Level Security (RLS)
ALTER TABLE public.buildlab_repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buildlab_test_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buildlab_repositories
DROP POLICY IF EXISTS "buildlab_repos_select" ON public.buildlab_repositories;
CREATE POLICY "buildlab_repos_select"
ON public.buildlab_repositories
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR (
        (public.is_recruiter() OR public.is_admin())
    )
);

DROP POLICY IF EXISTS "buildlab_repos_all_own" ON public.buildlab_repositories;
CREATE POLICY "buildlab_repos_all_own"
ON public.buildlab_repositories
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS Policies for buildlab_test_runs
DROP POLICY IF EXISTS "buildlab_test_runs_select" ON public.buildlab_test_runs;
CREATE POLICY "buildlab_test_runs_select"
ON public.buildlab_test_runs
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR (
        (public.is_recruiter() OR public.is_admin())
    )
);

DROP POLICY IF EXISTS "buildlab_test_runs_all_own" ON public.buildlab_test_runs;
CREATE POLICY "buildlab_test_runs_all_own"
ON public.buildlab_test_runs
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
