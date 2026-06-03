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
- [ ] **Per-function `--no-verify-jwt`** flags are still **TBD.** Functions deployed with the
      default `verify_jwt = true`. If a function is meant to be called **unauthenticated**
      (likely `webauthn-verify` during login; possibly webhook/trigger-driven emails) it will
      **401**. If a function 401s in testing, redeploy it with `--no-verify-jwt`.
- [ ] **Rotate** the DB password + service_role key that were shared during setup (cheap on a
      fresh project), then update local `.env` / function secrets accordingly.
- [ ] Bootstrap the first **admin**: the email seed no-ops until that user signs up; after they
      sign up, grant admin once (SQL editor `update user_roles set role='admin'…` or
      `admin_set_user_role`).

## Notes
- Buckets: `videos` and `avatars` are public by design; `pitch-decks` is private and scoped.
- `top_talent` view was expected by the audit but does not exist in this schema — confirm if needed.
