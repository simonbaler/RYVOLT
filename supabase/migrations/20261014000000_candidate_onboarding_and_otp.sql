-- ==============================================================================
-- RYVOLT Migration 20261014000000: Candidate Onboarding & Mobile OTP Verification
-- Phase 5.1: Mandatory Candidate Onboarding, Twilio OTP Verification, and Dashboard
-- ==============================================================================

-- 1. Extend profiles table with phone verification and rich candidate fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS primary_skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS github_handle TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT;

-- 2. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_verified ON public.profiles(phone_verified);

-- 3. Comments for schema transparency
COMMENT ON COLUMN public.profiles.phone_number IS 'E.164 formatted candidate mobile number';
COMMENT ON COLUMN public.profiles.phone_verified IS 'True once confirmed via Twilio Verify OTP';
COMMENT ON COLUMN public.profiles.phone_verified_at IS 'Timestamp when Twilio OTP verification succeeded';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'True once all profile details and OTP verification steps succeed';
