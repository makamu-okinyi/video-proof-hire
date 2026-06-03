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

## Notes
- Buckets: `videos` and `avatars` are public by design; `pitch-decks` is private and scoped.
- `top_talent` view was expected by the audit but does not exist in this schema — confirm if needed.
