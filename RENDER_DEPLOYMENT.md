# Deploying RYVOLT to Render (render.com)

This guide walks you through deploying **RYVOLT** to [Render](https://render.com) as a production-ready, full-stack Web Service (React 19 Vite frontend + Express backend).

---

## Architecture Overview

RYVOLT runs as a single unified Node.js service:
- **Build Phase**: Vite compiles the React 19 frontend into optimized static files in `dist/`.
- **Runtime Phase**: Express (`server.ts`) serves the API endpoints (`/api/*`), proxies Gemini AI and Twilio OTP requests, and serves the static SPA with client-side routing fallback.
- **Health Check**: Native `/api/health` endpoint verifies service status and integration readiness.

---

## Method 1: 1-Click Blueprint Deployment (Recommended)

The repository includes a ready-to-use `render.yaml` Blueprint file.

1. Push your repository to **GitHub** or **GitLab**.
2. Log into your **Render Dashboard** ([dashboard.render.com](https://dashboard.render.com)).
3. Click **New +** in the top navigation and select **Blueprint**.
4. Connect your RYVOLT repository.
5. Render will detect `render.yaml` and prefill the service specifications:
   - **Service Name**: `ryvolt`
   - **Environment**: `Node` (v22.14.0 via `.node-version`)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`
6. Fill in the sensitive environment variables (see table below).
7. Click **Apply**. Render will automatically build and launch your service.

---

## Method 2: Manual Web Service Setup

If you prefer to configure the service manually in the Render UI:

1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the following service settings:

| Setting | Value |
| :--- | :--- |
| **Name** | `ryvolt` (or your chosen service name) |
| **Region** | Oregon (US West) or your nearest region |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `bun install && bun run build` (or `npm install && npm run build`) |
| **Start Command** | `bun server.ts` (or `node --experimental-strip-types server.ts`) |
| **Instance Type** | Free or Starter |

4. Scroll down to **Advanced** -> **Health Check Path**:
   - Set **Health Check Path** to `/api/health`.
5. Under **Environment Variables**, add the required variables below.
6. Click **Create Web Service**.

---

## Environment Variables Reference

Configure these in the Render **Environment** tab:

### Required Variables

| Variable Name | Description | Example / Notes |
| :--- | :--- | :--- |
| `NODE_VERSION` | Node.js version | `22.14.0` (also specified in `.node-version`) |
| `NODE_ENV` | Environment mode | `production` |
| `NODE_OPTIONS` | Node CLI options for TS strip types | `--experimental-strip-types` (required if running with `node server.ts`) |
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xyzproject.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable anon key | `eyJhbGciOi...` |

> **Important (Vite Build Time)**: Because Vite compiles the frontend at build time, `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be configured in Render before your initial build runs so they are baked into the frontend bundle.

### Optional Integrations

| Variable Name | Description | Default / Fallback |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API key for AI Resume Assistant & Voice Coach | If omitted, deterministic factual synthesizers run without crashing. |
| `APP_URL` | Public Render service URL | `https://ryvolt.onrender.com` |
| `DEMO_ADMIN_ENABLED` | Enables demo admin sign-in | `true` |
| `DEMO_ADMIN_EMAIL` | Demo admin account email | `admin@gmail.com` |
| `DEMO_ADMIN_PASSWORD` | Demo admin account password | Your chosen password |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key for automatic role assignment | Optional |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS OTP | If omitted, simulated OTP runs seamlessly. |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Optional |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify Service SID | Optional |

---

## Supabase Auth Configuration (Post-Deployment)

Once your Render Web Service is running and you have your URL (e.g. `https://ryvolt.onrender.com`):

1. Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. Set **Site URL** to:
   ```
   https://ryvolt.onrender.com
   ```
3. Add to **Redirect URLs**:
   ```
   https://ryvolt.onrender.com/**
   ```
4. Save changes. This ensures password recovery links and email verifications redirect back to your live Render deployment.

---

## Deployment Verification Checklist

After Render reports "Your service is live":

1. **Health Check**:
   Visit `https://<your-render-url>/api/health`. You should receive HTTP 200 with JSON:
   ```json
   {
     "status": "ok",
     "phase": "5.1",
     "service": "RYVOLT Enterprise Server",
     ...
   }
   ```
2. **Frontend Loading**:
   Visit `https://<your-render-url>/`. The RYVOLT Landing Page and 3D Neural Canvas should render smoothly.
3. **Client-Side Routing / Deep Linking**:
   Reloading any route should serve the application without 404 errors (handled by Express SPA wildcard).
4. **API Security**:
   Visiting `https://<your-render-url>/api/nonexistent` returns HTTP 404 JSON (not HTML).
5. **AI Features**:
   Open Resume Studio or Voice Coach to test Gemini AI synthesis (or heuristic fallback if no key is configured).
