/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentAuth from "../agentAuth.js";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as http from "../http.js";
import type * as labels from "../labels.js";
import type * as points from "../points.js";
import type * as profile from "../profile.js";
import type * as seed from "../seed.js";
import type * as skills from "../skills.js";
import type * as social from "../social.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentAuth: typeof agentAuth;
  auth: typeof auth;
  comments: typeof comments;
  http: typeof http;
  labels: typeof labels;
  points: typeof points;
  profile: typeof profile;
  seed: typeof seed;
  skills: typeof skills;
  social: typeof social;
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
