import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Expired WebAuthn challenges are already unusable; this just keeps the table small.
crons.interval(
  "purge expired webauthn challenges",
  { minutes: 30 },
  internal.passkeys.purgeExpiredChallenges,
  {}
);

// First-party analytics retention (window is configurable in Admin > System).
crons.interval("prune analytics events", { hours: 6 }, internal.analytics.prune, {});

export default crons;
