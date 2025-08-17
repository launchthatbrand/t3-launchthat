# Scenario Builder: Package-Based Integration Architecture

## Product Requirements Document (PRD)

### Version: 3.0

### Date: January 16, 2025

### Author: Technical Architecture Team

### Status: Final Draft

---

## Executive Summary

The Scenario Builder is an enterprise-grade visual automation platform similar to Make.com or Zapier, built using a **package-based architecture** where each integration node (WordPress, Stripe, Monday.com, etc.) is its own monorepo package. This approach enables better modularity, independent versioning, testing, and development while maintaining type safety and consistency across the entire system.

## Background & Problem Statement

### Current State Analysis

Based on successful patterns from `@acme/ui`, `@acme/integration-sdk`, and existing apps like portal/inventory, we need:

- **Modular Integration Architecture**: Each integration as a self-contained package
- **Strong Type Safety**: Cross-package TypeScript safety without tight coupling
- **Make.com-like Experience**: Visual node-based automation with dynamic field fetching
- **Enterprise Features**: Versioning, monitoring, error handling, testing
- **Developer Experience**: Easy creation of new integrations with SDK patterns

### Goals

1. **Package-Based Architecture**: Integration nodes as independent packages
2. **Visual Automation Builder**: React Flow-based drag-and-drop interface
3. **Dynamic Field Population**: Real-time data fetching for form fields (categories, etc.)
4. **Robust Versioning**: Independent package versioning with compatibility matrix
5. **Enterprise Reliability**: Monitoring, logging, retry logic, error handling
6. **Developer SDK**: Easy integration development

---

## Core Database Schema (Convex)

### 1. Database Tables

The Scenario Builder uses Convex as its database, providing real-time updates, strong consistency, and excellent TypeScript integration. Below is the complete schema design optimized for the package-based architecture:

```typescript
// apps/scenariobuilder/convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // =====================================================
  // INTEGRATION NODE MANAGEMENT
  // =====================================================

  // Integration node metadata (stable across versions)
  integrationNodes: defineTable({
    manifestId: v.string(), // Unique identifier from package manifest (e.g., "wordpress", "stripe")
    name: v.string(), // Display name (e.g., "WordPress", "Stripe")
    description: v.string(),
    category: v.string(), // "cms", "payment", "crm", "system", etc.
    icon: v.string(), // Icon name/component
    color: v.string(), // Brand color (hex)
    author: v.string(),
    keywords: v.array(v.string()),
    tags: v.array(v.string()),
    isActive: v.boolean(), // Can be disabled without removing
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_manifest_id", ["manifestId"])
    .index("by_category", ["category"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"])

  // Integration node versions (from packages)
  integrationNodesVersion: defineTable({
    nodeId: v.id("integrationNodes"),
    version: v.string(), // Semantic version from package.json
    manifest: v.any(), // Complete manifest data from package
    isLatest: v.boolean(),
    isDeprecated: v.boolean(),
    deprecationReason: v.optional(v.string()),
    migrationGuide: v.optional(v.string()),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_node_id", ["nodeId"])
    .index("by_version", ["nodeId", "version"])
    .index("by_latest", ["nodeId", "isLatest"])
    .index("by_deprecated", ["isDeprecated"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // =====================================================
  // USER & ORGANIZATION MANAGEMENT
  // =====================================================

  users: defineTable({
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    isActive: v.boolean(),
    lastLoginAt: v.optional(v.number()),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_email", ["email"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  organizations: defineTable({
    name: v.string(),
    slug: v.string(), // URL-friendly identifier
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    plan: v.string(), // "free", "pro", "enterprise"
    settings: v.any(), // Organization-level settings
    isActive: v.boolean(),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_slug", ["slug"])
    .index("by_plan", ["plan"])
    .index("by_active", ["isActive"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  organizationMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: v.string(), // "owner", "admin", "member", "viewer"
    permissions: v.array(v.string()), // Granular permissions
    invitedBy: v.optional(v.id("users")),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_organization", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_role", ["organizationId", "role"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // =====================================================
  // CONNECTION MANAGEMENT
  // =====================================================

  integrationConnections: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    integrationId: v.id("integrationNodes"), // Reference seeded integrationNodes
    name: v.string(), // User-friendly name (e.g., "Desmond's WordPress")
    description: v.optional(v.string()),
    credentials: v.any(), // Encrypted connection data
    status: v.string(), // "active", "inactive", "error", "testing"
    lastTestedAt: v.optional(v.number()),
    testResult: v.optional(v.any()),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_integration", ["integrationId"])
    .index("by_status", ["status"])
    .index("by_user_integration", ["userId", "integrationId"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // =====================================================
  // SCENARIO MANAGEMENT
  // =====================================================

  scenarios: defineTable({
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // "draft", "active", "paused", "archived"
    isTemplate: v.boolean(),
    templateCategory: v.optional(v.string()),
    currentVersionId: v.optional(v.id("scenariosVersion")),
    executionCount: v.number(),
    lastExecutionAt: v.optional(v.number()),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_template", ["isTemplate"])
    .index("by_template_category", ["templateCategory"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // Scenario versions for rollback/history
  scenariosVersion: defineTable({
    scenarioId: v.id("scenarios"),
    version: v.number(), // Auto-incrementing version
    versionLabel: v.optional(v.string()), // User-defined label
    definition: v.any(), // Complete scenario graph data
    isPublished: v.boolean(),
    publishedAt: v.optional(v.number()),
    publishedBy: v.optional(v.id("users")),
    changesSummary: v.optional(v.string()),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_scenario", ["scenarioId"])
    .index("by_scenario_version", ["scenarioId", "version"])
    .index("by_published", ["scenarioId", "isPublished"])
    .index("by_published_at", ["publishedAt"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // Individual nodes within scenarios
  scenarioNodes: defineTable({
    scenarioId: v.id("scenarios"),
    versionId: v.id("scenariosVersion"),
    nodeId: v.string(), // Unique within scenario
    integrationId: v.string(), // Reference to manifestId
    connectionId: v.optional(v.id("userConnections")),
    actionId: v.string(), // Action/trigger ID from manifest
    name: v.string(), // User-customizable name
    description: v.optional(v.string()),
    configuration: v.any(), // Action-specific config
    position: v.object({
      x: v.number(),
      y: v.number(),
    }),
    uiData: v.any(), // Additional UI state
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_scenario", ["scenarioId"])
    .index("by_version", ["versionId"])
    .index("by_scenario_node", ["scenarioId", "nodeId"])
    .index("by_integration", ["integrationId"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // Node connections/edges within scenarios
  scenarioConnections: defineTable({
    scenarioId: v.id("scenarios"),
    versionId: v.id("scenariosVersion"),
    fromNodeId: v.string(),
    toNodeId: v.string(),
    connectionType: v.string(), // "success", "error", "condition"
    conditions: v.optional(v.any()), // For conditional routing
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_scenario", ["scenarioId"])
    .index("by_version", ["versionId"])
    .index("by_from_node", ["fromNodeId"])
    .index("by_to_node", ["toNodeId"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // =====================================================
  // EXECUTION & MONITORING
  // =====================================================

  scenarioExecutions: defineTable({
    scenarioId: v.id("scenarios"),
    versionId: v.id("scenariosVersion"),
    triggeredBy: v.string(), // "manual", "webhook", "schedule", "api"
    triggerData: v.any(), // Data that triggered execution
    status: v.string(), // "running", "completed", "failed", "cancelled"
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()), // Milliseconds
    nodeExecutions: v.number(), // Count of nodes executed
    errorMessage: v.optional(v.string()),
    metadata: v.any(), // Additional execution context
  })
    .index("by_scenario", ["scenarioId"])
    .index("by_status", ["status"])
    .index("by_started_at", ["startedAt"])
    .index("by_trigger", ["triggeredBy"])
    .index("by_scenario_status", ["scenarioId", "status"]),

  nodeExecutions: defineTable({
    executionId: v.id("scenarioExecutions"),
    nodeId: v.string(), // Reference to scenario node
    integrationId: v.string(),
    actionId: v.string(),
    connectionId: v.optional(v.id("userConnections")),
    inputData: v.any(),
    outputData: v.any(),
    status: v.string(), // "pending", "running", "completed", "failed", "skipped"
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    duration: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
    retryCount: v.number(),
    metadata: v.any(),
  })
    .index("by_execution", ["executionId"])
    .index("by_node", ["nodeId"])
    .index("by_status", ["status"])
    .index("by_started_at", ["startedAt"])
    .index("by_execution_node", ["executionId", "nodeId"]),

  // =====================================================
  // TEMPLATES & MARKETPLACE
  // =====================================================

  scenarioTemplates: defineTable({
    name: v.string(),
    description: v.string(),
    category: v.string(), // "productivity", "ecommerce", "marketing", etc.
    tags: v.array(v.string()),
    author: v.string(),
    authorId: v.optional(v.id("users")),
    authorOrganizationId: v.optional(v.id("organizations")),
    definition: v.any(), // Template scenario structure
    requiredIntegrations: v.array(v.string()), // Integration IDs needed
    usageCount: v.number(),
    rating: v.number(), // Average rating
    ratingCount: v.number(),
    isOfficial: v.boolean(), // Created by platform team
    isPublic: v.boolean(),
    price: v.optional(v.number()), // For paid templates
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_category", ["category"])
    .index("by_author", ["authorId"])
    .index("by_official", ["isOfficial"])
    .index("by_public", ["isPublic"])
    .index("by_usage", ["usageCount"])
    .index("by_rating", ["rating"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  // =====================================================
  // WEBHOOKS & TRIGGERS
  // =====================================================

  webhookEndpoints: defineTable({
    scenarioId: v.id("scenarios"),
    nodeId: v.string(),
    endpointId: v.string(), // Unique webhook identifier
    url: v.string(), // Full webhook URL
    method: v.string(), // "POST", "GET", etc.
    headers: v.optional(v.any()),
    authentication: v.optional(v.any()),
    isActive: v.boolean(),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
    lastTriggeredAt: v.optional(v.number()),
  })
    .index("by_scenario", ["scenarioId"])
    .index("by_endpoint", ["endpointId"])
    .index("by_active", ["isActive"]),

  // =====================================================
  // SYSTEM & CONFIGURATION
  // =====================================================

  systemSettings: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    updatedBy: v.id("users"),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_key", ["key"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),

  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
    resourceType: v.string(), // "scenario", "connection", "template", etc.
    resourceId: v.string(),
    action: v.string(), // "create", "update", "delete", "execute"
    details: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
    updatedAt: v.number(), // Manual timestamp for updates
  })
    .index("by_user", ["userId"])
    .index("by_organization", ["organizationId"])
    .index("by_resource", ["resourceType", "resourceId"])
    .index("by_action", ["action"])
    .index("by_created_at", ["createdAt"])
    .index("by_updated_at", ["updatedAt"]),
});
```

