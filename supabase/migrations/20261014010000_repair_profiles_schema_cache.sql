-- ==============================================================================
-- RYVOLT Consolidated Diagnostic & Repair Script
-- Blocker: "Could not find the table 'public.profiles' in the schema cache"
-- Safe, idempotent execution for Supabase SQL Editor.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Verify / Ensure base 'profiles' table exists
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 2. Verify / Ensure 'user_roles' table exists
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- ------------------------------------------------------------------------------
-- 3. Ensure Phase 5.1 Onboarding & Phone Verification columns exist on profiles
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS primary_skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS github_handle TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_target_role ON public.profiles(target_role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON public.profiles(phone_verified);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ------------------------------------------------------------------------------
-- 4. Enable Row Level Security (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 5. Helper Role Checking Functions
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 6. RLS Policies for public.profiles (Idempotent: Drop then recreate)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
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

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
    id = auth.uid()
);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
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

-- ------------------------------------------------------------------------------
-- 7. RLS Policies for public.user_roles
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "user_roles_select_policy" ON public.user_roles;
CREATE POLICY "user_roles_select_policy"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 8. Auto-provisioning trigger on auth.users signup
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- 9. Explicit PostgREST Schema Cache Reload Notification
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
