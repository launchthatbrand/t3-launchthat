# Product Requirements Document: Convex Backend Refactor

**Project:** Portal Application - Convex Backend Improvement

**Date:** 2024-10-27

**Author:** AI Assistant (Gemini 2.5 Pro)

**Version:** 1.0

## 1. Introduction

This document outlines the requirements for refactoring and reorganizing the Convex backend codebase located in `apps/portal/convex/`. The primary goals are to enhance modularity, improve code clarity and maintainability, reduce redundancy by extracting common logic, and enforce consistent coding patterns across the backend.

## 2. Goals

- **Improved Modularity:** Organize Convex files (schemas, queries, mutations, actions) into a clear, feature-based directory structure.
- **Reduced Redundancy (DRY):** Identify and extract common logic and utility functions into shared modules.
- **Enhanced Consistency:** Establish and apply consistent coding patterns, naming conventions, function signatures, and error handling mechanisms.
- **Increased Maintainability:** Make the codebase easier to understand, modify, and extend.
- **Better Scalability:** Structure the backend to more easily accommodate future features and growth.

## 3. Scope

- **In Scope:**
  - Analyzing all existing files within the `apps/portal/convex/` directory.
  - Restructuring the directory layout based on primary use cases/features.
  - Refactoring existing queries, mutations, and actions to extract shared logic.
  - Defining and applying consistent coding patterns and best practices for Convex development (as per established project rules and Convex official guidelines).
  - Updating internal references (e.g., `api.*`, `internal.*`) as needed due to file moves.
  - Ensuring all existing functionality remains intact post-refactor.