### 2. Timestamp Management & Best Practices

#### **Convex Automatic Fields**

- **`_creationTime`**: Automatically added by Convex to every document (milliseconds since Unix epoch)
- **`_id`**: Automatically generated unique identifier for each document
- **No automatic `updatedAt`**: Convex doesn't provide automatic update timestamps

#### **Custom Timestamp Strategy**

Following Convex community best practices:

```typescript
// Schema pattern for all tables
{
  createdAt: v.optional(v.number()), // For migrated data, otherwise use _creationTime
  updatedAt: v.number(), // Manual timestamp for updates
  // ... other fields
}
```

**Implementation in Mutations:**

```typescript
// Creating new documents
await ctx.db.insert("scenarios", {
  name: "My Scenario",
  // createdAt: undefined (will use _creationTime)
  updatedAt: Date.now(),
  // ... other fields
});

// Updating existing documents
await ctx.db.patch(scenarioId, {
  name: "Updated Name",
  updatedAt: Date.now(), // Always update timestamp
  // ... other fields
});
```

**Migration Handling:**

```typescript
// For data migrated from other systems
await ctx.db.insert("scenarios", {
  name: "Migrated Scenario",
  createdAt: legacyCreatedAtTimestamp, // Preserve original creation time
  updatedAt: Date.now(),
  // ... other fields
});
```

**Querying Patterns:**

```typescript
// Use _creationTime for creation-based queries (new documents)
const recentScenarios = await ctx.db.query("scenarios").order("desc").take(10);

// Use createdAt for migration-aware queries
const migratedScenarios = await ctx.db
  .query("scenarios")
  .withIndex("by_created_at", (q) => q.gte("createdAt", startDate))
  .collect();

// Use updatedAt for modification tracking
const recentlyModified = await ctx.db
  .query("scenarios")
  .withIndex("by_updated_at", (q) => q.gte("updatedAt", lastSyncTime))
  .collect();
```

#### **Index Strategy for Timestamps**

- **`by_created_at`**: For creation-based queries and migration handling
- **`by_updated_at`**: For modification tracking and sync operations
- **`by_updated_time`**: Deprecated, replaced with `by_updated_at`

### 3. Key Design Principles

#### **Convex Best Practices Applied**

- ✅ **Strong Type Safety**: All fields use proper Convex validators (`v.string()`, `v.id()`, `v.any()` only for dynamic content)
- ✅ **Efficient Indexing**: Strategic indexes for common query patterns
- ✅ **Normalized Structure**: Related data split across tables to avoid document size limits
- ✅ **Real-time Ready**: Schema designed for live subscriptions and updates

#### **Package-Based Integration**

- ✅ **Manifest Seeding**: `integrationNodes` and `integrationNodesVersion` populated from package manifests
- ✅ **Version Management**: Full semantic versioning with rollback capabilities
- ✅ **Dynamic Data**: `manifest` field stores complete package definition for runtime use
- ✅ **Reference Integrity**: Integration references use string IDs that map to package manifest IDs

#### **Enterprise Features**

