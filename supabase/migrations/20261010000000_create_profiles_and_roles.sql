-- ==============================================================================
-- RYVOLT — PHASE 2 DATABASE MIGRATION
-- Migration: 20261010000000_create_profiles_and_roles.sql
-- Description: Creates user profiles, role-based access control, RLS policies,
--              and automatic user onboarding triggers.
-- ==============================================================================

-- 1. Create User Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_path TEXT,
    headline TEXT,
    location TEXT,
    target_role TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Create User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_target_role ON public.profiles(target_role);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ==============================================================================
-- 3. Security Definer Helper Functions
-- ==============================================================================

-- Check if a specific user has a designated role
CREATE OR REPLACE FUNCTION public.has_role(check_user_id UUID, check_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = check_user_id AND role = check_role
    );
$$;

-- Check if current authenticated user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
$$;

-- Check if current authenticated user is a recruiter
CREATE OR REPLACE FUNCTION public.is_recruiter()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'recruiter'
    );
$$;

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 4. Automatic User Provisioning Trigger
-- When a user signs up via auth.users, initialize their profile and assign
-- strictly the 'candidate' role. Public users can NEVER self-assign 'recruiter' or 'admin'.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    initial_name TEXT;
BEGIN
    initial_name := COALESCE(
        NULLIF(TRIM(NEW.raw_user_meta_data->>'display_name'), ''),
        NULLIF(TRIM(SPLIT_PART(NEW.email, '@', 1)), ''),
        'New Builder'
    );

    -- 1. Create base profile
    INSERT INTO public.profiles (
        id,
        display_name,
        onboarding_completed
    ) VALUES (
        NEW.id,
        initial_name,
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Strictly grant 'candidate' role
    INSERT INTO public.user_roles (
        user_id,
        role
    ) VALUES (
        NEW.id,
        'candidate'
    )
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. Row Level Security (RLS) Configuration
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS Policies for public.profiles
-- ------------------------------------------------------------------------------

-- SELECT:
-- 1. Any authenticated user can read their own profile.
-- 2. Authorized recruiters or admins can inspect candidate profiles who have completed onboarding.
-- 3. Anonymous users cannot read any profiles.
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR (
        (public.is_recruiter() OR public.is_admin())
        AND onboarding_completed = TRUE
    )
);

-- INSERT:
-- Users can only insert their own profile row matching auth.uid()
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    id = auth.uid()
);

-- UPDATE:
-- Users can only update their own profile row.
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    id = auth.uid()
)
WITH CHECK (
    id = auth.uid()
);

-- DELETE:
-- Users can delete their own profile, or admins can delete
CREATE POLICY "profiles_delete_own_or_admin"
ON public.profiles
FOR DELETE
TO authenticated
USING (
    id = auth.uid() OR public.is_admin()
);

-- ------------------------------------------------------------------------------
-- RLS Policies for public.user_roles
-- ------------------------------------------------------------------------------

-- SELECT:
-- Users can inspect only their own assigned roles, or admins can inspect all
CREATE POLICY "user_roles_select_policy"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR public.is_admin()
);

-- INSERT / UPDATE / DELETE:
-- Normal users CANNOT mutate roles. Only administrators can grant or revoke roles.
CREATE POLICY "user_roles_admin_insert"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
);

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

CREATE POLICY "user_roles_admin_delete"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
    public.is_admin()
);

-- ==============================================================================
-- 6. Secure Initial Administrator Provisioning Guide
-- ==============================================================================
-- To bootstrap the initial administrator without compromising public signup:
-- Run this query once via the Supabase SQL Editor (which uses service role):
--
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('<YOUR_AUTHENTICATED_USER_UUID>', 'admin')
-- ON CONFLICT (user_id, role) DO NOTHING;
-- ==============================================================================
