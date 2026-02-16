# Deploy WebAuthn (Fingerprint) Edge Function

The `webauthn-verify` Edge Function validates fingerprint/biometric sign-in and returns a Supabase session.

## Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- Logged in: `supabase login`
- Project linked: `supabase link --project-ref <your-project-ref>`
- Migration applied (creates `webauthn_credentials` table):
  - `supabase db push` or run migration `20260216000000_webauthn_credentials.sql`

## Deploy

```bash
# Deploy the webauthn-verify function
supabase functions deploy webauthn-verify
```

## Environment Variables

Supabase injects these automatically when the function runs (no manual setup):

- `SUPABASE_URL` – your project URL  
- `SUPABASE_SERVICE_ROLE_KEY` – service role key for admin API  

## Verify Deployment

1. The function URL will be:
   ```
   https://<project-ref>.supabase.co/functions/v1/webauthn-verify
   ```
2. Your frontend uses `VITE_SUPABASE_URL` to construct this URL.
3. Test by:
   - Signing in with password
   - Going to Account Settings → Enable Fingerprint
   - Signing out and signing in via the fingerprint icon

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Credential not found" | User must enable fingerprint in Account Settings **after** first password sign-in |
| CORS errors | Function includes `Access-Control-Allow-Origin: *` in CORS headers |
| 401/403 | Ensure `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) is sent in `Authorization: Bearer <key>` header |
