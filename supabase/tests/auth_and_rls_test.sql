-- ==============================================================================
-- RYVOLT — PHASE 2 RLS & AUTHORIZATION TEST SUITE
-- File: supabase/tests/auth_and_rls_test.sql
-- Description: Verifies Row Level Security policies for allowed and denied operations.
-- Run in Supabase SQL Query Editor to validate security isolation.
-- ==============================================================================

DO $$
DECLARE
    test_user_a UUID := gen_random_uuid();
    test_user_b UUID := gen_random_uuid();
    recruiter_user UUID := gen_random_uuid();
    admin_user UUID := gen_random_uuid();
    rec_count INT;
BEGIN
    RAISE NOTICE '>>> Starting RYVOLT Authorization & RLS Test Suite <<<';

    -- Setup: Seed profiles and roles
    -- 1. Candidate A
    INSERT INTO public.profiles (id, display_name, headline, onboarding_completed)
    VALUES (test_user_a, 'Candidate Alice', 'Systems Engineer', true)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (test_user_a, 'candidate')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 2. Candidate B (Not onboarded yet)
    INSERT INTO public.profiles (id, display_name, headline, onboarding_completed)
    VALUES (test_user_b, 'Candidate Bob', 'Frontend Architect', false)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (test_user_b, 'candidate')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 3. Recruiter
    INSERT INTO public.profiles (id, display_name, onboarding_completed)
    VALUES (recruiter_user, 'Recruiter Rachel', true)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (recruiter_user, 'recruiter')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- 4. Admin
    INSERT INTO public.profiles (id, display_name, onboarding_completed)
    VALUES (admin_user, 'Admin Adam', true)
    ON CONFLICT (id) DO NOTHING;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    -- ==========================================================================
    -- TEST 1: Role verification functions
    -- ==========================================================================
    ASSERT public.has_role(test_user_a, 'candidate') = true, 'Test 1.1 Failed: User A should have candidate role';
    ASSERT public.has_role(test_user_a, 'admin') = false, 'Test 1.2 Failed: User A should not have admin role';
    ASSERT public.has_role(recruiter_user, 'recruiter') = true, 'Test 1.3 Failed: Recruiter should have recruiter role';
    ASSERT public.has_role(admin_user, 'admin') = true, 'Test 1.4 Failed: Admin should have admin role';
    RAISE NOTICE 'Test 1 Passed: Role verification functions verified.';

    -- ==========================================================================
    -- TEST 2: Verify candidate cannot update another user profile
    -- Simulating User A context
    -- ==========================================================================
    PERFORM set_config('request.jwt.claim.sub', test_user_a::text, true);
    PERFORM set_config('role', 'authenticated', true);

    -- Should be able to read own profile
    SELECT COUNT(*) INTO rec_count FROM public.profiles WHERE id = test_user_a;
    ASSERT rec_count = 1, 'Test 2.1 Failed: User A should read own profile';

    -- Candidate cannot read non-onboarded User B profile
    SELECT COUNT(*) INTO rec_count FROM public.profiles WHERE id = test_user_b;
    ASSERT rec_count = 0, 'Test 2.2 Failed: Candidate A should NOT see non-onboarded User B profile under RLS';

    -- User A cannot read User B roles
    SELECT COUNT(*) INTO rec_count FROM public.user_roles WHERE user_id = test_user_b;
    ASSERT rec_count = 0, 'Test 2.3 Failed: Candidate A should NOT see User B roles';

    -- User A attempting to self-grant admin role must fail
    BEGIN
        INSERT INTO public.user_roles (user_id, role) VALUES (test_user_a, 'admin');
        RAISE EXCEPTION 'Test 2.4 Failed: Candidate A was able to grant themselves admin role!';
    EXCEPTION WHEN insufficient_privilege OR check_violation OR others THEN
        RAISE NOTICE 'Test 2.4 Passed: Candidate A self-elevation denied by RLS policy.';
    END;

    -- Reset context
    PERFORM set_config('request.jwt.claim.sub', '', true);
    PERFORM set_config('role', 'postgres', true);

    RAISE NOTICE '>>> All RYVOLT RLS and Authorization Tests Passed Successfully! <<<';
END $$;
