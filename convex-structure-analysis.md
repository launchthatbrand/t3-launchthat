# Convex Folder Structure Analysis

## Overview

The Convex folder contains **308 files** across **multiple organizational patterns**. This analysis reveals significant inconsistencies in structure and naming conventions that need to be addressed during refactoring.

## Root Level Files (❌ Inconsistent Pattern)

```
convex/
├── accessControl.ts          # Auth & permissions logic
├── auth.config.ts            # Auth configuration
├── cart.ts                   # E-commerce cart (should be in ecommerce/)
├── convex.config.ts          # Convex configuration
├── core.ts                   # Core utilities
├── downloads.ts              # Downloads (duplicates downloads/ folder)
├── downloadsLibrary.ts       # Downloads library
├── ecommerce.ts              # E-commerce (duplicates ecommerce/ folder)
├── env.ts                    # Environment variables
├── groupPosts.ts             # Group posts
├── groups.ts                 # Groups (duplicates groups/ folder)
├── helpdesk.ts               # Helpdesk functionality
├── http.ts                   # HTTP endpoints
├── orders.ts                 # Orders (should be in ecommerce/)
├── permissionsUtils.ts       # Permissions utilities
├── permissions.functions.ts  # Permissions functions
├── posts.ts                  # Posts
├── roles.functions.ts        # Roles functions
├── roles.ts                  # Roles
├── schema.ts                 # Main schema file
├── search.ts                 # Search functionality
├── seedPermissions.ts        # Permission seeding
├── test_schema.ts            # Test schema
├── topics.ts                 # Topics
├── users.ts                  # Users (duplicates users/ folder)
├── versionControl.ts         # Version control
└── [Documentation files]
```

## Feature Folders (✅ Better Pattern)

### 1. Calendar Management

```
calendar/
├── attendance/
│   ├── index.ts
│   ├── mutations.ts
│   └── queries.ts
├── events/
│   ├── crud.ts
│   ├── index.ts
│   ├── mutations.ts
│   └── queries.ts
├── lib/
│   ├── authUtils.ts
│   ├── dateUtils.ts
│   └── index.ts
├── reminders/
│   ├── index.ts
│   ├── mutations.ts
│   └── queries.ts
├── schema/
│   ├── calendarSchema.ts
│   └── index.ts
├── attendees.ts
├── crud.ts
├── index.ts
├── invitations.ts
├── permissions.ts
├── queries.ts
├── reminders.ts
└── schema.ts
```

### 2. E-commerce (Complex Structure)

```
ecommerce/
├── balances/
├── cart/
├── categories/
├── chargebacks/
├── checkout/
├── orders/
├── payments/
├── products/
├── schema/        # 15 schema files
├── transfers/
├── variations/
├── index.ts
└── lib/
```

### 3. Learning Management System (LMS)

```
lms/
├── contentAccess/
├── courses/
├── enrollments/
├── lessons/
├── progress/
├── quizzes/
├── topics/
├── schema/
├── index.ts
└── lib/
```

### 4. Content Management System (CMS)

```
cms/
├── init/
├── lib/
├── schema/
├── categories.ts
├── contentTypes.ts
├── index.ts
├── menus.ts
├── mutations.ts
├── queries.ts
└── README.md
```

### 5. Users Management

```
users/
├── marketingTags/
├── schema/
├── lib/
├── index.ts
├── mockData.ts
├── mutations.ts
└── queries.ts
```

### 6. Organizations

```
organizations/
├── helpers.ts
├── index.ts
├── mutations.ts
├── queries.ts
├── schema.ts
└── seed.ts
```

## Major Issues Identified

### 1. Duplicate Patterns (❌ High Priority)

- **`users.ts` (root) vs `users/` folder**
- **`ecommerce.ts` (root) vs `ecommerce/` folder**
- **`downloads.ts` (root) vs `downloads/` folder**
- **`groups.ts` (root) vs `groups/` folder**

### 2. Inconsistent File Organization (❌ Medium Priority)

- **E-commerce files scattered**: `cart.ts`, `orders.ts` in root instead of `ecommerce/`
- **Permission files scattered**: `accessControl.ts`, `permissionsUtils.ts`, `permissions.functions.ts`, `roles.functions.ts` in root
- **Mixed patterns**: Some features use folders, others single files

### 3. Legacy Files (❌ Low Priority)

- **Test files**: `test_schema.ts`
- **Backup files**: `posts.ts.bak`, `courses.ts.old`, `ecommerce.ts.old`

### 4. Inconsistent Naming (❌ Medium Priority)

- **Singular vs Plural**: `users/` vs `user.ts`, `groups/` vs `group.ts`
- **Function files**: `.functions.ts` vs `/functions.ts`
- **Index files**: Some folders have `index.ts`, others don't

## Current API Call Patterns

Based on the structure, current API calls would be:

```typescript
// Root level files
api.users.functionName; // from users.ts
api.ecommerce.functionName; // from ecommerce.ts
api.search.functionName; // from search.ts

// Folder-based files
api.users.mutations.functionName; // from users/mutations.ts
api.users.queries.functionName; // from users/queries.ts
api.calendar.events.queries.functionName; // from calendar/events/queries.ts
api.ecommerce.orders.index.functionName; // from ecommerce/orders/index.ts
```

## Schema Organization Issues

- **Multiple schema files per feature**: Most folders have both `schema.ts` and `schema/` folder
- **Inconsistent schema exports**: Some use barrel exports (`index.ts`), others don't
- **Root schema complexity**: Main `schema.ts` must import from all these locations

## Recommendations for Refactoring

### 1. Standardize Feature Structure

Each feature should follow this exact pattern:

```
feature/
├── queries.ts      # All read operations
├── mutations.ts    # All write operations
├── helpers.ts      # Shared utilities (optional)
└── schema.ts       # Table definitions
```

### 2. Feature Consolidation

- **Users**: Merge `users.ts` → `users/`
- **E-commerce**: Merge `cart.ts`, `orders.ts`, `ecommerce.ts` → `ecommerce/`
- **Groups**: Merge `groups.ts`, `groupPosts.ts` → `groups/`
- **Permissions**: Consolidate all permission files → `permissions/`

### 3. Root Level Cleanup

Keep only:

- `schema.ts` (combined schemas)
- `http.ts` (HTTP endpoints)
- `auth.config.ts` (auth configuration)
- `env.ts` (environment variables)

### 4. Remove Duplicates

- Delete root-level files that have folder equivalents
- Remove `.old` and `.bak` files
- Consolidate test files

## Feature Modules Identified

1. **auth** - Authentication & authorization
2. **users** - User management
3. **organizations** - Multi-tenant organizations
4. **permissions** - Access control & roles
5. **ecommerce** - Products, orders, payments
6. **lms** - Learning management system
7. **cms** - Content management
8. **calendar** - Events & scheduling
9. **media** - File & media management
10. **notifications** - System notifications
11. **groups** - User groups & social features
12. **integrations** - Third-party integrations
13. **socialfeed** - Social media features
14. **downloads** - File downloads
15. **contacts** - Contact management
16. **tasks** - Task management
17. **vimeo** - Video platform integration

## Next Steps

1. **Analyze API usage patterns** in the application
2. **Identify circular dependencies** using the generated dependency graph
3. **Plan migration strategy** for each feature module
4. **Create standardized templates** for the new structure
