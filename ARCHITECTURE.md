# RYVOLT — Architectural Blueprint & Technical Specification

## 1. Executive Summary

RYVOLT is designed as a modular, production-oriented career intelligence platform. Rather than evaluating engineering talent through flat keyword resumes or unverified self-ratings, RYVOLT connects executable software artifacts (source repositories, commit hashes, sandboxed test execution reports) directly to a dynamic Career Twin ontology and verified employment opportunities.

---

## 2. Directory Structure

```text
/
├── index.html                     # HTML5 entry with synced metadata & font preload
├── metadata.json                  # AI Studio manifest (capabilities & permissions)
├── package.json                   # Dependencies & build scripts
├── vite.config.ts                 # Bundler config with Tailwind v4 & React plugin
├── tsconfig.json                  # TypeScript compiler settings & path aliases
├── ARCHITECTURE.md                # System architecture documentation
├── README.md                      # Developer guides and quick start
├── supabase/
│   ├── migrations/
│   │   └── 20261010000000_create_profiles_and_roles.sql # PostgreSQL schema & RLS policies
│   └── tests/
│       └── auth_and_rls_test.sql  # SQL test suite validating RLS isolation
└── src/
    ├── main.tsx                   # React root entry point
    ├── App.tsx                    # Top-level state coordinator & ErrorBoundary
    ├── index.css                  # Tailwind v4 theme tokens, layer base, typography
    ├── contexts/
    │   └── AuthContext.tsx        # Centralized Supabase Auth & profile state provider
    ├── types/
    │   ├── index.ts               # Core domain types, navigation contracts, and specs
    │   └── database.ts            # Typed PostgreSQL schema for profiles & roles
    ├── lib/
    │   ├── constants.ts           # Route hierarchies, capabilities data, staged integrations
    │   ├── supabase.ts            # Official @supabase/supabase-js client & config status
    │   └── auth-errors.ts         # Safe error mapper preventing credential/stack leaks
    ├── components/
    │   ├── ui/                    # Design system primitives (WCAG AA compliant)
    │   │   ├── BrandLogo.tsx      # Original geometric spark emblem + text wordmark
    │   │   ├── Button.tsx         # Primary, secondary, outline, ghost, danger, loading
    │   │   ├── Input.tsx          # Text input with labels, helpers, error, and icons
    │   │   ├── Select.tsx         # Dropdown select control
    │   │   ├── Card.tsx           # Flat single-elevation surfaces with hairline borders
    │   │   ├── Tabs.tsx           # Segmented filter controls & tab buttons
    │   │   ├── Modal.tsx          # Accessible dialog with focus trap & escape dismiss
    │   │   ├── Avatar.tsx         # Profile avatar with fallback initials & image error handling
    │   │   ├── Tooltip.tsx        # Accessible hover/focus disclosure
    │   │   ├── Skeleton.tsx       # Loading placeholders matching layout geometry
    │   │   ├── Toast.tsx          # Transient user action feedback alert
    │   │   └── EmptyState.tsx     # Explanatory empty states for staged roadmap views
    │   ├── auth/
    │   │   ├── AuthModal.tsx      # Real Sign-In, Sign-Up, Forgot & Reset Password dialog
    │   │   ├── OnboardingModal.tsx # Career Twin baseline profile onboarding flow
    │   │   └── SupabaseConfigBanner.tsx # Setup guide when env variables are not yet set
    │   ├── navigation/
    │   │   ├── PublicNavbar.tsx   # 3-zone Top Bar Contract adherence with auth status
    │   │   ├── MobileMenu.tsx     # Slide-in mobile drawer with keyboard traps
    │   │   ├── WorkspaceNavbar.tsx# Breadcrumbs, role switchers, and user avatar
    │   │   └── WorkspaceSidebar.tsx # 256px vertical navigation hierarchy
    │   ├── marketing/
    │   │   ├── HeroSection.tsx    # Marquee headline, value proposition, action triggers
    │   │   ├── CareerGraphVisual.tsx # Original interactive vector linkage visual
    │   │   ├── HowItWorksSection.tsx # 3-step execution pipeline
    │   │   ├── CapabilitiesSection.tsx # Bento-grid modular capability explorer
    │   │   ├── CandidateValueSection.tsx # Candidate evidence workflow pillars
    │   │   ├── RecruiterValueSection.tsx # Recruiter artifact-based hiring pillars
    │   │   ├── TrustPrinciplesSection.tsx # Privacy principles & staged integration status
    │   │   ├── DesignSystemShowcase.tsx # Live UI primitive testing suite
    │   │   └── Footer.tsx         # Navigation mirror, legal disclaimer, working brand note
    │   ├── workspace/
    │   │   ├── WorkspaceShell.tsx # Candidate / Recruiter / Admin responsive layout
    │   │   ├── WorkspacePlaceholderView.tsx # Architectural specifications per module
    │   │   ├── UnauthorizedView.tsx # 403 Forbidden screen when user lacks required role
    │   │   └── CandidateProfileSettings.tsx # Real profile editor synced to PostgreSQL
    │   └── shared/
    │       └── LegalModal.tsx     # Draft privacy & terms placeholders
    └── views/
        └── LandingPageView.tsx    # Public homepage view
```

