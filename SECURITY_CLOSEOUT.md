# Security Closeout — Donjo main app (video-proof-hire)

Project: `ngoqbdvbalktlggvhcge` (dedicated; **not** shared with the marketing site).
Scope: read-only RLS audit (A–F + messaging + articles) followed by fixes, applied
one finding at a time on the `renovation` branch.

## What was found

1. **Self-serve role escalation via `update_user_role`.** The `SECURITY DEFINER`
   function `update_user_role(new_role app_role)` accepted **any** role with no
   restriction, was executable by `authenticated`, and was called from the client at
   onboarding. A normal user could run `rpc('update_user_role',{new_role:'investor'})`
   (or `employer`/`judge`) and instantly gain admin/review powers — `employer` *is* the
   admin role in this schema, so this also opened `/admin`, "view all founder profiles",
   and "change venture review_status".
2. **`venture_founders` self-insert.** The INSERT policy only checked
   `user_id = auth.uid()`, so a user could attach themselves as a "founder" of **any**
   venture and read its private data (pitch decks, tech blocks).
3. **World-readable `pitch_decks` + loose bucket policies.** The `pitch_decks` table had
   `SELECT USING (true)` (anyone, incl. anon, could read every row — and rows store a
   1-year **signed URL**). The private `pitch-decks` storage bucket's SELECT/DELETE
   policies only checked `auth.uid() IS NOT NULL`, so any logged-in user could read or
   delete any deck file.
4. **Forgeable notifications.** `notifications` had `INSERT WITH CHECK (true)`, letting any
   client write notifications to any user.

Additional hardening surfaced during the fix: several checks fell back to the
**self-settable** `profiles.user_type` / `can_shortlist` columns — those fallbacks were
removed so authorization derives only from the locked `user_roles` table.

## What each migration changed

| Migration | Change |
|---|---|
| `20260219000000_add_admin_role.sql` | Adds a dedicated, vetted **`admin`** enum value (separate migration so the value commits before use). |
| `20260219000100_role_lockdown.sql` | **#1+#1b.** `update_user_role` → strict whitelist (`talent`/`founder`/`employer` only; everything else RAISES). New **`admin_set_user_role(target,role)`** (admin-only) for granting vetted roles. `venture_founders` INSERT → creator-claims-empty-venture only. **Employer/admin split:** all admin-review authz (ventures review SELECT/UPDATE, founder-profile view, `update_venture_review_status`, venture-flow conversations) re-scoped to `has_role('admin')` **only** — dropped `employer`/`investor`/`can_shortlist`/`user_type` fallbacks; hiring stays ownership-based (job-owner branch preserved). Seeds the first `admin` from the email allowlist (seed only). |
| `20260219000200_scope_pitch_decks_access.sql` | **#2.** `pitch_decks` SELECT and `pitch-decks` bucket SELECT → venture founders OR admin OR investor (read); bucket INSERT/DELETE → founders OR admin. Founder check keys off the object path `<venture_id>/…`. |
| `20260219000300_tighten_notifications_and_founders.sql` | **#3.** Drops the public `notifications` INSERT policy (creation is via `SECURITY DEFINER` triggers + service_role). `venture_founders` SELECT → founders of **active** ventures, your own row, or admin. |

Frontend (same unit): `AdminRoute = ['admin']`, `EmployerRoute = ['employer','admin']`,
`Auth` redirects route `admin→/admin`, `employer→/employer`, `founder→/founder`.

## Final capability table (verified against the live DB)

| Action | random auth | employer | investor | judge | founder (this venture) | founder (other venture) | admin |
|---|---|---|---|---|---|---|---|
| `rpc('update_user_role',{investor/judge/admin})` | ERROR | ERROR | ERROR | ERROR | ERROR | ERROR | ERROR (use `admin_set_user_role`) |
| Self-assign talent/founder/employer | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Reach `/admin` | NO | NO | NO | NO | NO | NO | ✅ |
| Read other founders' profiles | NO | NO | NO | NO | own | own | ✅ |
| Change venture `review_status` | NO | NO | NO | NO | NO | NO | ✅ |
| Self-insert as founder of another venture | NO | NO | NO | NO | n/a | NO | NO |
| Read this venture's pitch decks | NO | NO | ✅(read) | NO | ✅ | NO | ✅ |
| Read other venture's pitch decks | NO | NO | ✅(read) | NO | NO | NO | ✅ |
| Forge a notification to any user | NO | NO | NO | NO | NO | NO | NO (definer/service_role only) |
| Read founder↔venture link (non-active venture) | NO | NO | NO | NO | own | NO | ✅ |
| Update applicants to a job they own | n/a | ✅ | n/a | n/a | n/a | n/a | ✅ |

Intended world-readable (no private data): `user_follows`, `video_likes`,
`video_comments` (all videos are public content; the `videos` table has no privacy flag).

## Status
All A–F + messaging + articles findings are closed on the database side. Remaining
pre-go-live items are tracked in `DEPLOY_CHECKLIST.md` (notably **Auth URL configuration**,
which is dashboard config, not a migration).

Messaging RLS verified correct: a user reads only their own conversations, can send as a
participant, the counterparty can read, non-participants are blocked.