- ✅ **Multi-tenancy**: Organization-based data isolation
- ✅ **Audit Trail**: Complete audit log for compliance
- ✅ **Template System**: Scenario marketplace with ratings and categories
- ✅ **Monitoring**: Detailed execution tracking and performance metrics

### 3. Database Operations

#### **Integration Seeding from Packages**

The database is populated from packages using the seeding system:

```typescript
// apps/scenariobuilder/convex/integrations/seeder.ts
export const seedIntegrations = internalMutation({
  args: { force: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    for (const [id, manifest] of Object.entries(integrationRegistry)) {
      // Create or update integrationNodes
      const nodeId = await upsertIntegrationNode(ctx, id, manifest);

      // Create new version in integrationNodesVersion
      await createIntegrationVersion(ctx, nodeId, manifest);
    }
  },
});
```

#### **Runtime Data Access**

Scenarios reference integration data through string IDs that resolve to package manifests:

```typescript
// Query integration manifest at runtime
export const getIntegrationManifest = query({
  args: { integrationId: v.string() },
  handler: async (ctx, args) => {
    const integration = await ctx.db
      .query("integrationNodes")
      .withIndex("by_manifest_id", (q) =>
        q.eq("manifestId", args.integrationId),
      )
      .unique();

    if (!integration) return null;

    const version = await ctx.db
      .query("integrationNodesVersion")
      .withIndex("by_latest", (q) =>
        q.eq("nodeId", integration._id).eq("isLatest", true),
      )
      .unique();

    return version?.manifest;
  },
});
```

#### **Execution Tracking**

Every scenario execution is fully tracked for monitoring and debugging:

```typescript
// Create execution record
export const startScenarioExecution = mutation({
  args: {
    scenarioId: v.id("scenarios"),
    triggerData: v.any(),
  },
  handler: async (ctx, args) => {
    const executionId = await ctx.db.insert("scenarioExecutions", {
      scenarioId: args.scenarioId,
      versionId: scenario.currentVersionId,
      triggeredBy: "manual",
      triggerData: args.triggerData,
      status: "running",
      startedAt: Date.now(),
      nodeExecutions: 0,
      metadata: {},
    });

    // Schedule execution engine
    await ctx.scheduler.runAfter(0, internal.execution.processScenario, {
      executionId,
    });

    return executionId;
  },
});
```

---

## Solution Architecture

### 1. Monorepo Package Structure

Following the successful patterns from `@acme/ui` and `@convexcms/*`:

```
packages/
├── integration-nodes/
│   ├── wordpress/
│   │   ├── package.json               # @acme/integration-wordpress
│   │   ├── src/
│   │   │   ├── index.ts              # Main exports
│   │   │   ├── manifest.ts           # Integration manifest
│   │   │   ├── actions/
│   │   │   │   ├── index.ts          # Export all actions
│   │   │   │   ├── createPost.ts     # Individual actions
│   │   │   │   ├── createMedia.ts
│   │   │   │   └── getCategories.ts  # Dynamic field fetchers
│   │   │   ├── triggers/
│   │   │   │   ├── index.ts
│   │   │   │   └── postCreated.ts
│   │   │   ├── connections/
│   │   │   │   ├── index.ts
│   │   │   │   ├── basicAuth.ts
│   │   │   │   └── oauth.ts
│   │   │   ├── types.ts              # Package-specific types
│   │   │   └── utils/
│   │   │       ├── api.ts
│   │   │       └── validation.ts
│   │   ├── stories/                  # Storybook stories
│   │   ├── tests/                    # Unit/integration tests
│   │   └── README.md
│   ├── stripe/
│   │   ├── package.json               # @acme/integration-stripe
│   │   └── src/                      # Similar structure
│   ├── monday/
│   │   ├── package.json               # @acme/integration-monday
│   │   └── src/                      # Similar structure
│   ├── system/
│   │   ├── package.json               # @acme/integration-system
│   │   └── src/                      # System operations (delays, conditions)
│   └── router/
│       ├── package.json               # @acme/integration-router
│       └── src/                      # Flow control (if/else, loops)
├── scenario-builder-core/
│   ├── package.json                   # @acme/scenario-builder-core
│   └── src/
│       ├── index.ts                  # Core types and utilities
│       ├── types/                    # Shared scenario types
│       ├── execution/                # Scenario execution engine
│       ├── validation/               # Schema validation
│       └── registry/                 # Integration registry
└── scenario-builder-ui/
    ├── package.json                   # @acme/scenario-builder-ui
    └── src/
        ├── index.ts                  # UI component exports
        ├── components/               # React Flow editor components
        ├── hooks/                    # Scenario builder hooks
        └── stories/                  # Storybook stories
```

### 2. Package Dependencies & Exports

#### Integration Node Package Structure (`@acme/integration-wordpress`)

````typescript
// packages/integration-nodes/wordpress/package.json
{
  "name": "@acme/integration-wordpress",
  "version": "1.2.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./manifest": "./src/manifest.ts",
    "./actions": "./src/actions/index.ts",
    "./triggers": "./src/triggers/index.ts",
    "./connections": "./src/connections/index.ts",
    "./types": "./src/types.ts"
  },
  "dependencies": {
    "@acme/scenario-builder-core": "workspace:*",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@acme/integration-sdk": "workspace:*"
  }
}

// packages/integration-nodes/wordpress/src/index.ts
export { wordpressManifest as default } from './manifest.js';
export * from './actions/index.js';
export * from './triggers/index.js';
export * from './connections/index.js';
export type * from './types.js';

// packages/integration-nodes/wordpress/src/manifest.ts
import { defineIntegration } from '@acme/scenario-builder-core';
import { z } from 'zod';
import * as actions from './actions/index.js';
import * as triggers from './triggers/index.js';
import * as connections from './connections/index.js';

export const wordpressManifest = defineIntegration({
  metadata: {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Connect to WordPress sites via REST API',
    version: '1.2.0',
    category: 'cms',
    icon: 'FileText',
    color: '#21759B',
    author: 'Integration Team',
    keywords: ['wordpress', 'cms', 'blog', 'content'],
    tags: ['popular', 'cms'],
  },
  connections: connections.definitions,
  actions: actions.definitions,
  triggers: triggers.definitions,
});

### 3. Error Handling & Validation Strategy

#### **Comprehensive Error Handling**