---

## 3. Backend & Security Architecture (Phase 2)

### A. Authentication & Session Lifecycle
- Handled securely by **Supabase Auth** (`gotrue-js`).
- Passwords and sensitive credentials never touch application tables or local client storage.
- Session tokens are auto-refreshed and persisted using browser `localStorage` under `ryvolt-auth-token`.
- Real authentication flows supported: Sign Up, Sign In, Sign Out, Email Verification Notice, Password Recovery, and Password Reset.

### B. Relational PostgreSQL Schema
1. **`public.profiles`**:
   - `id`: UUID PRIMARY KEY referencing `auth.users(id) ON DELETE CASCADE`.
   - `display_name`: TEXT NOT NULL.
   - `avatar_path`: TEXT (nullable).
   - `headline`: TEXT (nullable).
   - `location`: TEXT (nullable).
   - `target_role`: TEXT (nullable).
   - `onboarding_completed`: BOOLEAN DEFAULT false NOT NULL.
   - `created_at` / `updated_at`: TIMESTAMPTZ DEFAULT now().
2. **`public.user_roles`**:
   - `id`: UUID PRIMARY KEY DEFAULT gen_random_uuid().
   - `user_id`: UUID NOT NULL REFERENCES `auth.users(id) ON DELETE CASCADE`.
   - `role`: TEXT NOT NULL CHECK (`role IN ('candidate', 'recruiter', 'admin')`).
   - `UNIQUE(user_id, role)`.

### C. Automatic Provisioning Trigger (`handle_new_user`)
- Attached to `AFTER INSERT ON auth.users`.
- Automatically initializes `public.profiles` with display name extracted from user metadata or email prefix.
- Strictly inserts `role = 'candidate'` into `public.user_roles`.
- Public registrations are strictly prevented from self-assigning `recruiter` or `admin` roles.

### D. Row Level Security Policies
- **`public.profiles`**:
  - `SELECT`: User can read their own profile; verified recruiters and administrators can read profiles of onboarded candidates. Unauthenticated users cannot read profiles.
  - `INSERT`: `WITH CHECK (id = auth.uid())`.
  - `UPDATE`: `USING (id = auth.uid()) WITH CHECK (id = auth.uid())`.
  - `DELETE`: `USING (id = auth.uid() OR public.is_admin())`.
- **`public.user_roles`**:
  - `SELECT`: `USING (user_id = auth.uid() OR public.is_admin())`.
  - `INSERT` / `UPDATE` / `DELETE`: Strictly restricted to `public.is_admin()` or service-role migrations.

### E. Initial Administrator Provisioning
Initial administrator privileges cannot be granted through frontend forms. They are bootstrapped via service-role SQL execution:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('<USER_UUID>', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## 4. Phase-by-Phase Roadmap Boundaries

1. **Phase 1**: Foundation, Brand System, Public Landing Page, Workspace Shells, Route Contracts, Developer Documentation.
2. **Phase 2 (Completed)**: Identity & Tenancy. Supabase Auth, PostgreSQL schema, RLS policies, multi-tenant workspace isolation.
3. **Phase 3**: Career Twin. SVG/React Flow interactive skill ontology canvas, evidence node modeling.
4. **Phase 4**: Job Discovery. Artifact-aligned technical requisitions, candidate evidence payloads.
5. **Phase 5**: BuildLab. Sandboxed Docker/firecracker test runner, hermetic test execution, Career Mission AI.
6. **Phase 6**: Resume Studio. Deterministic resume compilation with footnote proof citations.
7. **Phase 7**: Recruiter Workflows. Org hiring seats, artifact inspection views, team scorecards.
8. **Phase 8**: Admin & Moderation. Platform audit logs, job compliance reviews, infrastructure telemetry.
9. **Phase 9**: Production Hardening. Performance budgets, edge routing, security audits.
