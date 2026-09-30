"use node";

/**
 * WebAuthn (passkey) server logic, backed by @simplewebauthn/server.
 *
 * Relying-party config comes from Convex environment variables:
 *   WEBAUTHN_RP_ID     e.g. "hr.donjoafrica.com"   (default: "localhost")
 *   WEBAUTHN_RP_NAME   e.g. "Donjo"                (default: "Donjo")
 *   WEBAUTHN_ORIGINS   comma list of allowed origins, e.g. "https://hr.donjoafrica.com"
 *                                                  (default: "http://localhost:8081")
 */
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { createHmac } from "node:crypto";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";

function rpConfig() {
  const rpID = (process.env.WEBAUTHN_RP_ID || "localhost").trim();
  const rpName = (process.env.WEBAUTHN_RP_NAME || "Donjo").trim();
  const origins = (process.env.WEBAUTHN_ORIGINS || "http://localhost:8081")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return { rpID, rpName, origins };
}

/** Extract the base64url challenge the browser signed, from clientDataJSON. */
function challengeFromClientData(clientDataJSON: unknown): string | null {
  if (typeof clientDataJSON !== "string") return null;
  try {
    const parsed = JSON.parse(Buffer.from(clientDataJSON, "base64url").toString("utf8"));
    return typeof parsed.challenge === "string" ? parsed.challenge : null;
  } catch {
    return null;
  }
}

/**
 * Deterministic, per-email fake credential id. Used so that an email-first request for an
 * unknown / passkey-less account is indistinguishable from a real one (no enumeration).
 */
function decoyCredentialId(email: string): string {
  const key = process.env.JWT_PRIVATE_KEY || "donjo-decoy";
  return createHmac("sha256", key).update(`decoy:${email.trim().toLowerCase()}`).digest("base64url");
}

// ---------------------------------------------------------------------------
// Registration (signed-in user)
// ---------------------------------------------------------------------------

export const registrationOptions = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const { rpID, rpName } = rpConfig();

    const [info, existing] = await Promise.all([
      ctx.runQuery(internal.passkeys.getUserInfo, { userId }),
      ctx.runQuery(internal.passkeys.listForUser, { userId }),
    ]);
    const userName = info?.email || info?.name || String(userId);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userName,
      userDisplayName: info?.name || userName,
      userID: new TextEncoder().encode(String(userId)),
      attestationType: "none",
      excludeCredentials: existing.map((p) => ({
        id: p.credentialId,
        transports: p.transports as AuthenticatorTransport[] | undefined,
      })),
      // Discoverable credential + user verification => usernameless sign-in works.
      authenticatorSelection: { residentKey: "required", userVerification: "required" },
    });

    await ctx.runMutation(internal.passkeys.createChallenge, {
      challenge: options.challenge,
      type: "registration",
      userId,
    });
    return options;
  },
});

export const verifyRegistration = action({
  args: { response: v.any(), deviceLabel: v.optional(v.string()) },
  handler: async (ctx, { response, deviceLabel }): Promise<{ ok: boolean; error?: string; passkeyId?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { ok: false, error: "Please sign in again and retry." };
    const { rpID, origins } = rpConfig();

    const reg = response as RegistrationResponseJSON;
    const challenge = challengeFromClientData(reg?.response?.clientDataJSON);
    if (!challenge) return { ok: false, error: "Invalid passkey response." };

    // Single-use: the challenge is deleted here whether or not verification succeeds.
    const fresh = await ctx.runMutation(internal.passkeys.consumeChallenge, {
      challenge,
      type: "registration",
      userId,
    });
    if (!fresh) return { ok: false, error: "That request expired. Please try again." };

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: reg,
        expectedChallenge: challenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        requireUserVerification: true,
      });
    } catch {
      return { ok: false, error: "We could not verify that passkey. Please try again." };
    }
    if (!verification.verified || !verification.registrationInfo) {
      return { ok: false, error: "We could not verify that passkey. Please try again." };
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;
    try {
      const passkeyId = await ctx.runMutation(internal.passkeys.insertPasskey, {
        userId,
        credentialId: credential.id,
        publicKey: Buffer.from(credential.publicKey).toString("base64url"),
        counter: credential.counter,
        transports: credential.transports as string[] | undefined,
        deviceLabel: (deviceLabel || "").trim().slice(0, 60) || "My passkey",
        deviceType: credentialDeviceType,
        backedUp: credentialBackedUp,
      });
      return { ok: true, passkeyId };
    } catch {
      return { ok: false, error: "This passkey is already registered." };
    }
  },
});