**Error Types & Classification:**
```typescript
// packages/scenario-builder-core/src/types/errors.ts
export enum ErrorType {
  // Connection errors
  CONNECTION_INVALID = 'connection_invalid',
  CONNECTION_EXPIRED = 'connection_expired',
  CONNECTION_RATE_LIMITED = 'connection_rate_limited',

  // Action execution errors
  ACTION_VALIDATION_FAILED = 'action_validation_failed',
  ACTION_EXECUTION_FAILED = 'action_execution_failed',
  ACTION_TIMEOUT = 'action_timeout',

  // Scenario errors
  SCENARIO_INVALID = 'scenario_invalid',
  SCENARIO_CIRCULAR_DEPENDENCY = 'scenario_circular_dependency',
  SCENARIO_EXECUTION_FAILED = 'scenario_execution_failed',

  // System errors
  SYSTEM_OVERLOADED = 'system_overloaded',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_ERROR = 'system_error'
}

export interface ScenarioError {
  type: ErrorType;
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  retryAfter?: number;
  nodeId?: string;
  executionId?: string;
  timestamp: number;
}
````

**Error Handling in Actions:**

```typescript
// packages/integration-nodes/wordpress/src/actions/createPost.ts
async execute({ input, settings, connection }) {
  try {
    // Validate connection
    if (!connection?.credentials?.apiKey) {
      throw new ScenarioError({
        type: ErrorType.CONNECTION_INVALID,
        code: 'MISSING_API_KEY',
        message: 'WordPress API key is required',
        retryable: false
      });
    }

    // Execute with timeout
    const post = await Promise.race([
      api.posts.create(input),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 30000)
      )
    ]);

    return { success: true, postId: post.id };

  } catch (error) {
    // Handle rate limiting
    if (error.status === 429) {
      throw new ScenarioError({
        type: ErrorType.CONNECTION_RATE_LIMITED,
        code: 'RATE_LIMITED',
        message: 'WordPress API rate limit exceeded',
        retryable: true,
        retryAfter: error.headers['retry-after'] || 60
      });
    }

    // Handle validation errors
    if (error.status === 400) {
      throw new ScenarioError({
        type: ErrorType.ACTION_VALIDATION_FAILED,
        code: 'INVALID_INPUT',
        message: 'Invalid post data provided',
        details: error.response?.data,
        retryable: false
      });
    }

    // Generic error handling
    throw new ScenarioError({
      type: ErrorType.ACTION_EXECUTION_FAILED,
      code: 'UNKNOWN_ERROR',
      message: 'Failed to create WordPress post',
      details: error.message,
      retryable: true
    });
  }
}
```

#### **Input Validation & Schema Enforcement**

**Zod Schema Validation:**

```typescript
// packages/integration-nodes/wordpress/src/schemas/post.ts
import { z } from "zod";

export const createPostSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(10000, "Content must be less than 10,000 characters"),
  status: z.enum(["draft", "publish", "private"]).default("draft"),
  categories: z
    .array(z.string().min(1))
    .max(10, "Maximum 10 categories allowed")
    .optional(),
  tags: z
    .array(z.string().min(1))
    .max(20, "Maximum 20 tags allowed")
    .optional(),
  featuredImage: z.string().url("Invalid image URL").optional(),
});

export const connectionSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  siteUrl: z.string().url("Invalid WordPress site URL"),
  apiVersion: z.enum(["v1", "v2"]).default("v2"),
  timeout: z.number().min(1000).max(60000).default(30000),
});
```

**Runtime Validation:**

```typescript
// packages/scenario-builder-core/src/validation/actionValidator.ts
export function validateActionInput(
  action: ActionDefinition,
  input: any,
  settings: any,
): ValidationResult {
  try {
    // Validate input schema
    const validatedInput = action.configSchema.input.parse(input);

    // Validate settings schema
    const validatedSettings = action.configSchema.settings.parse(settings);

    // Validate dynamic field dependencies
    const dependencyErrors = validateDynamicFieldDependencies(
      action.dynamicFields,
      settings,
    );

    return {
      valid: dependencyErrors.length === 0,
      input: validatedInput,
      settings: validatedSettings,
      errors: dependencyErrors,
    };
  } catch (error) {
    return {
      valid: false,
      input: null,
      settings: null,
      errors: [
        {
          field: "schema",
          message: error.message,
          code: "SCHEMA_VALIDATION_FAILED",
        },
      ],
    };
  }
}
```

#### **Retry Logic & Circuit Breaker**

**Retry Strategy:**

```typescript
// packages/scenario-builder-core/src/execution/retryManager.ts
export class RetryManager {
  private attempts = new Map<string, number>();
  private circuitBreakers = new Map<string, CircuitBreaker>();

  async executeWithRetry<T>(
    executionId: string,
    operation: () => Promise<T>,
    options: RetryOptions = {},
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Check circuit breaker
        const circuitBreaker = this.getCircuitBreaker(executionId);
        if (circuitBreaker.isOpen()) {
          throw new Error("Circuit breaker is open");
        }

        const result = await operation();

        // Success - reset circuit breaker
        circuitBreaker.onSuccess();
        return result;
      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === maxAttempts) {
          circuitBreaker.onFailure();
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt - 1),
          maxDelay,
        );

        await this.delay(delay);
      }
    }

    throw lastError!;
  }
}
```

#### Action Definition with Dynamic Fields

```typescript
// packages/integration-nodes/wordpress/src/actions/createPost.ts
import { z } from "zod";

import { defineAction } from "@acme/scenario-builder-core";

