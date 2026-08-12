import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

export const getCredential = internalQuery({
  args: { credentialId: v.string() },
  handler: async (ctx, { credentialId }) => {
    return await ctx.db
      .query("webauthnCredentials")
      .withIndex("by_credentialId", (q) => q.eq("credentialId", credentialId))
      .first();
  },
});

export const saveCredential = internalMutation({
  args: {
    userId: v.string(),
    credentialId: v.string(),
    publicKey: v.string(),
    counter: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webauthnCredentials")
      .withIndex("by_credentialId", (q) => q.eq("credentialId", args.credentialId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { counter: args.counter });
    } else {
      await ctx.db.insert("webauthnCredentials", args);
    }
  },
});

export const verify = internalAction({
  args: {
    credentialId: v.optional(v.string()),
    clientDataJSON: v.optional(v.string()),
    authenticatorData: v.optional(v.string()),
    signature: v.optional(v.string()),
    userHandle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.credentialId) {
      return { error: "Missing credential ID" };
    }
    const credential = await ctx.runQuery(internal.webauthn.getCredential, {
      credentialId: args.credentialId,
    });
    if (!credential) {
      return { error: "Credential not found" };
    }
    // In production, do full WebAuthn verification here
    // For now, return success with userId for session creation
    return { success: true, userId: credential.userId };
  },
});
