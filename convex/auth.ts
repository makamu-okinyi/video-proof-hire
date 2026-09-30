import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { ConvexCredentials } from "@convex-dev/auth/providers/ConvexCredentials";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/**
 * Passkey (WebAuthn) sign-in. The browser posts the assertion as a JSON string; the
 * heavy verification (challenge, origin, rpID, signature, counter, user verification)
 * lives in the "use node" action internal.passkeysNode.verifyAuthentication.
 */
const Passkey = ConvexCredentials({
  id: "passkey",
  authorize: async (credentials, ctx) => {
    const response = credentials.response;
    if (typeof response !== "string" || response.length > 20000) return null;
    const userId: string | null = await ctx.runAction(
      internal.passkeysNode.verifyAuthentication,
      { response }
    );
    return userId ? { userId: userId as Id<"users"> } : null;
  },
});

// Google sign-in. Requires AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET on the Convex deployment
// (see README). Apple sign-in is intentionally not offered.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Passkey, Google],
});