export const createPost = defineAction({
  id: "create_post",
  name: "Create Post",
  description: "Create a new WordPress post",
  category: "content",

  configSchema: {
    input: z.object({
      title: z.string(),
      content: z.string(),
      status: z.enum(["draft", "publish", "private"]).default("draft"),
    }),

    settings: z.object({
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      featuredImage: z.string().optional(),
    }),

    output: z.object({
      success: z.boolean(),
      postId: z.number().optional(),
      postUrl: z.string().optional(),
      error: z.string().optional(),
    }),
  },

  // Dynamic field configuration for Make.com-like experience
  dynamicFields: [
    {
      fieldName: "settings.categories",
      type: "multi-select",
      label: "Categories",
      description: "Select post categories",
      fetchOptions: {
        action: "get_categories", // References getCategories action
        dependsOn: ["connectionId"],
        cacheTimeout: 300, // 5 minutes
        transform: (data: any[]) =>
          data.map((cat) => ({ label: cat.name, value: cat.id.toString() })),
      },
    },
    {
      fieldName: "settings.tags",
      type: "multi-select",
      label: "Tags",
      description: "Select or create post tags",
      fetchOptions: {
        action: "get_tags",
        dependsOn: ["connectionId"],
        allowCustom: true, // Allow creating new tags
        transform: (data: any[]) =>
          data.map((tag) => ({ label: tag.name, value: tag.id.toString() })),
      },
    },
  ],

  async execute({ input, settings, connection }) {
    // Implementation uses external API client
    const api = createWordPressClient(connection);

    try {
      const post = await api.posts.create({
        title: input.title,
        content: input.content,
        status: input.status,
        categories: settings.categories?.map(Number),
        tags: settings.tags?.map(Number),
        featured_media: settings.featuredImage
          ? Number(settings.featuredImage)
          : undefined,
      });

      return {
        success: true,
        postId: post.id,
        postUrl: post.link,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

// Dynamic field fetcher (used by UI for dropdown population)
export const getCategories = defineAction({
  id: "get_categories",
  name: "Get Categories",
  description: "Fetch WordPress categories for field population",
  category: "internal", // Not shown in main action list

  configSchema: {
    input: z.object({}),
    settings: z.object({}),
    output: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
      }),
    ),
  },

  async execute({ connection }) {
    const api = createWordPressClient(connection);
    return await api.categories.list();
  },
});
```

### 3. Performance Optimization & Monitoring

#### **Query Performance & Indexing Strategy**

**Strategic Index Design:**

```typescript
// apps/scenariobuilder/convex/schema.ts
export default defineSchema({
  // High-frequency query patterns with composite indexes
  scenarios: defineTable({
    // ... fields
  })
    .index("by_user_status_updated", ["userId", "status", "updatedAt"])
    .index("by_org_template_active", [
      "organizationId",
      "isTemplate",
      "isActive",
    ])
    .index("by_execution_count", ["executionCount", "updatedAt"]),

  scenarioExecutions: defineTable({
    // ... fields
  })
    .index("by_scenario_status_time", ["scenarioId", "status", "startedAt"])
    .index("by_org_duration", ["organizationId", "duration", "startedAt"])
    .index("by_error_type_time", ["errorType", "startedAt"]),

  // Search optimization with full-text search
  auditLogs: defineTable({
    // ... fields
  })
    .searchIndex("by_resource_action", {
      searchField: "resourceType",
      filterFields: ["action", "organizationId", "timestamp"],
    })
    .searchIndex("by_user_activity", {
      searchField: "action",
      filterFields: ["userId", "resourceType", "timestamp"],
    }),
});
```

**Query Optimization Patterns:**

```typescript
// apps/scenariobuilder/convex/scenarios/queries.ts
export const getScenariosByUser = query({
  args: { userId: v.id("users"), status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // Use composite index for efficient filtering
    const scenarios = await ctx.db
      .query("scenarios")
      .withIndex("by_user_status_updated", (q) => {
        if (args.status) {
          return q.eq("userId", args.userId).eq("status", args.status);
        }
        return q.eq("userId", args.userId);
      })
      .order("desc")
      .take(50); // Limit results for performance

    return scenarios;
  },
});

// Batch operations for performance
export const getScenarioExecutionStats = query({
  args: { scenarioIds: v.array(v.id("scenarios")) },
  handler: async (ctx, args) => {
    const stats = await Promise.all(
      args.scenarioIds.map(async (scenarioId) => {
        const executions = await ctx.db
          .query("scenarioExecutions")
          .withIndex("by_scenario_status_time", (q) =>
            q.eq("scenarioId", scenarioId).eq("status", "completed"),
          )
          .take(100);

        return {
          scenarioId,
          totalExecutions: executions.length,
          averageDuration:
            executions.reduce((sum, ex) => sum + ex.duration, 0) /
            executions.length,
          lastExecution: executions[0]?.startedAt,
        };
      }),
    );

    return stats;
  },
});
```

#### **Caching Strategy & Data Freshness**

**Multi-Level Caching:**

```typescript
// packages/scenario-builder-core/src/caching/cacheManager.ts
export class CacheManager {
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private redisClient: Redis;

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && memoryResult.expires > Date.now()) {
      return memoryResult.data;
    }

    // Check Redis cache
    const redisResult = await this.redisClient.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      // Update memory cache
      this.memoryCache.set(key, {
        data: parsed.data,
        expires: parsed.expires,
      });
      return parsed.data;
    }

    return null;
  }

  async set(key: string, data: any, ttl: number): Promise<void> {
    const expires = Date.now() + ttl;

    // Set memory cache
    this.memoryCache.set(key, { data, expires });

    // Set Redis cache
    await this.redisClient.setex(
      key,
      Math.floor(ttl / 1000),
      JSON.stringify({
        data,
        expires,
      }),
    );
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redisClient.keys(pattern);
    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }

    // Clear memory cache entries matching pattern
    for (const [key] of this.memoryCache) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }
  }
}
```

**Dynamic Field Caching:**

```typescript
// apps/scenariobuilder/convex/integrations/dynamicFields.ts
export const fetchDynamicFieldOptions = action({
  args: {
    integrationId: v.string(),
    actionId: v.string(),
    fieldName: v.string(),
    connectionId: v.id("userConnections"),
    dependencyValues: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Generate cache key based on dependencies
    const cacheKey = `dynamic_field:${args.integrationId}:${args.actionId}:${args.fieldName}:${args.connectionId}:${JSON.stringify(args.dependencyValues)}`;

    // Check cache first
    const cached = await ctx.runQuery(internal.cache.get, { key: cacheKey });
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const manifest = await ctx.runQuery(internal.integrations.getManifest, {
      integrationId: args.integrationId,
    });

    const dynamicField = manifest.actions[args.actionId]?.dynamicFields?.find(
      (f) => f.fieldName === args.fieldName,
    );

    if (!dynamicField?.fetchOptions) {
      throw new Error("Dynamic field not found");
    }

    // Execute fetch action with timeout
    const result = await Promise.race([
      executeFetchAction(manifest, dynamicField, args),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 10000),
      ),
    ]);

    // Cache result with appropriate TTL
    const ttl = dynamicField.fetchOptions.cacheTimeout * 1000 || 300000; // 5 min default
    await ctx.runMutation(internal.cache.set, {
      key: cacheKey,
      data: result,
      ttl,
    });

    return result;
  },
});
```

#### **Performance Monitoring & Metrics**

**Execution Metrics Collection:**

```typescript
// packages/scenario-builder-core/src/monitoring/metricsCollector.ts
export class MetricsCollector {
  private metrics: Map<string, MetricData> = new Map();

  recordExecutionTime(actionId: string, duration: number): void {
    const metric = this.metrics.get(actionId) || {
      count: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      averageTime: 0,
    };

    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.averageTime = metric.totalTime / metric.count;

    this.metrics.set(actionId, metric);
  }

  recordError(actionId: string, errorType: string): void {
    const key = `${actionId}:errors`;
    const metric = this.metrics.get(key) || { count: 0, types: new Map() };

    metric.count++;
    const typeCount = metric.types.get(errorType) || 0;
    metric.types.set(errorType, typeCount + 1);

    this.metrics.set(key, metric);
  }

  getMetrics(): Record<string, MetricData> {
    return Object.fromEntries(this.metrics);
  }
}
```

**Real-Time Performance Dashboard:**

```typescript
// apps/scenariobuilder/convex/monitoring/dashboard.ts
export const getPerformanceMetrics = query({
  args: { timeRange: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const range = args.timeRange || "1h";
    const startTime = now - getTimeRangeMs(range);

    // Aggregate execution metrics
    const executions = await ctx.db
      .query("scenarioExecutions")
      .withIndex("by_started_time", (q) => q.gte("startedAt", startTime))
      .collect();

    const metrics = {
      totalExecutions: executions.length,
      successfulExecutions: executions.filter((e) => e.status === "completed")
        .length,
      failedExecutions: executions.filter((e) => e.status === "failed").length,
      averageExecutionTime:
        executions.reduce((sum, e) => sum + e.duration, 0) / executions.length,
      executionTrend: groupByTimeRange(executions, range),
      topSlowActions: getTopSlowActions(executions),
      errorBreakdown: getErrorBreakdown(executions),
    };

    return metrics;
  },
});
```

### 4. Security & Compliance Strategy

#### **Data Encryption & Security**

**Connection Credentials Encryption:**

```typescript
// packages/scenario-builder-core/src/security/encryption.ts
import { createCipher, createDecipher, randomBytes } from "crypto";

