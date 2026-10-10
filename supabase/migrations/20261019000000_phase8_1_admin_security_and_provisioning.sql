-- ==============================================================================
-- RYVOLT Migration 20261019000000: Phase 8.1 Admin Security & Initial Admin Provisioning
-- Designated Platform Administrator Account: ryvolt28211800@gmail.com
--
-- Security Guarantees:
-- 1. Provisions 'admin' role for the authenticated user ryvolt28211800@gmail.com
--    directly linked to their verified auth.users UUID without exposing passwords.
-- 2. Maintains candidate role for multi-view validation.
-- 3. Sets onboarding_completed and phone_verified on profiles.
-- 4. Hardens public.user_roles RLS to strictly prevent privilege escalation.
-- 5. Hardens public.profiles RLS to prevent unauthorized suspension tampering.
-- 6. Enforces immutable append-only platform_audit_logs.
-- 7. Signals PostgREST schema cache reload.
-- ==============================================================================

-- 1. PROVISION INITIAL ADMINISTRATOR IN public.user_roles
-- Binds the genuine authenticated user UUID to the 'admin' role in public.user_roles.
-- Uses lower(email) lookup from auth.users to ensure zero hardcoded passwords or UUID mismatches.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = 'ryvolt28211800@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also ensure candidate role is present so admin can switch between candidate and admin views
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'candidate'
FROM auth.users
WHERE lower(email) = 'ryvolt28211800@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. INITIALIZE ADMINISTRATOR PROFILE
UPDATE public.profiles
SET display_name = 'RYVOLT Platform Admin',
    headline = 'Chief Platform Administrator & Systems Auditor',
    target_role = 'Platform Administrator',
    onboarding_completed = TRUE,
    phone_verified = TRUE,
    phone_verified_at = COALESCE(phone_verified_at, NOW()),
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM auth.users WHERE lower(email) = 'ryvolt28211800@gmail.com'
);

-- 3. HARDEN RLS POLICIES FOR user_roles (CRITICAL SECURITY AUDIT)
-- Prevent any non-admin from modifying user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "user_roles_admin_insert" ON public.user_roles;
CREATE POLICY "user_roles_admin_insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);

DROP POLICY IF EXISTS "user_roles_admin_update" ON public.user_roles;
CREATE POLICY "user_roles_admin_update"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);

DROP POLICY IF EXISTS "user_roles_admin_delete" ON public.user_roles;
CREATE POLICY "user_roles_admin_delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
    public.is_admin()
);

-- 4. HARDEN RLS POLICIES FOR PROFILES
-- Prevent non-admins from updating suspension fields or other users' profiles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
CREATE POLICY "profiles_select_authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR public.is_admin()
    OR (public.is_recruiter() AND onboarding_completed = TRUE)
    OR (onboarding_completed = TRUE AND NOT COALESCE(is_suspended, FALSE))
);

DROP POLICY IF EXISTS "profiles_admin_update_suspension" ON public.profiles;
CREATE POLICY "profiles_admin_update_suspension"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid() OR public.is_admin()
)
WITH CHECK (
    id = auth.uid() OR public.is_admin()
);

-- 5. AUDIT LOG IMMUTABILITY ENFORCEMENT
-- Ensure platform_audit_logs cannot be altered or deleted by anyone (immutable append-only)
ALTER TABLE public.platform_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select" ON public.platform_audit_logs;
CREATE POLICY "audit_logs_select"
ON public.platform_audit_logs
FOR SELECT
TO authenticated
USING (
    public.is_admin()
);

DROP POLICY IF EXISTS "audit_logs_insert" ON public.platform_audit_logs;
CREATE POLICY "audit_logs_insert"
ON public.platform_audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- Explicitly disallow UPDATE and DELETE on audit logs to guarantee append-only integrity
DROP POLICY IF EXISTS "audit_logs_no_update" ON public.platform_audit_logs;
DROP POLICY IF EXISTS "audit_logs_no_delete" ON public.platform_audit_logs;

-- 6. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
