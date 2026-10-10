# RYVOLT — Build. Prove. Rise.

> **Working Brand Notice**: *The name RYVOLT is a working brand pending formal trademark and domain clearance.*

RYVOLT is a production-minded career intelligence platform that unifies professional networking, candidate career profiles, skill evidence, job search, resume generation, recruiter workflows, AI career assistance, GitHub development automation, WhatsApp messaging, and administrative controls.

---

## Phase 2: Real Authentication, Database & Access Control

Phase 2 establishes the real backend foundation using **Supabase** (PostgreSQL, Supabase Auth, and Row Level Security) without migrating away from the React 19 SPA Vite architecture:

- **Supabase Client**: Typed client (`@supabase/supabase-js`) with schema validation (`src/types/database.ts`).
- **Real Auth Flows**:
  - Sign-up (with email, password validation, display name, and auto-provisioned Candidate role).
  - Sign-in (email + password).
  - Sign-out (session termination and context cleanup).
  - Email verification handling (for projects requiring email confirmation).
  - Password recovery ("Forgot Password" dispatching secure email reset link).
  - Password reset flow (reacts to recovery tokens and updates credentials via `updateUser`).
  - Session restoration across page refresh via `supabase.auth.getSession()` and `onAuthStateChange`.
- **Database Schema & Migrations**:
  - `public.profiles`: User ID (matching `auth.users.id`), `display_name`, `avatar_path`, `headline`, `location`, `target_role`, `onboarding_completed`, `created_at`, `updated_at`.
  - `public.user_roles`: Trusted role model supporting `candidate`, `recruiter`, and `admin` with `UNIQUE(user_id, role)`.
  - Database triggers: Automatically creates profile and strictly assigns `candidate` role on new user registration. Public signups can **never** self-assign recruiter or admin roles.
- **Row Level Security (RLS)**:
  - Enabled on `public.profiles` and `public.user_roles`.
  - Users can read and update only their permitted records (`id = auth.uid()`).
  - Only administrators or trusted triggers can mutate role assignments (`public.is_admin()`).
  - Reproducible authorization test suite in `supabase/tests/auth_and_rls_test.sql`.
- **Profile Onboarding**:
  - Interactive onboarding flow modal (`OnboardingModal.tsx`) collecting name, professional headline, location, and target role.
  - Connected directly to the Career Twin entry point.
  - Persisted authoritatively to Supabase PostgreSQL, not LocalStorage.
- **Role-Based Navigation**:
  - Candidate workspace: open to all authenticated users with Candidate role.
  - Recruiter workspace: protected by explicit role check (`recruiter`), rendering `UnauthorizedView` (403 Forbidden) if not granted.
  - Admin console: protected by explicit role check (`admin`), inaccessible to public registrants.

---

## Supabase Setup & Environment Variables

RYVOLT uses publishable, browser-visible environment variables. Security is strictly enforced by PostgreSQL Row Level Security policies.

### Required Environment Variables

Create or edit `.env.local` (or configure in your hosting platform's Secrets):

```bash
# Supabase Project URL & Anon/Publishable Key
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."
```

> **Security Rule**: NEVER expose the Supabase `service_role` secret or database password in `.env` files or frontend client code.

### Applying Database Migrations

1. Open your project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase Dashboard.
3. Open and run the versioned migration file:
   ```sql
   -- File: supabase/migrations/20261010000000_create_profiles_and_roles.sql
   ```
4. Run the RLS test script to verify security boundaries:
   ```sql
   -- File: supabase/tests/auth_and_rls_test.sql
   ```

### Secure Initial Administrator Provisioning

New public registrations are restricted by database triggers to receive only the `candidate` role. To bootstrap the initial administrator without compromising public signup:

Run this command once in the **Supabase SQL Editor** (which executes with service-role privileges):

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<YOUR_AUTHENTICATED_USER_UUID>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

To grant a user the `recruiter` role:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<CANDIDATE_USER_UUID>', 'recruiter')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Quick Start & Developer Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Starts development on `http://localhost:3000`.

### 3. Type-Check & Lint
```bash
npm run lint
```
Executes TypeScript checking (`tsc --noEmit`).

### 4. Build Production Bundle
```bash
npm run build
```
Creates an optimized production bundle in `dist/`.

### 5. Production Start
```bash
npm start
```
Starts the production server (`node server.ts`) serving the Express API and built frontend.

---

## Deploying to Render (render.com)

RYVOLT is fully pre-configured for **Render** as a full-stack Node.js Web Service:

- **1-Click Blueprint**: Point Render to your repository; it automatically picks up `render.yaml` with build (`npm install && npm run build`), start (`npm start`), and health check (`/api/health`).
- **Node 22 Support**: Uses `.node-version` (22.14.0) and `"engines"` in `package.json` for modern native TypeScript execution.
- **Health Check**: Automated uptime monitoring configured at `/api/health`.

For full step-by-step setup and environment variable instructions, see **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)**.

---

## Nine-Phase Product Roadmap

| Phase | Title | Scope Summary |
| :--- | :--- | :--- |
| **Phase 1** | **Product Foundation & UX** | Design system, landing page, responsive shells, route contracts, developer docs |
| **Phase 2** | **Identity, Auth & Tenancy** *(Complete)* | Supabase Auth, PostgreSQL schema, Row Level Security (RLS), RBAC policies |
| **Phase 3** | **Career Twin & Skill Graph** | Interactive skill ontology, artifact evidence nodes, competency verification |
| **Phase 4** | **Job Discovery & Matching** | Skill-indexed opportunities, artifact alignment, transparent non-blackbox fit |
| **Phase 5** | **BuildLab Sandbox & AI Guidance**| Sandboxed test runners, hermetic repo test execution, Career Mission AI |
| **Phase 6** | **Resume Studio & Sharing** | Deterministic resume synthesizer citing verified proof, LinkedIn sharing |
| **Phase 7** | **Recruiter & Org Hiring** | Organization workspaces, artifact-grounded candidate search, scorecards |
| **Phase 8** | **Administration & Telemetry** | Platform audit logs, job listing moderation, runner health telemetry |
| **Phase 9** | **Production Hardening** | Security audits, rate-limiting, edge caching, production deployment |