// ---------------------------------------------------------------------------
// Authentication (public; consumed by the "passkey" ConvexCredentials provider)
// ---------------------------------------------------------------------------

export const authenticationOptions = action({
  args: { email: v.optional(v.string()) },
  handler: async (ctx, { email }) => {
    const { rpID } = rpConfig();

    let allowCredentials: { id: string; transports?: AuthenticatorTransport[] }[] | undefined;
    const trimmed = email?.trim();
    if (trimmed) {
      const passkeys = await ctx.runQuery(internal.passkeys.listForEmail, { email: trimmed });
      allowCredentials = passkeys.length
        ? passkeys.map((p) => ({
            id: p.credentialId,
            transports: p.transports as AuthenticatorTransport[] | undefined,
          }))
        : [{ id: decoyCredentialId(trimmed), transports: ["internal"] }];
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "required",
      allowCredentials, // undefined => discoverable / usernameless
    });
    await ctx.runMutation(internal.passkeys.createChallenge, {
      challenge: options.challenge,
      type: "authentication",
    });
    return options;
  },
});

/**
 * Verifies a WebAuthn assertion. Returns the user id on success, null on ANY failure
 * (callers must not reveal why). Called from the "passkey" provider in convex/auth.ts.
 */
export const verifyAuthentication = internalAction({
  args: { response: v.string() },
  handler: async (ctx, { response }): Promise<string | null> => {
    const { rpID, origins } = rpConfig();
    let assertion: AuthenticationResponseJSON;
    try {
      assertion = JSON.parse(response);
    } catch {
      return null;
    }
    if (!assertion?.id || !assertion.response) return null;

    const challenge = challengeFromClientData(assertion.response.clientDataJSON);
    if (!challenge) return null;

    // Single-use + expiry. Burned even if the rest fails, so a captured assertion is worthless.
    const fresh = await ctx.runMutation(internal.passkeys.consumeChallenge, {
      challenge,
      type: "authentication",
    });
    if (!fresh) return null;

    const stored = await ctx.runQuery(internal.passkeys.getByCredentialId, {
      credentialId: assertion.id,
    });
    if (!stored) return null;
    if (await ctx.runQuery(internal.passkeys.isSuspended, { userId: stored.userId })) return null;

    // Discoverable credentials return the user handle we set at registration.
    const handle = assertion.response.userHandle;
    if (handle) {
      const handleUser = Buffer.from(handle, "base64url").toString("utf8");
      if (handleUser !== String(stored.userId)) return null;
    }

    try {
      const verification = await verifyAuthenticationResponse({
        response: assertion,
        expectedChallenge: challenge,
        expectedOrigin: origins,
        expectedRPID: rpID,
        requireUserVerification: true,
        credential: {
          id: stored.credentialId,
          publicKey: new Uint8Array(Buffer.from(stored.publicKey, "base64url")),
          counter: stored.counter,
          transports: stored.transports as AuthenticatorTransport[] | undefined,
        },
      });
      if (!verification.verified) return null;
      await ctx.runMutation(internal.passkeys.recordUse, {
        passkeyId: stored._id,
        newCounter: verification.authenticationInfo.newCounter,
      });
      return String(stored.userId);
    } catch {
      // signature/origin/rpID/UV failure or counter regression (cloned authenticator)
      return null;
    }
  },
});
