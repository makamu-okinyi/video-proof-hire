/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as admin from "../admin.js";
import type * as adminGeo from "../adminGeo.js";
import type * as adminModeration from "../adminModeration.js";
import type * as adminOverview from "../adminOverview.js";
import type * as adminReview from "../adminReview.js";
import type * as adminSystem from "../adminSystem.js";
import type * as adminUsers from "../adminUsers.js";
import type * as adminVelocity from "../adminVelocity.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as challenges from "../challenges.js";
import type * as crons from "../crons.js";
import type * as employer from "../employer.js";
import type * as http from "../http.js";
import type * as jobs from "../jobs.js";
import type * as lib_admin from "../lib/admin.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_kenya from "../lib/kenya.js";
import type * as lib_legal from "../lib/legal.js";
import type * as lib_plans from "../lib/plans.js";
import type * as lib_review from "../lib/review.js";
import type * as lib_tz from "../lib/tz.js";
import type * as messages from "../messages.js";
import type * as notifications from "../notifications.js";
import type * as passkeys from "../passkeys.js";
import type * as passkeysNode from "../passkeysNode.js";
import type * as plans from "../plans.js";
import type * as profiles from "../profiles.js";
import type * as shortlists from "../shortlists.js";
import type * as ventures from "../ventures.js";
import type * as videos from "../videos.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  admin: typeof admin;
  adminGeo: typeof adminGeo;
  adminModeration: typeof adminModeration;
  adminOverview: typeof adminOverview;
  adminReview: typeof adminReview;
  adminSystem: typeof adminSystem;
  adminUsers: typeof adminUsers;
  adminVelocity: typeof adminVelocity;
  analytics: typeof analytics;
  auth: typeof auth;
  challenges: typeof challenges;
  crons: typeof crons;
  employer: typeof employer;
  http: typeof http;
  jobs: typeof jobs;
  "lib/admin": typeof lib_admin;
  "lib/auth": typeof lib_auth;
  "lib/kenya": typeof lib_kenya;
  "lib/legal": typeof lib_legal;
  "lib/plans": typeof lib_plans;
  "lib/review": typeof lib_review;
  "lib/tz": typeof lib_tz;
  messages: typeof messages;
  notifications: typeof notifications;
  passkeys: typeof passkeys;
  passkeysNode: typeof passkeysNode;
  plans: typeof plans;
  profiles: typeof profiles;
  shortlists: typeof shortlists;
  ventures: typeof ventures;
  videos: typeof videos;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
