-- Bootstrap super admin: makamubetsy@gmail.com
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'makamubetsy@gmail.com';

  IF v_user_id IS NULL THEN
    -- Create new user (email already confirmed)
    INSERT INTO auth.users (
      instance_id, id, aud, role, email,
      encrypted_password, email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_super_admin, is_sso_user, deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated', 'authenticated',
      'makamubetsy@gmail.com',
      extensions.crypt('makamubetsy', extensions.gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"username":"makamubetsy"}',
      false, false, NULL
    ) RETURNING id INTO v_user_id;
  ELSE
    -- Ensure email is confirmed and update password
    UPDATE auth.users
    SET encrypted_password = extensions.crypt('makamubetsy', extensions.gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  -- Ensure identity record exists (required for email login)
  INSERT INTO auth.identities (
    id, provider_id, user_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    'makamubetsy@gmail.com',
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', 'makamubetsy@gmail.com'),
    'email',
    NOW(), NOW(), NOW()
  ) ON CONFLICT (provider, provider_id) DO NOTHING;

  -- Ensure profile row exists
  INSERT INTO public.profiles (id, username)
  VALUES (v_user_id, 'makamubetsy')
  ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;

  -- Set admin role (delete existing, then insert)
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_user_id, 'admin');

  RAISE NOTICE 'Admin bootstrapped with id: %', v_user_id;
END $$;
