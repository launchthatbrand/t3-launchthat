/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as batch from "../batch.js";
import type * as constants from "../constants.js";
import type * as emailParser from "../emailParser.js";
import type * as emails from "../emails.js";
import type * as env from "../env.js";
import type * as errors from "../errors.js";
import type * as fields from "../fields.js";
import type * as fieldsStore from "../fieldsStore.js";
import type * as gmail from "../gmail.js";
import type * as highlights from "../highlights.js";
import type * as highlightsStore from "../highlightsStore.js";
import type * as http from "../http.js";
import type * as parsedResults from "../parsedResults.js";
import type * as performance from "../performance.js";
import type * as permissions from "../permissions.js";
import type * as roles from "../roles.js";
import type * as sharing from "../sharing.js";
import type * as templates from "../templates.js";
import type * as types from "../types.js";
import type * as userRoles from "../userRoles.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  batch: typeof batch;
  constants: typeof constants;
  emailParser: typeof emailParser;
  emails: typeof emails;
  env: typeof env;
  errors: typeof errors;
  fields: typeof fields;
  fieldsStore: typeof fieldsStore;
  gmail: typeof gmail;
  highlights: typeof highlights;
  highlightsStore: typeof highlightsStore;
  http: typeof http;
  parsedResults: typeof parsedResults;
  performance: typeof performance;
  permissions: typeof permissions;
  roles: typeof roles;
  sharing: typeof sharing;
  templates: typeof templates;
  types: typeof types;
  userRoles: typeof userRoles;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
