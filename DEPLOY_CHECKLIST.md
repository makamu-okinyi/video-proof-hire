# Deploy Checklist — Donjo main app (hr.donjoafrica.com)

Supabase project: `ngoqbdvbalktlggvhcge` (dedicated). Do NOT deploy until the items
below are done. Both apps (marketing + main) deploy together at the very end.

## 🔴 Blocking before go-live

- [x] **Auth Site URL + Redirect allow-list.** Set via `supabase config push` from `config.toml`:
  - **Site URL:** `https://hr.donjoafrica.com`
  - **Redirect allow-list:** `https://hr.donjoafrica.com/**`, `https://donjoafrica.com/**`, `http://localhost:8080/**`

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
- [x] **Landing demo form delivery.** `RESEND_API_KEY` set on landing project + `notify-consultation`
      deployed. Sender is `onboarding@resend.dev` (Resend test domain) — emails deliver to
      `Allan.mbuthia.nganga@gmail.com` (Resend account owner). To send from a custom domain,
      verify `donjoafrica.com` in the Resend dashboard and update the `from:` in the function.
- [ ] **Resend domain verification (both apps).** Main app sends from `notifications@startupgarage.donjoafrica.com`;
      landing sends from `onboarding@resend.dev`. Verify `startupgarage.donjoafrica.com` (and/or
      `donjoafrica.com`) in the Resend dashboard → Domains, then add the DNS records. Until verified,
      emails only reliably reach the Resend account owner's address.
- [ ] **Video file privacy.** `videos` bucket is `public=true`, so a video file is reachable by
      direct URL regardless of `is_private` (the flag only hides it from listings/RPCs). Decide
      whether "private" videos must be truly private (→ private bucket + signed URLs).
- [ ] **No employer email on new application.** Applying fires only an in-app notification to
      the employer (DB trigger); no email. Add an employer email if expected.
- [x] **Stale contact email.** Fixed in `donjoafrica.com` — Connect.tsx now shows `makamubetsy@gmail.com`.
- [ ] **`video_comments` are world-readable** (`USING(true)`) — low severity, but since videos
      *can* be private (`is_private`), comments on private videos are exposed. Revisit if needed.
- [x] **Judge ↔ pitch_decks RLS.** Added `judge` to `pitch_decks` SELECT and `pitch-decks`
      storage bucket SELECT in migration `20260220000000_judge_pitch_decks_read.sql`.

## Notes
- Buckets: `videos` and `avatars` are public by design; `pitch-decks` is private and scoped.
- `top_talent` view was expected by the audit but does not exist in this schema — confirm if needed.
