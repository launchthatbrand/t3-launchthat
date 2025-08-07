# Convex API Usage Patterns Analysis

## Overview

This analysis examines how the Convex API is currently being used throughout the application to understand the impact of refactoring and ensure no breaking changes.

## Most Frequently Used API Patterns

### Top 10 Most Called API Endpoints

1. **`api.groups.queries.getGroupById`** (8 occurrences)
2. **`api.organizations.queries.getPlans`** (7 occurrences)
3. **`api.lms.courses.queries.getCourseStructureWithItems`** (7 occurrences)
4. **`api.integrations.apps.queries.list`** (7 occurrences)
5. **`api.users.createOrGetUser`** (6 occurrences)
6. **`api.accessControl.checkIsAdmin`** (5 occurrences)
7. **`api.contacts.queries.getContact`** (4 occurrences)
8. **`api.calendar.queries.getEventById`** (4 occurrences)
9. **`api.ecommerce.categories.index.getProductCategories`** (4 occurrences)
10. **`api.calendar.queries.getCalendars`** (4 occurrences)

## Current API Calling Patterns Identified

### 1. **Root Level Files Pattern** (❌ Inconsistent)

```typescript
// Current calls to root-level files
api.users.functionName; // from users.ts
api.ecommerce.functionName; // from ecommerce.ts
api.cart.getCart; // from cart.ts
api.orders.getOrder; // from orders.ts
api.posts.getAll; // from posts.ts
api.groups.createGroup; // from groups.ts
api.search.globalSearch; // from search.ts
api.helpdesk.createHelpdeskArticle; // from helpdesk.ts
api.roles.getUserRoles; // from roles.ts
```

### 2. **Folder-based Pattern** (✅ Better Organization)

```typescript
// Feature folder with organized structure
api.lms.courses.queries.getCourseStructureWithItems;
api.lms.progress.index.completeCourse;
api.lms.topics.index.create;
api.lms.quizzes.index.update;

api.calendar.events.queries.getEvent;
api.calendar.reminders.setEventReminders;
api.calendar.crud.createEvent;

api.ecommerce.products.index.listProducts;
api.ecommerce.orders.index.createOrder;
api.ecommerce.cart.index.addToCart;
```

### 3. **Deep Nested Pattern** (❌ Overly Complex)

```typescript
api.ecommerce.checkout.customCheckouts.createCustomCheckoutSession;
api.ecommerce.chargebacks.evidence.getChargebackEvidence;
api.integrations.automationLogs.queries.getAutomationLogsByScenario;
api.notifications.preferences.updateNotificationPreferences;
api.socialfeed.schema.__tests__.mutations.test;
```

## Breaking Changes Impact Assessment

### High Risk Changes (❌ Major Refactoring Required)

#### 1. **Users Module Consolidation**

**Current Patterns:**

```typescript
api.users.createOrGetUser; // ROOT: users.ts
api.users.ensureUser; // ROOT: users.ts
api.users.getMe; // ROOT: users.ts
api.users.queries.getMe; // FOLDER: users/queries.ts
api.users.mutations.createSystemUserIfNeeded; // FOLDER: users/mutations.ts
api.users.marketingTags.index.assignMarketingTagToUser; // NESTED
```

**Required Changes:** 34+ files using users API calls
**Recommendation:** Migrate all to `api.users.queries.*` and `api.users.mutations.*`

#### 2. **E-commerce Module Consolidation**

**Current Patterns:**

```typescript
api.cart.getCart                  // ROOT: cart.ts (7 occurrences)
api.orders.getOrder              // ROOT: orders.ts
api.ecommerce.functionName       // ROOT: ecommerce.ts
api.ecommerce.products.index.*   // FOLDER: ecommerce/products/
api.ecommerce.orders.index.*     // FOLDER: ecommerce/orders/
```

**Required Changes:** 50+ files using e-commerce API calls
**Recommendation:** Consolidate all to `api.ecommerce.*` structure

#### 3. **Groups Module Consolidation**

**Current Patterns:**

```typescript
api.groups.createGroup; // ROOT: groups.ts
api.groups.mutations.joinGroup; // FOLDER: groups/mutations.ts
api.groups.queries.getGroupById; // FOLDER: groups/queries.ts (8 occurrences)
api.groupPosts.createComment; // ROOT: groupPosts.ts
```

**Required Changes:** 25+ files using groups API calls

