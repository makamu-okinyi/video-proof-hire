import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
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

// TODO(social sign-in): Google and Apple are shown as "Coming soon" placeholders in the UI.
// Once the client supplies credentials, set AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET (Google) and
// AUTH_APPLE_ID / AUTH_APPLE_SECRET (Apple) with `npx convex env set`, then re-add the
// providers here:
//   import Google from "@auth/core/providers/google";
//   import Apple from "@auth/core/providers/apple";
//   providers: [Password, Passkey, Google, Apple]
// and enable the buttons in src/components/auth/SocialAuthButtons.tsx.
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password, Passkey],
});
