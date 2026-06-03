# Donjo — Video Proof Hire

The Donjo main application (**hr.donjoafrica.com**): a video-first, proof-of-work hiring
platform. Applicants replace CVs with short video portfolios; employers, founders, and
admins review proof, run challenges, and manage hiring pipelines.

> Marketing site lives separately at **donjoafrica.com** (`donjoafrica.com` repo). This
> repo is the authenticated product app only.

## Tech stack

- **Vite** + **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (Radix primitives)
- **React Router v6** (role-guarded routes), **TanStack Query**
- **Supabase** — auth (PKCE + WebAuthn passkeys), Postgres + RLS, Edge Functions, Storage
- **vite-plugin-pwa** (installable PWA), **framer-motion**, **@react-pdf/renderer**

## Local development

Requires Node and npm.

```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev            # http://localhost:8080
```

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server (port 8080) |
| `npm run build` | Production build |
| `npm run build:dev` | Development-mode build |
| `npm run preview` | Preview a production build |
| `npm run lint` | ESLint |

## Environment variables

Copy `.env.example` to `.env` and fill in values. **Client-safe only** — never put the
Supabase `service_role` key in any `VITE_` variable (it would ship in the browser bundle).

| Variable | Description |
| --- | --- |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ref |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key |

## Supabase

- **Project:** the main app uses its **own** Supabase project (separate from the marketing
  site's project — they are not shared).
- **Migrations:** `supabase/migrations/` (applied via the Supabase CLI / dashboard).
- **Edge Functions:** `supabase/functions/`
  - `welcome-email` — welcome email on signup
  - `job-posting-alert` — notify candidates of new jobs
  - `notify-status-change` — application status updates
  - `password-reset-email` — password reset flow
  - `send-notification` — generic notifications
  - `webauthn-verify` — passkey (WebAuthn) verification
- Secrets (`RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, …) live in **Edge Function
  secrets**, never in client env.

## Auth & roles

Auth uses Supabase with PKCE flow and optional WebAuthn passkeys. Routes are guarded by
role via `src/components/auth/`:

- `AdminRoute` — Admin / investor scope
- `FounderRoute` — Founder / talent scope
- `EmployerRoute` — Employer scope (nested `/employer/*` routes)

## Deployment

Deployed to Cloudflare at **hr.donjoafrica.com** (deploy handled separately).