export class CredentialEncryption {
  private algorithm = "aes-256-gcm";
  private keyLength = 32;
  private ivLength = 16;
  private tagLength = 16;

  encrypt(
    plaintext: string,
    encryptionKey: string,
  ): {
    encrypted: string;
    iv: string;
    tag: string;
  } {
    const iv = randomBytes(this.ivLength);
    const cipher = createCipher(this.algorithm, encryptionKey);
    cipher.setAAD(Buffer.from("scenario-builder", "utf8"));

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
      encrypted,
      iv: iv.toString("hex"),
      tag: cipher.getAuthTag().toString("hex"),
    };
  }

  decrypt(
    encrypted: string,
    iv: string,
    tag: string,
    encryptionKey: string,
  ): string {
    const decipher = createDecipher(this.algorithm, encryptionKey);
    decipher.setAAD(Buffer.from("scenario-builder", "utf8"));
    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
```

**Secure Connection Storage:**

```typescript
// apps/scenariobuilder/convex/integrations/connections.ts
export const createConnection = mutation({
  args: {
    integrationId: v.string(),
    name: v.string(),
    credentials: v.any(),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    // Validate user permissions
    const user = await ctx.auth.getUserIdentity();
    if (!user) throw new Error("Unauthorized");

    const member = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", user.subject).eq("organizationId", args.organizationId),
      )
      .unique();

    if (!member || !["owner", "admin"].includes(member.role)) {
      throw new Error("Insufficient permissions");
    }

    // Encrypt credentials before storage
    const encryptedCredentials = await encryptCredentials(args.credentials);

    const connectionId = await ctx.db.insert("integrationConnections", {
      userId: user.subject,
      organizationId: args.organizationId,
      integrationId: args.integrationId,
      name: args.name,
      credentials: encryptedCredentials,
      status: "active",
      createdAt: undefined, // Use _creationTime
      updatedAt: Date.now(),
    });

    // Audit log
    await ctx.db.insert("auditLogs", {
      userId: user.subject,
      organizationId: args.organizationId,
      resourceType: "connection",
      resourceId: connectionId,
      action: "create",
      details: { integrationId: args.integrationId, name: args.name },
      ipAddress: ctx.headers.get("x-forwarded-for"),
      userAgent: ctx.headers.get("user-agent"),
      createdAt: undefined, // Use _creationTime
      updatedAt: Date.now(),
    });

    return connectionId;
  },
});
```

#### **Access Control & RBAC**

**Permission System:**

```typescript
// packages/scenario-builder-core/src/security/permissions.ts
export enum Permission {
  // Scenario permissions
  SCENARIO_CREATE = "scenario:create",
  SCENARIO_READ = "scenario:read",
  SCENARIO_UPDATE = "scenario:update",
  SCENARIO_DELETE = "scenario:delete",
  SCENARIO_EXECUTE = "scenario:execute",

  // Connection permissions
  CONNECTION_CREATE = "connection:create",
  CONNECTION_READ = "connection:read",
  CONNECTION_UPDATE = "connection:update",
  CONNECTION_DELETE = "connection:delete",
  CONNECTION_TEST = "connection:test",

  // Organization permissions
  ORG_MEMBER_INVITE = "org:member:invite",
  ORG_MEMBER_REMOVE = "org:member:remove",
  ORG_MEMBER_ROLE_UPDATE = "org:member:role:update",
  ORG_SETTINGS_UPDATE = "org:settings:update",

  // System permissions
  SYSTEM_ADMIN = "system:admin",
  SYSTEM_MONITORING = "system:monitoring",
  SYSTEM_CONFIG = "system:config",
}

export const RolePermissions: Record<string, Permission[]> = {
  owner: Object.values(Permission),
  admin: [
    Permission.SCENARIO_CREATE,
    Permission.SCENARIO_READ,
    Permission.SCENARIO_UPDATE,
    Permission.SCENARIO_DELETE,
    Permission.SCENARIO_EXECUTE,
    Permission.CONNECTION_CREATE,
    Permission.CONNECTION_READ,
    Permission.CONNECTION_UPDATE,
    Permission.CONNECTION_DELETE,
    Permission.CONNECTION_TEST,
    Permission.ORG_MEMBER_INVITE,
    Permission.ORG_MEMBER_REMOVE,
    Permission.ORG_MEMBER_ROLE_UPDATE,
    Permission.ORG_SETTINGS_UPDATE,
  ],
  member: [
    Permission.SCENARIO_CREATE,
    Permission.SCENARIO_READ,
    Permission.SCENARIO_UPDATE,
    Permission.SCENARIO_EXECUTE,
    Permission.CONNECTION_READ,
    Permission.CONNECTION_TEST,
  ],
  viewer: [Permission.SCENARIO_READ, Permission.CONNECTION_READ],
};
```

**Permission Checker:**

```typescript
// apps/scenariobuilder/convex/security/permissions.ts
export const checkPermission = internalQuery({
  args: {
    userId: v.id("users"),
    organizationId: v.id("organizations"),
    permission: v.string(),
  },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user_org", (q) =>
        q.eq("userId", args.userId).eq("organizationId", args.organizationId),
      )
      .unique();

    if (!member) return false;

    const rolePermissions = RolePermissions[member.role] || [];
    return rolePermissions.includes(args.permission as Permission);
  },
});
```

#### **Compliance & Audit Trail**

**Comprehensive Audit Logging:**

```typescript
// apps/scenariobuilder/convex/security/audit.ts
export const logAuditEvent = internalMutation({
  args: {
    userId: v.optional(v.id("users")),
    organizationId: v.optional(v.id("organizations")),
    resourceType: v.string(),
    resourceId: v.string(),
    action: v.string(),
    details: v.any(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    severity: v.optional(v.string()), // 'low', 'medium', 'high', 'critical'
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      organizationId: args.organizationId,
      resourceType: args.resourceType,
      resourceId: args.resourceId,
      action: args.action,
      details: args.details,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      severity: args.severity || "low",
      createdAt: undefined, // Use _creationTime
      updatedAt: Date.now(),
    });
  },
});
```

**Data Retention & Privacy:**

```typescript
// apps/scenariobuilder/convex/security/retention.ts
export const cleanupExpiredData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const retentionPolicies = {
      auditLogs: 7 * 24 * 60 * 60 * 1000, // 7 days
      executionLogs: 30 * 24 * 60 * 60 * 1000, // 30 days
      failedExecutions: 90 * 24 * 60 * 60 * 1000, // 90 days
    };

    // Clean up old audit logs
    const oldAuditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_updated_time", (q) =>
        q.lt("updatedAt", now - retentionPolicies.auditLogs),
      )
      .collect();

    for (const log of oldAuditLogs) {
      await ctx.db.delete(log._id);
    }

    // Clean up old execution logs
    const oldExecutionLogs = await ctx.db
      .query("scenarioRunLogs")
      .withIndex("by_updated_time", (q) =>
        q.lt("updatedAt", now - retentionPolicies.executionLogs),
      )
      .collect();

    for (const log of oldExecutionLogs) {
      await ctx.db.delete(log._id);
    }

    return {
      deletedAuditLogs: oldAuditLogs.length,
      deletedExecutionLogs: oldExecutionLogs.length,
    };
  },
});
```

### 5. Convex Integration & Seeding

````

### 4. Convex Integration & Seeding

The Convex app imports and seeds from packages:

```typescript
// apps/scenariobuilder/convex/integrations/registry.ts
import wordpressManifest from '@acme/integration-wordpress';
import stripeManifest from '@acme/integration-stripe';
import mondayManifest from '@acme/integration-monday';
import systemManifest from '@acme/integration-system';
import routerManifest from '@acme/integration-router';

