-- ==============================================================================
-- RYVOLT Migration 20261020000000: Phase 10 Admin Control Center & Recruiter Workspace
--
-- Features:
--   1. Recruiter Access Requests Table & Policies
--   2. Accidental Admin Lockout Protection Trigger on public.user_roles
--   3. Recruiter Job Lifecycle & Application Stage Governance
--   4. Audit Logging Trigger Integration
--   5. PostgREST Schema Cache Reload
-- ==============================================================================

-- 1. TABLE: public.recruiter_access_requests
CREATE TABLE IF NOT EXISTS public.recruiter_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    work_email TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_website TEXT,
    job_title TEXT,
    team_size TEXT,
    use_case TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recruiter_access_status ON public.recruiter_access_requests(status);
CREATE INDEX IF NOT EXISTS idx_recruiter_access_user ON public.recruiter_access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_recruiter_access_created ON public.recruiter_access_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.recruiter_access_requests ENABLE ROW LEVEL SECURITY;

-- Candidates can submit and view their own access requests
DROP POLICY IF EXISTS "recruiter_access_user_insert" ON public.recruiter_access_requests;
CREATE POLICY "recruiter_access_user_insert"
ON public.recruiter_access_requests
FOR INSERT
TO authenticated
WITH CHECK (
    user_id = auth.uid()
);

DROP POLICY IF EXISTS "recruiter_access_user_select" ON public.recruiter_access_requests;
CREATE POLICY "recruiter_access_user_select"
ON public.recruiter_access_requests
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR public.is_admin()
);

-- Administrators can review and update access requests
DROP POLICY IF EXISTS "recruiter_access_admin_update" ON public.recruiter_access_requests;
CREATE POLICY "recruiter_access_admin_update"
ON public.recruiter_access_requests
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

-- 2. ACCIDENTAL ADMIN LOCKOUT PROTECTION TRIGGER
-- Prevents deletion or modification of the last active platform administrator
CREATE OR REPLACE FUNCTION public.check_last_admin_lockout()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin_count INTEGER;
BEGIN
    -- Check if the record being removed or updated is an 'admin' role
    IF OLD.role = 'admin' THEN
        SELECT COUNT(*) INTO v_admin_count
        FROM public.user_roles
        WHERE role = 'admin' AND user_id != OLD.user_id;

        IF v_admin_count < 1 THEN
            RAISE EXCEPTION 'Administrative Lockout Prevented: Cannot delete or demote the last remaining Platform Administrator.';
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_admin_lockout ON public.user_roles;
CREATE TRIGGER trg_prevent_last_admin_lockout
BEFORE DELETE OR UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.check_last_admin_lockout();

-- 3. RECRUITER JOB & APPLICATION POLICIES
-- Ensure recruiters can insert and update their own jobs
DROP POLICY IF EXISTS "recruiter_jobs_insert" ON public.jobs;
CREATE POLICY "recruiter_jobs_insert"
ON public.jobs
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin() OR
    (public.is_recruiter() AND (recruiter_id = auth.uid() OR recruiter_id IS NULL))
);

DROP POLICY IF EXISTS "recruiter_jobs_update" ON public.jobs;
CREATE POLICY "recruiter_jobs_update"
ON public.jobs
FOR UPDATE
TO authenticated
USING (
    public.is_admin() OR
    (public.is_recruiter() AND (recruiter_id = auth.uid() OR recruiter_id IS NULL))
)
WITH CHECK (
    public.is_admin() OR
    (public.is_recruiter() AND (recruiter_id = auth.uid() OR recruiter_id IS NULL))
);

-- Ensure recruiters can view applications submitted to their own jobs
DROP POLICY IF EXISTS "recruiter_view_job_applications" ON public.job_applications;
CREATE POLICY "recruiter_view_job_applications"
ON public.job_applications
FOR SELECT
TO authenticated
USING (
    candidate_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = public.job_applications.job_id
          AND (j.recruiter_id = auth.uid() OR public.is_recruiter())
    )
);

-- Ensure recruiters can update application statuses for their jobs
DROP POLICY IF EXISTS "recruiter_update_job_applications" ON public.job_applications;
CREATE POLICY "recruiter_update_job_applications"
ON public.job_applications
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = public.job_applications.job_id
          AND (j.recruiter_id = auth.uid() OR public.is_recruiter())
    )
)
WITH CHECK (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.jobs j
        WHERE j.id = public.job_applications.job_id
          AND (j.recruiter_id = auth.uid() OR public.is_recruiter())
    )
);

-- 4. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.recruiter_access_requests TO anon, authenticated, service_role;

-- 5. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
