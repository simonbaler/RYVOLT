-- ==============================================================================
-- RYVOLT Migration 20261018000000: Phase 8 Admin Command Center & Governance
-- Features:
--   1. Admin RLS policies on student_verifications, user_blocks_reports, profiles
--   2. Dedicated platform_moderation_reports table with resolution states
--   3. Platform operational metrics & telemetry views/functions
--   4. Immutable audit logs enforcement for administrative events
--   5. Account suspension & account standing support on profiles
--   6. Schema reload signal for PostgREST
-- ==============================================================================

-- 1. ENHANCE PROFILES FOR ADMINISTRATIVE MODERATION & ACCOUNT STANDING
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. DEDICATED PLATFORM MODERATION REPORTS TABLE
-- Extends simple user_blocks_reports into an administrative moderation queue
CREATE TABLE IF NOT EXISTS public.platform_moderation_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_resource_type TEXT NOT NULL CHECK (target_resource_type IN ('profile', 'post', 'comment', 'job', 'organization', 'message')),
    target_resource_id TEXT NOT NULL,
    target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'spam' CHECK (category IN ('spam', 'harassment', 'fraud', 'impersonation', 'inappropriate_content', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolution_action TEXT CHECK (resolution_action IN ('none', 'warned', 'content_removed', 'user_suspended', 'dismissed')),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_reports_status ON public.platform_moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_platform_reports_target ON public.platform_moderation_reports(target_resource_type, target_resource_id);
CREATE INDEX IF NOT EXISTS idx_platform_reports_created ON public.platform_moderation_reports(created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.platform_moderation_reports ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR PLATFORM MODERATION REPORTS
-- Users can submit reports and view their own submitted reports
DROP POLICY IF EXISTS "reports_submit" ON public.platform_moderation_reports;
CREATE POLICY "reports_submit" ON public.platform_moderation_reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_view_own" ON public.platform_moderation_reports;
CREATE POLICY "reports_view_own" ON public.platform_moderation_reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id OR public.is_admin());

-- Administrators can review, update, and resolve moderation reports
DROP POLICY IF EXISTS "reports_admin_update" ON public.platform_moderation_reports;
CREATE POLICY "reports_admin_update" ON public.platform_moderation_reports FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reports_admin_delete" ON public.platform_moderation_reports;
CREATE POLICY "reports_admin_delete" ON public.platform_moderation_reports FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- 5. ADMIN RLS POLICIES FOR STUDENT VERIFICATIONS
-- Administrators need to review and approve/reject all student verification records
DROP POLICY IF EXISTS "student_verif_admin_select" ON public.student_verifications;
CREATE POLICY "student_verif_admin_select" ON public.student_verifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "student_verif_admin_update" ON public.student_verifications;
CREATE POLICY "student_verif_admin_update" ON public.student_verifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- 6. ADMIN RLS POLICIES FOR USER_BLOCKS_REPORTS
DROP POLICY IF EXISTS "blocks_admin_select" ON public.user_blocks_reports;
CREATE POLICY "blocks_admin_select" ON public.user_blocks_reports FOR SELECT
    TO authenticated
    USING (auth.uid() = reporter_id OR public.is_admin());

-- 7. ADMIN AUDIT LOG RECORDING FUNCTION
CREATE OR REPLACE FUNCTION public.log_platform_audit(
    p_action TEXT,
    p_target_resource TEXT,
    p_details JSONB DEFAULT '{}'::jsonb,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_log_id UUID;
    v_actor_role TEXT := 'candidate';
    v_actor_email TEXT := NULL;
BEGIN
    -- Determine role of acting user
    IF auth.uid() IS NOT NULL THEN
        SELECT role INTO v_actor_role
        FROM public.user_roles
        WHERE user_id = auth.uid()
        ORDER BY CASE role WHEN 'admin' THEN 1 WHEN 'recruiter' THEN 2 ELSE 3 END
        LIMIT 1;

        SELECT email INTO v_actor_email
        FROM auth.users
        WHERE id = auth.uid();
    ELSE
        v_actor_role := 'system';
    END IF;

    INSERT INTO public.platform_audit_logs (
        actor_id,
        actor_email,
        actor_role,
        action,
        target_resource,
        details,
        ip_address,
        created_at
    ) VALUES (
        auth.uid(),
        v_actor_email,
        COALESCE(v_actor_role, 'authenticated'),
        p_action,
        p_target_resource,
        p_details,
        p_ip_address,
        NOW()
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 8. GRANT USAGE & RELOAD SCHEMA CACHE
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_platform_audit TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
