/**
 * WebAuthn (Passwordless Biometric) utilities for Donjo.
 * Uses navigator.credentials.create for registration and navigator.credentials.get for login.
 * MVP: Stores credential in localStorage; full flow requires Edge Function verification.
 */

const STORAGE_KEY = 'donjo_webauthn_credentials';
const RP_NAME = 'Donjo Startup Garage';
const RP_ID = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export interface StoredCredential {
  credentialId: string;
  userId: string;
  userEmail: string;
  publicKey: string;
  registeredAt: string;
}

function base64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): ArrayBuffer {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function randomChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential === 'function' &&
    typeof navigator?.credentials?.create === 'function';
}

export function getStoredCredentialForUser(userId: string): StoredCredential | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all: StoredCredential[] = JSON.parse(raw);
    return all.find((c) => c.userId === userId) ?? null;
  } catch {
    return null;
  }
}

export function getAnyStoredCredential(): StoredCredential | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const all: StoredCredential[] = JSON.parse(raw);
    return all[0] ?? null;
  } catch {
    return null;
  }
}

function storeCredential(cred: StoredCredential): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  const all: StoredCredential[] = raw ? JSON.parse(raw) : [];
  const idx = all.findIndex((c) => c.userId === cred.userId);
  if (idx >= 0) all[idx] = cred;
  else all.push(cred);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/**
 * Register a new WebAuthn credential. User must be logged in.
 */
export async function registerWebAuthn(userId: string, userEmail: string): Promise<{ ok: boolean; error?: string }> {
  if (!isWebAuthnSupported()) return { ok: false, error: 'Biometric auth not supported' };
  try {
    const challenge = randomChallenge();
    const options: CredentialCreationOptions = {
      publicKey: {
        rp: { name: RP_NAME, id: RP_ID === 'localhost' ? 'localhost' : RP_ID },
        user: {
          id: new TextEncoder().encode(userId),
          name: userEmail,
          displayName: userEmail.split('@')[0],
        },
        challenge,
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        timeout: 60000,
        attestation: 'none',
      },
    };
    const credential = (await navigator.credentials.create(options)) as PublicKeyCredential | null;
    if (!credential) return { ok: false, error: 'Registration cancelled' };
    const response = credential.response as AuthenticatorAttestationResponse;
    const credId = base64urlEncode(credential.rawId);
    const pubKey = base64urlEncode(response.getPublicKey()!);
    storeCredential({
      credentialId: credId,
      userId,
      userEmail,
      publicKey: pubKey,
      registeredAt: new Date().toISOString(),
    });
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return { ok: false, error: msg };
  }
}

/**
 * Authenticate with WebAuthn. Returns assertion for server verification.
 * Falls back to password if no credential or user cancels.
 */
export async function authenticateWebAuthn(): Promise<{
  ok: boolean;
  credentialId?: string;
  assertion?: AuthenticatorAssertionResponse;
  clientDataJSON?: ArrayBuffer;
  authenticatorData?: ArrayBuffer;
  signature?: ArrayBuffer;
  userHandle?: ArrayBuffer;
}> {
  if (!isWebAuthnSupported()) return { ok: false };
  const stored = getAnyStoredCredential();
  if (!stored) return { ok: false };
  try {
    const challenge = randomChallenge();
    const options: CredentialRequestOptions = {
      publicKey: {
        challenge,
        timeout: 60000,
        rpId: RP_ID === 'localhost' ? 'localhost' : RP_ID,
        allowCredentials: [
          {
            type: 'public-key',
            id: base64urlDecode(stored.credentialId),
            transports: ['internal'],
          },
        ],
      },
    };
    const credential = (await navigator.credentials.get(options)) as PublicKeyCredential | null;
    if (!credential) return { ok: false };
    const response = credential.response as AuthenticatorAssertionResponse;
    return {
      ok: true,
      credentialId: stored.credentialId,
      assertion: response,
      clientDataJSON: response.clientDataJSON,
      authenticatorData: response.authenticatorData,
      signature: response.signature,
      userHandle: response.userHandle ?? undefined,
    };
  } catch (err) {
    return { ok: false };
  }
}