### Medium Risk Changes (⚠️ Moderate Refactoring)

#### 4. **Permission/Auth Consolidation**

**Current Patterns:**

```typescript
api.accessControl.checkIsAdmin; // ROOT: accessControl.ts
api.permissions.checkPermission; // ROOT: permissions.functions.ts
api.roles.getUserRoles; // ROOT: roles.ts
api.permissionsUtils.hasPermission; // ROOT: permissionsUtils.ts
```

**Required Changes:** 15+ files using permission API calls

#### 5. **Media/Downloads Consolidation**

**Current Patterns:**

```typescript
api.downloads.generateUploadUrl; // ROOT: downloads.ts
api.downloads.listDownloads; // ROOT: downloads.ts
api.downloads.mutations.createFileDownload; // FOLDER: downloads/mutations.ts
api.downloadsLibrary.getAllDownloads; // ROOT: downloadsLibrary.ts
```

### Low Risk Changes (✅ Minimal Impact)

#### 6. **Well-Organized Modules**

These modules already follow good patterns:

- **`calendar/`** - Consistent structure with events/, reminders/, etc.
- **`cms/`** - Well-organized with clear separation
- **`integrations/`** - Complex but consistently organized
- **`organizations/`** - Simple, consistent structure

## TypeScript 'any' Type Issues

### Explicit 'any' Usage Found

```typescript
// Type inference issues causing 'any'
{existingPlans?.map((plan: any) => (       // Organizations
{plans?.map((plan: any) => (               // Plans
} catch (createError: any) {               // Error handling
const currentPlan = plans?.find((p: any)  // Plan filtering
const onSubmit = (data: any) => {         // Form data
api.notifications.createNotification as any  // Type casting
```

**Root Cause:** Inconsistent schema exports and circular dependencies preventing proper type inference.

## API Import Patterns

### Current Import Structure

```typescript
// Generated API imports (all files use this)
import { useMutation, useQuery } from "convex/react";

import { api } from "~/convex/_generated/api";

// Usage patterns vary by feature:
const user = useQuery(api.users.getMe); // Root level
const course = useQuery(api.lms.courses.queries.getCourse); // Nested
```

## Refactoring Migration Strategy

### Phase 1: Standardize Feature APIs (High Priority)

1. **Users**: `api.users.queries.*` / `api.users.mutations.*`
2. **E-commerce**: `api.ecommerce.queries.*` / `api.ecommerce.mutations.*`
3. **Groups**: `api.groups.queries.*` / `api.groups.mutations.*`
4. **Permissions**: `api.permissions.queries.*` / `api.permissions.mutations.*`

### Phase 2: Simplify Nested APIs (Medium Priority)

1. **Calendar**: Keep structure but simplify: `api.calendar.queries.*`
2. **LMS**: Reduce nesting: `api.lms.queries.*`
3. **Integrations**: Maintain structure (already well-organized)

### Phase 3: Schema Consolidation (Fix TypeScript Issues)

1. Consolidate schema exports in single files per feature
2. Remove circular dependencies
3. Ensure proper TypeScript inference

## Recommended Target API Structure

```typescript
// After refactoring - all features follow this pattern:
api.users.queries.*           // All user read operations
api.users.mutations.*         // All user write operations
api.users.helpers.*           // Shared utilities (optional)

api.ecommerce.queries.*       // All e-commerce reads
api.ecommerce.mutations.*     // All e-commerce writes

api.groups.queries.*          // All group reads
api.groups.mutations.*        // All group writes

// Complex modules can have sub-features:
api.ecommerce.products.queries.*
api.ecommerce.orders.queries.*
api.calendar.events.queries.*
```

## Files Requiring Updates

### Critical Files (Must Update)

1. **Users API**: 34 files need migration
2. **E-commerce API**: 50 files need migration
3. **Groups API**: 25 files need migration
4. **Permissions API**: 15 files need migration

### Total Impact: 124+ files require API call updates

## Testing Strategy

1. **Type Check**: Ensure all TypeScript errors are resolved
2. **Build Verification**: Confirm all imports resolve correctly
3. **Runtime Testing**: Test critical user flows after each migration
4. **Gradual Migration**: Migrate one feature at a time to minimize risk

## Success Metrics

1. **Zero 'any' types** in API calls
2. **Consistent API patterns** across all features
3. **Reduced file count** in Convex folder
4. **Improved TypeScript inference**
5. **Simplified API surface** for developers