export const integrationRegistry = {
  wordpress: wordpressManifest,
  stripe: stripeManifest,
  monday: mondayManifest,
  system: systemManifest,
  router: routerManifest,
} as const;

export type IntegrationId = keyof typeof integrationRegistry;

// apps/scenariobuilder/convex/integrations/seeder.ts
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { integrationRegistry } from './registry.js';

export const seedIntegrations = internalMutation({
  args: {
    force: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const results = {
      seeded: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const [id, manifest] of Object.entries(integrationRegistry)) {
      try {
        // Check if integration exists
        const existing = await ctx.db
          .query('integrationNodes')
          .withIndex('by_manifest_id', q => q.eq('manifestId', id))
          .unique();

        if (existing && !args.force) {
          // Check if version needs updating
          const latestVersion = await ctx.db
            .query('integrationNodesVersion')
            .withIndex('by_node_id', q => q.eq('nodeId', existing._id))
            .filter(q => q.eq(q.field('isLatest'), true))
            .unique();

          if (latestVersion?.version === manifest.metadata.version) {
            results.skipped++;
            continue;
          }
        }

        // Create or update integration node
        let nodeId = existing?._id;
        if (!nodeId) {
          nodeId = await ctx.db.insert('integrationNodes', {
            manifestId: id,
            name: manifest.metadata.name,
            description: manifest.metadata.description,
            category: manifest.metadata.category,
            icon: manifest.metadata.icon,
            color: manifest.metadata.color,
            author: manifest.metadata.author,
            keywords: manifest.metadata.keywords,
            tags: manifest.metadata.tags,
            isActive: true,
            updatedTime: Date.now(),
          });
          results.seeded++;
        } else {
          await ctx.db.patch(nodeId, {
            name: manifest.metadata.name,
            description: manifest.metadata.description,
            updatedTime: Date.now(),
          });
          results.updated++;
        }

        // Create new version
        await ctx.db.insert('integrationNodesVersion', {
          nodeId,
          version: manifest.metadata.version,
          manifest: manifest as any, // Store complete manifest
          isLatest: true,
          isDeprecated: false,
          updatedTime: Date.now(),
        });

        // Mark previous versions as not latest
        const previousVersions = await ctx.db
          .query('integrationNodesVersion')
          .withIndex('by_node_id', q => q.eq('nodeId', nodeId))
          .filter(q => q.neq(q.field('version'), manifest.metadata.version))
          .collect();

        for (const prev of previousVersions) {
          await ctx.db.patch(prev._id, { isLatest: false });
        }

      } catch (error) {
        results.errors.push(`${id}: ${error}`);
      }
    }

    return results;
  },
});
````

### 6. Dynamic Field Fetching Architecture

Following the Make.com pattern for dynamic field population:

```typescript
// apps/scenariobuilder/convex/integrations/dynamicFields.ts
import { v } from "convex/values";

import { action } from "./_generated/server";
import { integrationRegistry } from "./registry.js";

export const fetchDynamicFieldOptions = action({
  args: {
    integrationId: v.string(),
    actionId: v.string(),
    fieldName: v.string(),
    connectionId: v.id("userConnections"),
    dependencyValues: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get the integration manifest
    const manifest =
      integrationRegistry[
        args.integrationId as keyof typeof integrationRegistry
      ];
    if (!manifest) {
      throw new Error(`Integration ${args.integrationId} not found`);
    }

    // Find the action definition
    const actionDef = manifest.actions[args.actionId];
    if (!actionDef) {
      throw new Error(
        `Action ${args.actionId} not found in ${args.integrationId}`,
      );
    }

    // Find the dynamic field configuration
    const dynamicField = actionDef.dynamicFields?.find(
      (field) => field.fieldName === args.fieldName,
    );
    if (!dynamicField) {
      throw new Error(`Dynamic field ${args.fieldName} not configured`);
    }

    // Get the connection details
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) {
      throw new Error("Connection not found");
    }

    // Execute the fetch action
    const fetchAction = manifest.actions[dynamicField.fetchOptions.action];
    if (!fetchAction) {
      throw new Error(
        `Fetch action ${dynamicField.fetchOptions.action} not found`,
      );
    }

    try {
      // Execute the action to get field options
      const result = await fetchAction.execute({
        input: {},
        settings: args.dependencyValues || {},
        connection: connection.credentials,
      });

      // Transform the result if transformer is provided
      if (dynamicField.fetchOptions.transform) {
        return dynamicField.fetchOptions.transform(result);
      }

      return result;
    } catch (error) {
      throw new Error(`Failed to fetch dynamic field options: ${error}`);
    }
  },
});
```

### 7. Frontend Integration

The UI components consume the packages and provide the Make.com-like experience:

```typescript
// packages/scenario-builder-ui/src/components/NodeConfigPanel.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

interface DynamicSelectFieldProps {
  integrationId: string;
  actionId: string;
  fieldName: string;
  connectionId: string;
  value: string[];
  onChange: (value: string[]) => void;
  dependencyValues?: Record<string, any>;
}

export function DynamicSelectField({
  integrationId,
  actionId,
  fieldName,
  connectionId,
  value,
  onChange,
  dependencyValues,
}: DynamicSelectFieldProps) {
  const [options, setOptions] = useState<Array<{label: string, value: string}>>([]);
  const [loading, setLoading] = useState(false);

  // Fetch dynamic options when dependencies change
  useEffect(() => {
    if (!connectionId) return;

    setLoading(true);

    // Call Convex action to fetch field options
    api.integrations.dynamicFields.fetchDynamicFieldOptions({
      integrationId,
      actionId,
      fieldName,
      connectionId,
      dependencyValues,
    })
    .then(setOptions)
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [integrationId, actionId, fieldName, connectionId, dependencyValues]);

  return (
    <MultiSelect
      loading={loading}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={loading ? 'Loading...' : 'Select options'}
    />
  );
}

// Main node configuration panel
export function NodeConfigPanel({ node, onUpdate }: NodeConfigPanelProps) {
  const manifest = useIntegrationManifest(node.integrationId);
  const actionDef = manifest?.actions[node.actionId];

  if (!manifest || !actionDef) {
    return <div>Integration not found</div>;
  }

  return (
    <div className="space-y-4">
      <h3>{actionDef.name}</h3>
      <p>{actionDef.description}</p>

      {/* Render form fields based on schema */}
      <SchemaForm
        schema={actionDef.configSchema}
        value={node.configuration}
        onChange={onUpdate}
        dynamicFields={actionDef.dynamicFields}
        integrationId={node.integrationId}
        actionId={node.actionId}
        connectionId={node.connectionId}
      />
    </div>
  );
}
```

