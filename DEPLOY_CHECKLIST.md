# Deploy Checklist — Donjo main app (hr.donjoafrica.com)

Supabase project: `ngoqbdvbalktlggvhcge` (dedicated). Do NOT deploy until the items
below are done. Both apps (marketing + main) deploy together at the very end.

## 🔴 Blocking before go-live

- [ ] **Auth Site URL + Redirect allow-list (Item E).** A fresh Supabase project ships
      **localhost-only**, so **login, OAuth, and password-reset links WILL fail in
      production** until this is set. In **Dashboard → Authentication → URL Configuration**:
  - **Site URL:** `https://hr.donjoafrica.com`
  - **Redirect allow-list:** `https://hr.donjoafrica.com/**` (and `https://donjoafrica.com/**`
    if the marketing site initiates any auth redirect).
  - Keep `http://localhost:8080/**` only for local dev.

## ✅ Already done
- [x] Schema: all 44 migrations applied to the dedicated project (+ 4 security migrations).
- [x] Edge functions: all 6 deployed.
- [x] **`RESEND_API_KEY`** secret set (used by welcome-email, job-posting-alert,
      notify-status-change, send-notification, password-reset-email).
- [x] Security: RLS audit closed — see `SECURITY_CLOSEOUT.md`.

## ⚠️ To verify
- [x] **`webauthn-verify` / `--no-verify-jwt` — NOT needed.** Verified against the live
      function: the client (`AuthContext.signInWithWebAuthn`) sends `Authorization: Bearer
      <anonKey>`, and the anon key is a valid project JWT, so `verify_jwt = true` is satisfied
      (live test returned 400 "Missing credentialId" = function ran; only a request with **no**
      auth header returns 401). Passkey login works as deployed. The other client-invoked
      functions (welcome-email, job/status/notification) run in authenticated contexts, so
      their JWT is present too. Only revisit `--no-verify-jwt` if a webhook/trigger ever calls a
      function with no Authorization header.
- [ ] **Rotate** the DB password + service_role key that were shared during setup (cheap on a
      fresh project), then update local `.env` / function secrets accordingly.
- [ ] Bootstrap the first **admin**: the email seed no-ops until that user signs up; after they
      sign up, grant admin once (SQL editor `update user_roles set role='admin'…` or
      `admin_set_user_role`).

## Post-Phase-4 cleanup (from the data-flow trace — deferred, do NOT fix now)
- [ ] **Landing demo form delivery (highest risk).** `donjoafrica.com` contact form →
      `notify-consultation` edge fn saves to `consultations` AND emails
      `Allan.mbuthia.nganga@gmail.com`. This depends on the **LANDING project**
      (`wwhgrmnziiftyjmmffhf`) having **`RESEND_API_KEY` set + the fn deployed** — it was NOT
      set by us (we only set it on the main app project). If unset, demo requests **silently
      pile up in the table with no email** (effective black hole). Also the sender is
      `onboarding@resend.dev` (Resend test sender — only delivers to the Resend account
      owner). **Set the landing key + use a verified `donjoafrica.com` sender**, and add a
      human-checked fallback (a consultations view/inbox).
- [ ] **Resend domain verification (main app).** 4 functions send from
      `notifications@startupgarage.donjoafrica.com`; that domain must be **verified in Resend**
      or all main-app emails (status change, job alert, welcome, password reset) silently fail.
      `send-notification` also still uses `onboarding@resend.dev` (test) — switch to the real domain.
- [ ] **Video file privacy.** `videos` bucket is `public=true`, so a video file is reachable by
      direct URL regardless of `is_private` (the flag only hides it from listings/RPCs). Decide
      whether "private" videos must be truly private (→ private bucket + signed URLs).
- [ ] **No employer email on new application.** Applying fires only an in-app notification to
      the employer (DB trigger); no email. Add an employer email if expected.
- [ ] **Stale contact email.** `donjoafrica.com` footer shows `mailto:hello@donjo.dev` (wrong domain).
- [ ] **`video_comments` are world-readable** (`USING(true)`) — low severity, but since videos
      *can* be private (`is_private`), comments on private videos are exposed. Revisit if needed.
- [ ] **Judge ↔ pitch_decks RLS.** `ReviewerRoute` lets `judge` reach the venture views, but
      `pitch_decks` SELECT is scoped to founders/admin/**investor** (not judge) — so judges see
      ventures + scores + tech-blocks but **not pitch decks**. Add `judge` to `pitch_decks` read
      if judges are meant to see decks.

## Notes
- Buckets: `videos` and `avatars` are public by design; `pitch-decks` is private and scoped.
- `top_talent` view was expected by the audit but does not exist in this schema — confirm if needed.
