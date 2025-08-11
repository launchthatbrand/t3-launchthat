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
import type * as core_accessControl_helpers from "../core/accessControl/helpers.js";
import type * as core_accessControl_mutations from "../core/accessControl/mutations.js";
import type * as core_accessControl_queries from "../core/accessControl/queries.js";
import type * as core_accessControl_types from "../core/accessControl/types.js";
import type * as core_categories_mutations from "../core/categories/mutations.js";
import type * as core_categories_queries from "../core/categories/queries.js";
import type * as core_lib_auth from "../core/lib/auth.js";
import type * as core_lib_index from "../core/lib/index.js";
import type * as core_lib_permissions from "../core/lib/permissions.js";
import type * as ecommerce_balances_mutations from "../ecommerce/balances/mutations.js";
import type * as ecommerce_balances_queries from "../ecommerce/balances/queries.js";
import type * as ecommerce_categories_helpers from "../ecommerce/categories/helpers.js";
import type * as ecommerce_categories_mutations from "../ecommerce/categories/mutations.js";
import type * as ecommerce_categories_queries from "../ecommerce/categories/queries.js";
import type * as ecommerce_orders_calendar from "../ecommerce/orders/calendar.js";
import type * as ecommerce_orders_mockData from "../ecommerce/orders/mockData.js";
import type * as ecommerce_orders_mutation from "../ecommerce/orders/mutation.js";
import type * as ecommerce_orders_mutations from "../ecommerce/orders/mutations.js";
import type * as ecommerce_orders_notes from "../ecommerce/orders/notes.js";
import type * as ecommerce_orders_queries from "../ecommerce/orders/queries.js";
import type * as ecommerce_products_helpers from "../ecommerce/products/helpers.js";
import type * as ecommerce_products_media from "../ecommerce/products/media.js";
import type * as ecommerce_products_mutations from "../ecommerce/products/mutations.js";
import type * as ecommerce_products_queries from "../ecommerce/products/queries.js";
import type * as ecommerce_products_uploads from "../ecommerce/products/uploads.js";
import type * as ecommerce_queries from "../ecommerce/queries.js";
import type * as groups_index from "../groups/index.js";
import type * as groups_lib_dashboards from "../groups/lib/dashboards.js";
import type * as groups_lib_helpers from "../groups/lib/helpers.js";
import type * as groups_lib_index from "../groups/lib/index.js";
import type * as groups_lib_permissions from "../groups/lib/permissions.js";
import type * as groups_mutations from "../groups/mutations.js";
import type * as groups_posts from "../groups/posts.js";
import type * as groups_queries from "../groups/queries.js";
import type * as groups_schema_groupsSchema from "../groups/schema/groupsSchema.js";
import type * as groups_schema_index from "../groups/schema/index.js";
import type * as groups_schema_types from "../groups/schema/types.js";
import type * as lib_db from "../lib/db.js";
import type * as lib_fileTypes from "../lib/fileTypes.js";
import type * as lib_permissions_hasPermission from "../lib/permissions/hasPermission.js";
import type * as lib_permissions_index from "../lib/permissions/index.js";
import type * as lib_permissions_requirePermission from "../lib/permissions/requirePermission.js";
import type * as lib_permissions_userAuth from "../lib/permissions/userAuth.js";
import type * as lib_queryAnalyzer from "../lib/queryAnalyzer.js";
import type * as lib_slugs from "../lib/slugs.js";
import type * as lms_courses_helpers from "../lms/courses/helpers.js";
import type * as lms_courses_mutations from "../lms/courses/mutations.js";
import type * as lms_courses_queries from "../lms/courses/queries.js";
import type * as lms_lessons_helpers from "../lms/lessons/helpers.js";
import type * as lms_lessons_mutations from "../lms/lessons/mutations.js";
import type * as lms_lessons_queries from "../lms/lessons/queries.js";
import type * as lms_quizzes_helpers from "../lms/quizzes/helpers.js";
import type * as lms_quizzes_mutations from "../lms/quizzes/mutations.js";
import type * as lms_quizzes_queries from "../lms/quizzes/queries.js";
import type * as lms_topics_helpers from "../lms/topics/helpers.js";
import type * as lms_topics_mutations from "../lms/topics/mutations.js";
import type * as lms_topics_queries from "../lms/topics/queries.js";
import type * as shared_auth from "../shared/auth.js";
import type * as shared_constants from "../shared/constants.js";
import type * as shared_dates from "../shared/dates.js";
import type * as shared_errors from "../shared/errors.js";
import type * as shared_formatting from "../shared/formatting.js";
import type * as shared_index from "../shared/index.js";
import type * as shared_pagination from "../shared/pagination.js";
import type * as shared_search from "../shared/search.js";
import type * as shared_validation from "../shared/validation.js";
import type * as shared_validators from "../shared/validators.js";
import type * as users_helpers from "../users/helpers.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as users_schema_types from "../users/schema/types.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "core/accessControl/helpers": typeof core_accessControl_helpers;
  "core/accessControl/mutations": typeof core_accessControl_mutations;
  "core/accessControl/queries": typeof core_accessControl_queries;
  "core/accessControl/types": typeof core_accessControl_types;
  "core/categories/mutations": typeof core_categories_mutations;
  "core/categories/queries": typeof core_categories_queries;
  "core/lib/auth": typeof core_lib_auth;
  "core/lib/index": typeof core_lib_index;
  "core/lib/permissions": typeof core_lib_permissions;
  "ecommerce/balances/mutations": typeof ecommerce_balances_mutations;
  "ecommerce/balances/queries": typeof ecommerce_balances_queries;
  "ecommerce/categories/helpers": typeof ecommerce_categories_helpers;
  "ecommerce/categories/mutations": typeof ecommerce_categories_mutations;
  "ecommerce/categories/queries": typeof ecommerce_categories_queries;
  "ecommerce/orders/calendar": typeof ecommerce_orders_calendar;
  "ecommerce/orders/mockData": typeof ecommerce_orders_mockData;
  "ecommerce/orders/mutation": typeof ecommerce_orders_mutation;
  "ecommerce/orders/mutations": typeof ecommerce_orders_mutations;
  "ecommerce/orders/notes": typeof ecommerce_orders_notes;
  "ecommerce/orders/queries": typeof ecommerce_orders_queries;
  "ecommerce/products/helpers": typeof ecommerce_products_helpers;
  "ecommerce/products/media": typeof ecommerce_products_media;
  "ecommerce/products/mutations": typeof ecommerce_products_mutations;
  "ecommerce/products/queries": typeof ecommerce_products_queries;
  "ecommerce/products/uploads": typeof ecommerce_products_uploads;
  "ecommerce/queries": typeof ecommerce_queries;
  "groups/index": typeof groups_index;
  "groups/lib/dashboards": typeof groups_lib_dashboards;
  "groups/lib/helpers": typeof groups_lib_helpers;
  "groups/lib/index": typeof groups_lib_index;
  "groups/lib/permissions": typeof groups_lib_permissions;
  "groups/mutations": typeof groups_mutations;
  "groups/posts": typeof groups_posts;
  "groups/queries": typeof groups_queries;
  "groups/schema/groupsSchema": typeof groups_schema_groupsSchema;
  "groups/schema/index": typeof groups_schema_index;
  "groups/schema/types": typeof groups_schema_types;
  "lib/db": typeof lib_db;
  "lib/fileTypes": typeof lib_fileTypes;
  "lib/permissions/hasPermission": typeof lib_permissions_hasPermission;
  "lib/permissions/index": typeof lib_permissions_index;
  "lib/permissions/requirePermission": typeof lib_permissions_requirePermission;
  "lib/permissions/userAuth": typeof lib_permissions_userAuth;
  "lib/queryAnalyzer": typeof lib_queryAnalyzer;
  "lib/slugs": typeof lib_slugs;
  "lms/courses/helpers": typeof lms_courses_helpers;
  "lms/courses/mutations": typeof lms_courses_mutations;
  "lms/courses/queries": typeof lms_courses_queries;
  "lms/lessons/helpers": typeof lms_lessons_helpers;
  "lms/lessons/mutations": typeof lms_lessons_mutations;
  "lms/lessons/queries": typeof lms_lessons_queries;
  "lms/quizzes/helpers": typeof lms_quizzes_helpers;
  "lms/quizzes/mutations": typeof lms_quizzes_mutations;
  "lms/quizzes/queries": typeof lms_quizzes_queries;
  "lms/topics/helpers": typeof lms_topics_helpers;
  "lms/topics/mutations": typeof lms_topics_mutations;
  "lms/topics/queries": typeof lms_topics_queries;
  "shared/auth": typeof shared_auth;
  "shared/constants": typeof shared_constants;
  "shared/dates": typeof shared_dates;
  "shared/errors": typeof shared_errors;
  "shared/formatting": typeof shared_formatting;
  "shared/index": typeof shared_index;
  "shared/pagination": typeof shared_pagination;
  "shared/search": typeof shared_search;
  "shared/validation": typeof shared_validation;
  "shared/validators": typeof shared_validators;
  "users/helpers": typeof users_helpers;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "users/schema/types": typeof users_schema_types;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