### 8. Make.com Workflow Implementation

The complete Make.com-like experience:

```typescript
// packages/scenario-builder-ui/src/components/ScenarioBuilder.tsx
import React from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import { NodePalette } from './NodePalette';
import { NodeConfigPanel } from './NodeConfigPanel';

export function ScenarioBuilder() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Make.com workflow:
  // 1. User drags integration from palette
  // 2. Selects connection (or creates new)
  // 3. Chooses trigger/action based on position
  // 4. Configures action with dynamic fields

  const handleNodeAdd = (integrationId: string, position: { x: number, y: number }) => {
    // Determine if this is first node (trigger) or action
    const isFirstNode = nodes.length === 0;

    // Open connection selection modal
    setShowConnectionModal({
      integrationId,
      position,
      nodeType: isFirstNode ? 'trigger' : 'action',
    });
  };

  const handleConnectionSelected = (connectionId: string) => {
    // Open action/trigger selection based on node type
    setShowActionModal({
      ...connectionModalState,
      connectionId,
    });
  };

  const handleActionSelected = (actionId: string) => {
    // Create the node and open configuration panel
    const newNode = createScenarioNode({
      integrationId: actionModalState.integrationId,
      connectionId: actionModalState.connectionId,
      actionId,
      position: actionModalState.position,
    });

    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
  };

  return (
    <div className="flex h-screen">
      {/* Left sidebar - Integration palette */}
      <div className="w-80 border-r">
        <NodePalette onNodeAdd={handleNodeAdd} />
      </div>

      {/* Main canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {/* Right sidebar - Node configuration */}
      {selectedNode && (
        <div className="w-96 border-l">
          <NodeConfigPanel
            node={nodes.find(n => n.id === selectedNode)}
            onUpdate={handleNodeUpdate}
          />
        </div>
      )}

      {/* Modals for connection and action selection */}
      <ConnectionSelectionModal />
      <ActionSelectionModal />
    </div>
  );
}
```

### 9. Benefits of Package-Based Architecture

#### **Modularity & Independence**

- ✅ Each integration is a self-contained package
- ✅ Independent versioning following semantic versioning
- ✅ Isolated testing and development
- ✅ Clear dependency boundaries

#### **Type Safety**

- ✅ Full TypeScript support across package boundaries
- ✅ Shared types through `@acme/scenario-builder-core`
- ✅ No tight coupling to Convex-specific types
- ✅ Integration packages can be used outside Convex

#### **Developer Experience**

- ✅ Follows established monorepo patterns (`@acme/ui`, etc.)
- ✅ Hot reloading with `transpilePackages` in Next.js
- ✅ Storybook integration for isolated component development
- ✅ Clear separation between UI, logic, and data layers

#### **Scalability**

- ✅ Teams can work on different integrations independently
- ✅ Easy to add new integrations following template
- ✅ Performance: Only import integrations that are needed
- ✅ Bundle splitting: Each integration can be loaded on demand

#### **Testing & Quality**

- ✅ Unit tests at package level
- ✅ Integration tests across packages
- ✅ Storybook stories for UI components
- ✅ Type checking across package boundaries

### 10. Implementation Phases

#### **Phase 1: Foundation (Weeks 1-3)**

- [ ] Create `@acme/scenario-builder-core` package
- [ ] Create `@acme/scenario-builder-ui` package
- [ ] Set up package structure and build pipeline
- [ ] Implement basic integration registry and seeding

#### **Phase 2: First Integration (Weeks 4-6)**

- [ ] Create `@acme/integration-wordpress` package
- [ ] Implement full WordPress integration with dynamic fields
- [ ] Build UI components for integration configuration
- [ ] Test complete Make.com-like workflow

#### **Phase 3: Core Integrations (Weeks 7-10)**

- [ ] Create `@acme/integration-stripe` package
- [ ] Create `@acme/integration-monday` package
- [ ] Create `@acme/integration-system` package (delays, conditions)
- [ ] Create `@acme/integration-router` package (flow control)

#### **Phase 4: Advanced Features (Weeks 11-14)**

- [ ] Scenario execution engine
- [ ] Error handling and retry logic
- [ ] Monitoring and logging
- [ ] Advanced dynamic field features

#### **Phase 5: Enterprise Features (Weeks 15-18)**

- [ ] Role-based access control
- [ ] Organization management
- [ ] Scenario templates and marketplace
- [ ] Performance optimization

---

## Success Metrics

### **Technical Metrics**

- ✅ **Package Independence**: Each integration package can be developed, tested, and versioned independently
- ✅ **Type Safety**: 100% TypeScript coverage with no `any` types in public APIs
- ✅ **Performance**: <200ms for dynamic field fetching, <500ms for scenario execution start
- ✅ **Developer Experience**: New integration creation in <4 hours using templates

### **User Experience Metrics**

- ✅ **Make.com Parity**: Complete workflow matching Make.com's UX patterns
- ✅ **Dynamic Fields**: Real-time field population with <2s response time
- ✅ **Visual Clarity**: Intuitive drag-and-drop with clear action/trigger distinction
- ✅ **Error Handling**: Clear error messages and recovery paths

### **Business Metrics**

- ✅ **Integration Velocity**: New integration packages added weekly
- ✅ **Developer Adoption**: External teams can create custom integrations
- ✅ **Scenario Complexity**: Support for 20+ node scenarios
- ✅ **Reliability**: 99.9% uptime for scenario execution

---

## Conclusion

This package-based architecture for the Scenario Builder provides the perfect balance of modularity, type safety, and developer experience. By following the established patterns from successful packages like `@acme/ui` and `@convexcms/core`, we ensure consistency with the rest of the monorepo while delivering a best-in-class automation platform.

The architecture enables:

- **Independent integration development** with clear package boundaries
- **Make.com-like user experience** with dynamic field fetching and visual workflow building
- **Enterprise reliability** with robust error handling, monitoring, and versioning
- **Developer productivity** through TypeScript safety and established patterns
- **Future scalability** with the ability to add new integrations rapidly

This approach positions the Scenario Builder as a production-ready automation platform that can compete with established solutions while maintaining the modularity and extensibility required for long-term success.
