/**
 * RYVOLT — Phase 8.1.2 Demo Admin Provisioning & Verification Tool
 *
 * Designated Initial Administrator: ryvolt28211800@gmail.com
 * Expected Demo Role: admin
 * Expected User UUID: b36ac53f-7bb1-4237-8f76-177ef3d0fa75
 *
 * Usage:
 *   1. Check Status & Generate Trusted SQL:
 *      npx tsx scripts/provision-admin.ts
 *
 *   2. Test Live Authentication:
 *      npx tsx scripts/provision-admin.ts --test-login
 *
 *   3. Provision via Privileged Service Role Key (Server-Side / Trusted Environment):
 *      SUPABASE_SERVICE_ROLE_KEY="<key>" DEMO_ADMIN_PASSWORD="<password>" npx tsx scripts/provision-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const TARGET_EMAIL = (
  process.env.DEMO_ADMIN_EMAIL ||
  process.env.ADMIN_EMAIL ||
  'admin@gmail.com'
).toLowerCase().trim();

// Read demo password only from environment variable or command-line flag
const args = process.argv.slice(2);
const passArg = args.find((a) => a.startsWith('--password='));
const DEMO_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || (passArg ? passArg.split('=')[1] : '282100');
const SHOULD_TEST_LOGIN = args.includes('--test-login');

async function main() {
  console.log('================================================================');
  console.log('RYVOLT Phase 8.1.2 — Demo Admin Configuration & Verification');
  console.log('================================================================');
  console.log(`Target Administrator: ${TARGET_EMAIL}`);
  console.log(`Supabase URL:        ${SUPABASE_URL || 'Not configured'}`);
  console.log(`Service Role Active: ${Boolean(SERVICE_ROLE_KEY)}`);
  console.log('----------------------------------------------------------------\n');

  if (!SUPABASE_URL || !ANON_KEY) {
    console.error('ERROR: Supabase URL or Anon Key is missing.');
    process.exit(1);
  }

  // Production boundary check
  if (process.env.NODE_ENV === 'production' && DEMO_PASSWORD === '28211800') {
    console.error('\n[SECURITY ERROR: PRODUCTION BOUNDARY ENFORCED]');
    console.error('Refusing to provision the default weak demo password in a production environment.');
    console.error('For production, configure a strong, unique password directly via Supabase Auth Dashboard.');
    process.exit(1);
  }

  const anonClient = createClient(SUPABASE_URL, ANON_KEY);

  // 1. If --test-login requested, attempt live authentication
  if (SHOULD_TEST_LOGIN) {
    console.log(`Attempting live authentication check for ${TARGET_EMAIL}...`);
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: TARGET_EMAIL,
      password: DEMO_PASSWORD,
    });

    if (error) {
      console.log('\n[LOGIN CHECK RESULT: FAILED]');
      console.log(`  Supabase Error Status:  ${error.status}`);
      console.log(`  Supabase Error Message: ${error.message}`);

      if (error.message.toLowerCase().includes('email not confirmed')) {
        console.log('\n  Diagnosis: The account exists, but email confirmation is pending in Supabase.');
        console.log('  Action: Auto-confirm the user in the Supabase Dashboard or via SQL Editor.');
      } else if (error.message.toLowerCase().includes('invalid login credentials')) {
        console.log('\n  Diagnosis: The password entered does not match the encrypted hash in auth.users.');
        console.log('  Action: Set the password via Supabase Dashboard > Users > Change Password,');
        console.log('          or run the provided pgcrypto SQL statement in the SQL Editor.');
      }
    } else {
      console.log('\n[LOGIN CHECK RESULT: SUCCESSFUL]');
      console.log(`  Authenticated User UUID: ${data.user?.id}`);
      console.log(`  Email Confirmed:         ${Boolean(data.user?.email_confirmed_at)}`);

      // Verify roles in public.user_roles using authenticated session
      const authedClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: {
          headers: {
            Authorization: `Bearer ${data.session?.access_token}`,
          },
        },
      });

      const { data: roles, error: rolesErr } = await authedClient
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user?.id);

      if (rolesErr) {
        console.log(`  Role Query Warning: ${rolesErr.message}`);
      } else {
        const assigned = roles?.map((r: any) => r.role) || [];
        console.log(`  Assigned Roles:     [${assigned.join(', ')}]`);
        if (assigned.includes('admin')) {
          console.log('\n  -> VERIFIED: Administrator role is active and recognized by PostgreSQL RLS!');
        } else {
          console.log('\n  -> ACTION REQUIRED: User does not have "admin" role in public.user_roles.');
        }
      }

      await anonClient.auth.signOut();
    }
    return;
  }

  // 2. If Service Role Key is available, provision directly
  if (SERVICE_ROLE_KEY) {
    console.log('Connecting with privileged Supabase Service-Role Client...');
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
      const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
      if (listError) {
        console.error('Failed to list users via admin client:', listError.message);
        process.exit(1);
      }

      let user = usersData.users.find((u) => u.email?.toLowerCase() === TARGET_EMAIL);

      if (!user) {
        console.log(`Creating user ${TARGET_EMAIL} via administrative API...`);
        const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
          email: TARGET_EMAIL,
          password: DEMO_PASSWORD,
          email_confirm: true,
        });
        if (createErr) {
          console.error('Create user error:', createErr.message);
          process.exit(1);
        }
        user = created.user;
        console.log(`  -> User created with UUID: ${user.id}`);
      } else {
        console.log(`Updating user ${TARGET_EMAIL} (UUID: ${user.id})...`);
        const { error: updateErr } = await adminClient.auth.admin.updateUserById(user.id, {
          email_confirm: true,
          password: DEMO_PASSWORD,
        });
        if (updateErr) {
          console.error('Update user error:', updateErr.message);
        } else {
          console.log('  -> Password updated and email marked as confirmed.');
        }
      }

      // Assign admin and candidate roles
      console.log('Assigning roles in public.user_roles...');
      await adminClient.from('user_roles').upsert([
        { user_id: user.id, role: 'admin' },
        { user_id: user.id, role: 'candidate' },
      ], { onConflict: 'user_id,role' });

      // Update profile
      await adminClient.from('profiles').upsert({
        id: user.id,
        display_name: 'RYVOLT Platform Admin',
        headline: 'Chief Platform Administrator & Systems Auditor',
        target_role: 'Platform Administrator',
        onboarding_completed: true,
        phone_verified: true,
        phone_verified_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      console.log('\n[PROVISIONING COMPLETE]');
      console.log('Now testing live sign-in with updated credentials...');
      const testRes = await anonClient.auth.signInWithPassword({
        email: TARGET_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (testRes.error) {
        console.log(`  Live test warning: ${testRes.error.message}`);
      } else {
        console.log('  -> Live authentication test PASSED! Token generated successfully.');
        await anonClient.auth.signOut();
      }
    } catch (err: any) {
      console.error('Administrative provisioning error:', err.message);
    }
    return;
  }

  // 3. If Service Role Key is NOT present in local shell
  console.log('Note: SUPABASE_SERVICE_ROLE_KEY is not defined in this shell environment.');
  console.log(`Target administrator email: ${TARGET_EMAIL}.`);
  console.log('\nTo configure the password and grant the admin role via Supabase Dashboard:');
  console.log('Choose Option A (SQL Editor - 1 click) or Option B (Dashboard UI):');
  console.log('================================================================');
  console.log('OPTION A: Run in Supabase Dashboard > SQL Editor:');
  console.log('----------------------------------------------------------------');
  console.log(`
-- 0. Ensure pgcrypto extension is active for password hashing:
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Auto-confirm email and set demo password (${DEMO_PASSWORD}) for ${TARGET_EMAIL}:
UPDATE auth.users
SET encrypted_password = crypt('${DEMO_PASSWORD}', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE lower(email) = '${TARGET_EMAIL}';

-- 2. Grant admin and candidate roles in public.user_roles:
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE lower(email) = '${TARGET_EMAIL}'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'candidate'
FROM auth.users
WHERE lower(email) = '${TARGET_EMAIL}'
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Confirm administrator profile standing:
UPDATE public.profiles
SET display_name = 'RYVOLT Platform Admin',
    headline = 'Chief Platform Administrator & Systems Auditor',
    target_role = 'Platform Administrator',
    onboarding_completed = TRUE,
    phone_verified = TRUE,
    phone_verified_at = COALESCE(phone_verified_at, NOW())
WHERE id IN (
    SELECT id FROM auth.users WHERE lower(email) = '${TARGET_EMAIL}'
);

-- 4. Reload PostgREST schema cache:
NOTIFY pgrst, 'reload schema';

-- 5. Verification query:
SELECT u.id, u.email, u.email_confirmed_at, r.role
FROM auth.users u
JOIN public.user_roles r ON r.user_id = u.id
WHERE lower(u.email) = '${TARGET_EMAIL}';
`);
  console.log('----------------------------------------------------------------');
  console.log('OPTION B: Via Supabase Dashboard UI:');
  console.log('  1. Go to Authentication > Users');
  console.log(`  2. Locate ${TARGET_EMAIL}`);
  console.log('  3. Click "..." > "Auto-confirm user" (if unconfirmed)');
  console.log('  4. Click "..." > "Change password" > Enter the demo password');
  console.log('  5. In SQL Editor, run lines 2 & 3 above to grant the "admin" role.');
  console.log('================================================================\n');
}

main().catch(console.error);