- **Out of Scope:**
  - Implementing new features.
  - Changing existing business logic beyond what is necessary for refactoring (e.g., altering how a permission check works fundamentally, unless it\'s to standardize its application).
  - Modifying frontend code (`apps/portal/src/`), except where necessary to update tRPC calls or Convex client interactions affected by backend path changes.
  - Database schema changes that alter data semantics (though table definitions might move files).

## 4. Target Users

- Developers working on the portal application.
- Future developers who will need to understand and contribute to the backend.

## 5. User Stories / Requirements

### 5.1. Directory Structure and Organization

- **REQ-STRUCT-001:** As a developer, I want Convex files to be organized into feature-specific directories so that I can easily locate code related to a particular domain (e.g., `ecommerce/`, `lms/`, `users/`, `permissions/`, `groups/`, `downloads/`, `calendar/`, `notifications/`, `cms/`).
- **REQ-STRUCT-002:** As a developer, I want a dedicated directory (e.g., `shared/` or `utils/` or `lib/` at the root of `convex/`) for truly global utility functions, shared schema components (like common `v.object` definitions if applicable beyond one feature), and core helper functions that are used across multiple features.
- **REQ-STRUCT-003:** As a developer, I want schema definitions (`*.schema.ts` or `schema.ts` within a feature folder) to be co-located with their corresponding logic files (queries, mutations, actions) within the same feature directory.
- **REQ-STRUCT-004:** As a developer, I want the top-level `convex/schema.ts` to primarily be an aggregation point for schemas defined in feature-specific directories, minimizing direct table definitions within it unless they are truly global.
- **REQ-STRUCT-005:** As a developer, I want files related to a specific sub-feature (e.g., `cart`, `checkout`, `orders` within `ecommerce`) to potentially be sub-directories or clearly named files within their parent feature directory.

### 5.2. Code Refactoring and DRY Principles

- **REQ-REFACTOR-001:** As a developer, I want common data validation logic (beyond simple `v.*` calls, e.g., complex object validations reused in multiple functions) to be extracted into reusable helper functions.
- **REQ-REFACTOR-002:** As a developer, I want repeated sequences of database queries or common data transformation patterns to be encapsulated in internal helper functions within their respective feature modules or shared utilities if applicable.
- **REQ-REFACTOR-003:** As a developer, I want helper functions like `getAuthenticatedUserId` to be consistently used wherever user authentication is required, avoiding direct calls to `ctx.auth.getUserIdentity()` and subsequent user lookups in business logic files.
- **REQ-REFACTOR-004:** As a developer, I want permission checking logic to consistently use the `hasPermission` and `requirePermission` utilities from `convex/permissions.ts` (or its new location), avoiding custom permission check implementations.
- **REQ-REFACTOR-005:** As a developer, I want to ensure that any sensitive operations are properly guarded by `internalMutation` or `internalAction` and not unnecessarily exposed as public functions.

### 5.3. Coding Standards and Consistency

- **REQ-CONSIST-001:** As a developer, I want all Convex functions (queries, mutations, actions) to adhere to a consistent naming convention (e.g., `verbNoun` like `getProduct`, `createUser`, `generateInvoiceAction`).
- **REQ-CONSIST-002:** As a developer, I want all Convex functions to include explicit `args` and `returns` validators, using `v.null()` for functions that do not return a meaningful value.
- **REQ-CONSIST-003:** As a developer, I want consistent error handling patterns, throwing specific, informative errors (e.g., `throw new Error("Product not found")`) rather than generic ones.
- **REQ-CONSIST-004:** As a developer, I want TypeScript types (e.g., `Doc`, `Id`, custom types) to be used consistently and correctly, especially for function arguments and return values.
- **REQ-CONSIST-005:** As a developer, I want imports to be organized (e.g., Convex imports, then local module imports).
- **REQ-CONSIST-006:** As a developer, I want file-based routing to be respected, and function references (`api.*`, `internal.*`) to be accurate after any refactoring.
- **REQ-CONSIST-007:** As a developer, I want all schema definitions to follow Convex best practices, including appropriate indexing for query performance. System fields (`_id`, `_creationTime`) should not be redefined.
- **REQ-CONSIST-008:** As a developer, I want constants (e.g., permission keys, status literals) to be defined and used consistently, preferably from a central location if shared across modules.
- **REQ-CONSIST-009:** As a developer, I want comments to be used judiciously to explain non-obvious logic or important decisions.

## 6. Proposed Directory Structure (Example)

This is a potential target structure. The actual structure will be determined during the analysis phase.

```
apps/portal/convex/
├── ecommerce/
│   ├── cart.ts
│   ├── checkout.ts
│   ├── orders.ts
│   ├── products.ts
│   ├── variations.ts
│   ├── schema/  // or ecommerce.schema.ts, cart.schema.ts etc.
│   │   ├── cartSchema.ts
│   │   ├── productsSchema.ts
│   │   └── index.ts // exports combined ecommerce schemas
│   └── lib/ // ecommerce specific helpers
├── lms/ // Learning Management System
│   ├── courses.ts
│   ├── topics.ts
│   ├── enrollments.ts
│   ├── schema/
│   └── lib/
├── users/
│   ├── users.ts
│   ├── users.schema.ts
│   └── lib/
├── permissions/
│   ├── permissions.ts
│   ├── roles.ts
│   ├── permissions.schema.ts // (or roles.schema.ts etc.)
│   └── lib/ // (permissions.functions.ts, roles.functions.ts could be here or merged)
├── groups/
│   ├── groups.ts
│   ├── posts.ts // group posts
│   ├── schema/
│   └── lib/
├── downloads/
│   ├── downloads.ts
│   ├── downloads.schema.ts
│   └── lib/
├── calendar/
│   ├── calendar.ts
│   ├── events.ts
│   ├── schema/
│   └── lib/
├── notifications/
│   ├── notifications.ts
│   ├── notifications.schema.ts
│   └── lib/
├── cms/ // Content Management (ConvexCMS related)
│   ├── posts.ts // (if different from group posts, e.g. blog)
│   ├── schema/
│   └── lib/
├── admin/ // Admin panel specific backend functions
│   ├── dashboard.ts
│   ├── settings.ts
│   └── lib/
├── shared/ // or utils/ or lib/ (for truly global utilities)
│   ├── constants.ts
│   ├── pagination.ts
│   ├── validationHelpers.ts
│   └── index.ts
├── actions/ // Global actions not tied to a specific feature
├── _generated/
├── schema.ts       // Main schema aggregator
├── http.ts         // Root HTTP actions
├── auth.config.ts
├── convex.json
├── env.ts
└── tsconfig.json
```

## 7. Non-Functional Requirements

- **NFR-PERF-001:** The refactoring should not negatively impact the performance of existing queries, mutations, or actions.
- **NFR-TEST-001:** (If tests exist) Existing automated tests should pass after refactoring. (If not, manual testing of key flows will be required).
- **NFR-DEPLOY-001:** The refactored code should be deployable through the existing CI/CD pipeline.

## 8. Open Questions / Areas for Further Discussion

- What is the exact strategy for identifying "consistent code patterns"? Should we define a style guide snippet or refer to specific existing files as exemplars?
- How will the impact on the frontend (tRPC calls, Convex client usage) be managed if paths to Convex functions change?
- What is the process for reviewing the proposed refactoring changes?
- Will a new `.windsurfrules` or similar project-specific linting/rule set be created based on the outcome of this refactor to enforce the new standards?

## 9. Future Considerations

- Automated linting rules to enforce the new directory structure and coding patterns.
- Enhanced test coverage for critical utility functions and core logic.

This PRD will serve as the guiding document for the Task Master tasks related to this refactoring effort.
