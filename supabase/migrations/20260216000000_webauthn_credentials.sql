-- WebAuthn credentials for passwordless biometric auth (MVP)
create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credential_id text not null unique,
  public_key text not null,
  counter bigint default 0,
  created_at timestamptz default now()
);

create index if not exists idx_webauthn_credentials_user_id on public.webauthn_credentials(user_id);
create index if not exists idx_webauthn_credentials_credential_id on public.webauthn_credentials(credential_id);

alter table public.webauthn_credentials enable row level security;

create policy "Users can manage own webauthn credentials"
  on public.webauthn_credentials for all
  using (auth.uid() = user_id);
