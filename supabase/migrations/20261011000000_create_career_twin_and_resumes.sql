-- ==============================================================================
-- RYVOLT — PHASE 3 DATABASE MIGRATION
-- Migration: 20261011000000_create_career_twin_and_resumes.sql
-- Description: Creates Career Twin entities (skills, education, experience,
--              projects, certifications, achievements, preferences) and
--              Resume Studio tables (resumes, resume_versions) with RLS.
-- ==============================================================================

-- 1. Candidate Skills Table
CREATE TABLE IF NOT EXISTS public.candidate_skills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Core Engineering',
    proficiency_level TEXT NOT NULL DEFAULT 'Working Knowledge'
        CHECK (proficiency_level IN ('Foundational', 'Working Knowledge', 'Proficient', 'Advanced', 'Staff / Expert')),
    evidence_type TEXT DEFAULT 'none'
        CHECK (evidence_type IN ('project', 'github_repo', 'work_experience', 'certification', 'portfolio_link', 'none')),
    evidence_url TEXT,
    evidence_description TEXT,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Candidate Education Table
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

-- 3. Candidate Experience & Internships Table
CREATE TABLE IF NOT EXISTS public.candidate_experience (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization TEXT NOT NULL,
    role_title TEXT NOT NULL,
    employment_type TEXT DEFAULT 'Full-time'
        CHECK (employment_type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Co-op', 'Open Source')),
    location TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    is_current BOOLEAN DEFAULT FALSE NOT NULL,
    description TEXT,
    achievements TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Candidate Projects Table
CREATE TABLE IF NOT EXISTS public.candidate_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT NOT NULL,
    repo_url TEXT,
    live_url TEXT,
    technologies TEXT[] DEFAULT '{}' NOT NULL,
    highlights TEXT[] DEFAULT '{}' NOT NULL,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Candidate Certifications Table
CREATE TABLE IF NOT EXISTS public.candidate_certifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuing_org TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    expiration_date TEXT,
    credential_id TEXT,
    credential_url TEXT,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Candidate Achievements Table
CREATE TABLE IF NOT EXISTS public.candidate_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    issuer TEXT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Candidate Preferences Table
CREATE TABLE IF NOT EXISTS public.candidate_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_roles TEXT[] DEFAULT '{}' NOT NULL,
    target_locations TEXT[] DEFAULT '{}' NOT NULL,
    remote_preference TEXT DEFAULT 'Hybrid'
        CHECK (remote_preference IN ('Remote', 'Hybrid', 'Onsite', 'Flexible')),
    target_industries TEXT[] DEFAULT '{}' NOT NULL,
    salary_expectation_min INT,
    salary_currency TEXT DEFAULT 'USD',
    github_url TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Resumes Table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_role TEXT NOT NULL,
    template_id TEXT NOT NULL DEFAULT 'classic-ats'
        CHECK (template_id IN ('classic-ats', 'modern-pro', 'tech-portfolio')),
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_primary BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. Resume Versions Table
CREATE TABLE IF NOT EXISTS public.resume_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    version_label TEXT NOT NULL,
    snapshot_content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_resume_version UNIQUE (resume_id, version_number)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON public.candidate_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.candidate_skills(category);
CREATE INDEX IF NOT EXISTS idx_education_user_id ON public.candidate_education(user_id);
CREATE INDEX IF NOT EXISTS idx_experience_user_id ON public.candidate_experience(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.candidate_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_certs_user_id ON public.candidate_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.candidate_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON public.resume_versions(resume_id);

-- Attach updated_at triggers
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'candidate_skills',
            'candidate_education',
            'candidate_experience',
            'candidate_projects',
            'candidate_certifications',
            'candidate_achievements',
            'candidate_preferences',
            'resumes'
        ])
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()', tbl, tbl);
    END LOOP;
END $$;

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.candidate_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS Policies for Career Twin tables
-- Authenticated users own their records.
-- Recruiters/Admins can read if candidate has completed onboarding.
-- ------------------------------------------------------------------------------

-- Generic macro definition via loop
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT unnest(ARRAY[
            'candidate_skills',
            'candidate_education',
            'candidate_experience',
            'candidate_projects',
            'candidate_certifications',
            'candidate_achievements',
            'candidate_preferences'
        ])
    LOOP
        -- SELECT Policy
        EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING (
            user_id = auth.uid() OR (
                (public.is_recruiter() OR public.is_admin()) AND
                EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = %I.user_id AND p.onboarding_completed = true)
            )
        )', tbl, tbl, tbl);

        -- INSERT Policy
        EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid())', tbl, tbl);

        -- UPDATE Policy
        EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())', tbl, tbl);

        -- DELETE Policy
        EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING (user_id = auth.uid())', tbl, tbl);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- RLS Policies for Resumes and Versions (Strictly Private to Candidate)
-- ------------------------------------------------------------------------------

-- resumes
DROP POLICY IF EXISTS resumes_select ON public.resumes;
CREATE POLICY resumes_select ON public.resumes FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS resumes_insert ON public.resumes;
CREATE POLICY resumes_insert ON public.resumes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS resumes_update ON public.resumes;
CREATE POLICY resumes_update ON public.resumes FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS resumes_delete ON public.resumes;
CREATE POLICY resumes_delete ON public.resumes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- resume_versions
DROP POLICY IF EXISTS resume_versions_select ON public.resume_versions;
CREATE POLICY resume_versions_select ON public.resume_versions FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS resume_versions_insert ON public.resume_versions;
CREATE POLICY resume_versions_insert ON public.resume_versions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS resume_versions_delete ON public.resume_versions;
CREATE POLICY resume_versions_delete ON public.resume_versions FOR DELETE TO authenticated USING (user_id = auth.uid());
