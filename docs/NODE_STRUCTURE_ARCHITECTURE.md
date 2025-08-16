# Node Structure Architecture

This document defines the standardized folder structure and organization for all nodes (both internal and external) in the integration system.

## Core Principles

1. **Self-Contained Nodes**: Each node lives in its own folder with all logic contained
2. **Separation of Concerns**: Metadata, actions, and triggers are in separate files
3. **Unified Structure**: Internal and external nodes follow the same organizational pattern
4. **Modular Design**: Easy to add/remove nodes without affecting others
5. **Type Safety**: Full TypeScript support with proper imports/exports

## Folder Structure

```
src/integrations/nodes/
├── external/
│   ├── wordpress/
│   │   ├── metadata.ts          # Node metadata and configuration
│   │   ├── actions.ts           # All actions for this node
│   │   ├── triggers.ts          # All triggers for this node (if any)
│   │   ├── connection.ts        # Connection definition and auth
│   │   ├── index.ts            # Main exports
│   │   └── types.ts            # Node-specific types (optional)
│   ├── stripe/
│   │   ├── metadata.ts
│   │   ├── actions.ts
│   │   ├── triggers.ts
│   │   ├── connection.ts
│   │   └── index.ts
│   └── monday/
│       ├── metadata.ts
│       ├── actions.ts
│       ├── triggers.ts
│       ├── connection.ts
│       └── index.ts
├── internal/
│   ├── database/
│   │   ├── metadata.ts          # Same structure as external
│   │   ├── actions.ts           # Database actions
│   │   ├── triggers.ts          # Database triggers (if any)
│   │   └── index.ts            # Main exports
│   ├── email/
│   │   ├── metadata.ts
│   │   ├── actions.ts
│   │   ├── triggers.ts
│   │   └── index.ts
│   └── auth/
│       ├── metadata.ts
│       ├── actions.ts
│       ├── triggers.ts
│       └── index.ts
└── registry.ts                 # Central registration
```

## File Responsibilities

### 1. `metadata.ts` - Node Metadata

Contains node metadata, configuration schemas, and UI definitions.

```typescript
// External node metadata
export const WordPressMetadata = {
  id: "external.wordpress",
  name: "WordPress",
  description: "Interact with WordPress sites via REST API",
  type: "external" as const,
  category: "cms",
  version: "1.0.0",
  icon: "FileText",
  color: "#21759B",
};

// Internal node metadata
export const DatabaseMetadata = {
  id: "internal.database",
  name: "Database Operations",
  description: "Internal database operations",
  type: "internal" as const,
  category: "database",
  version: "1.0.0",
  icon: "Database",
  color: "#059669",
};
```

### 2. `actions.ts` - Node Actions

Contains all action definitions for the node.

```typescript
// Each action is a separate definition
export const CreatePostAction: ActionDefinition = {
  id: "create_post",
  name: "Create Post",
  description: "Create a new WordPress post",
  // ... action implementation
};

export const UpdatePostAction: ActionDefinition = {
  id: "update_post",
  name: "Update Post",
  description: "Update an existing WordPress post",
  // ... action implementation
};

// Export all actions
export const WordPressActions = {
  create_post: CreatePostAction,
  update_post: UpdatePostAction,
  get_posts: GetPostsAction,
  delete_post: DeletePostAction,
};
```

### 3. `triggers.ts` - Node Triggers

Contains all trigger definitions for the node.

```typescript
export const PostCreatedTrigger: TriggerDefinition = {
  id: "post_created",
  name: "Post Created",
  description: "Triggered when a new post is created",
  // ... trigger implementation
};

export const PostUpdatedTrigger: TriggerDefinition = {
  id: "post_updated",
  name: "Post Updated",
  description: "Triggered when a post is updated",
  // ... trigger implementation
};

export const WordPressTriggers = {
  post_created: PostCreatedTrigger,
  post_updated: PostUpdatedTrigger,
};
```

### 4. `connection.ts` - Connection Definition (External only)

Contains connection and authentication configuration for external nodes.

```typescript
export const WordPressConnection: ConnectionDefinition = {
  id: "wordpress",
  name: "WordPress",
  type: "basic_auth",
  authSchema: z.object({
    baseUrl: z.string().url(),
    username: z.string().min(1),
    applicationPassword: z.string().min(1),
  }),
  testConnection: async (auth) => {
    // Test logic
  },
};
```

### 5. `index.ts` - Main Exports

Combines everything and exports the complete node definition.

```typescript
import { WordPressActions } from "./actions.js";
import { WordPressConnection } from "./connection.js";
import { WordPressMetadata } from "./metadata.js";
import { WordPressTriggers } from "./triggers.js";

export const WordPressNode: NodeDefinition = {
  metadata: WordPressMetadata,
  actions: WordPressActions,
  triggers: WordPressTriggers,
  connection: WordPressConnection, // External only
};

export { WordPressConnection } from "./connection.js";
```

## Type Definitions

Here are the core types that support this structure:

```typescript
// Base metadata for all nodes
export interface NodeMetadata {
  id: string;
  name: string;
  description: string;
  type: "internal" | "external";
  category: string;
  version: string;
  icon?: string;
  color?: string;
}

// Action definition
export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  outputSchema: z.ZodSchema<any>;
  settingsSchema?: z.ZodSchema<any>;
  execute: (context: ActionExecutionContext) => Promise<ActionExecutionResult>;
  validate?: (settings: unknown) => Promise<boolean>;
}

// Trigger definition
export interface TriggerDefinition {
  id: string;
  name: string;
  description: string;
  outputSchema: z.ZodSchema<any>;
  settingsSchema?: z.ZodSchema<any>;
  setup: (context: TriggerSetupContext) => Promise<void>;
  teardown: (context: TriggerTeardownContext) => Promise<void>;
  validate?: (settings: unknown) => Promise<boolean>;
}

// Connection definition (external nodes only)
export interface ConnectionDefinition {
  id: string;
  name: string;
  type: "oauth2" | "api_key" | "basic_auth" | "custom";
  authSchema: z.ZodSchema<any>;
  testConnection?: (auth: unknown) => Promise<boolean>;
}

// Complete node definition
export interface NodeDefinition {
  metadata: NodeMetadata;
  actions: Record<string, ActionDefinition>;
  triggers: Record<string, TriggerDefinition>;
  connection?: ConnectionDefinition; // External only
}
```

## Examples

### External Node Example (WordPress)

#### `metadata.ts`

```typescript
import type { NodeMetadata } from "@acme/integration-sdk";

export const WordPressMetadata: NodeMetadata = {
  id: "external.wordpress",
  name: "WordPress",
  description: "Interact with WordPress sites via REST API",
  type: "external",
  category: "cms",
  version: "1.0.0",
  icon: "FileText",
  color: "#21759B",
};
```

#### `actions.ts`

```typescript
import { z } from "zod";

import type {
  ActionDefinition,
  ActionExecutionContext,
  ActionExecutionResult,
} from "@acme/integration-sdk";

const CreatePostInputSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  status: z.enum(["publish", "draft", "private"]).default("draft"),
});

const CreatePostOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      id: z.number(),
      title: z.string(),
      status: z.string(),
      link: z.string().url(),
    })
    .optional(),
  error: z.string().optional(),
});

export const CreatePostAction: ActionDefinition = {
  id: "create_post",
  name: "Create Post",
  description: "Create a new WordPress post",
  inputSchema: CreatePostInputSchema,
  outputSchema: CreatePostOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    const input = CreatePostInputSchema.parse(context.inputData);
    const connection = context.connections.wordpress;

    try {
      // WordPress API call logic here
      const response = await fetch(
        `${connection.baseUrl}/wp-json/wp/v2/posts`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${connection.username}:${connection.applicationPassword}`)}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        },
      );

      if (!response.ok) {
        throw new Error(`WordPress API error: ${response.statusText}`);
      }

      const post = await response.json();

      return {
        success: true,
        data: {
          id: post.id,
          title: post.title.rendered,
          status: post.status,
          link: post.link,
        },
        logs: [`Created WordPress post: ${post.title.rendered}`],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        logs: [`Failed to create WordPress post: ${error}`],
      };
    }
  },
};

const UpdatePostAction: ActionDefinition = {
  id: "update_post",
  name: "Update Post",
  description: "Update an existing WordPress post",
  inputSchema: z.object({
    postId: z.number(),
    title: z.string().optional(),
    content: z.string().optional(),
    status: z.enum(["publish", "draft", "private"]).optional(),
  }),
  outputSchema: CreatePostOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    // Update logic here
    // ...
  },
};

export const WordPressActions = {
  create_post: CreatePostAction,
  update_post: UpdatePostAction,
};
```

#### `triggers.ts`

```typescript
import { z } from "zod";

import type {
  TriggerDefinition,
  TriggerSetupContext,
  TriggerTeardownContext,
} from "@acme/integration-sdk";

const PostCreatedOutputSchema = z.object({
  postId: z.number(),
  title: z.string(),
  content: z.string(),
  status: z.string(),
  author: z.string(),
  createdAt: z.string(),
});

export const PostCreatedTrigger: TriggerDefinition = {
  id: "post_created",
  name: "Post Created",
  description: "Triggered when a new WordPress post is created",
  outputSchema: PostCreatedOutputSchema,

  async setup(context: TriggerSetupContext): Promise<void> {
    // Set up webhook or polling for new posts
    const webhookUrl = `${context.baseUrl}/webhook/${context.triggerId}`;

    // Register webhook with WordPress
    await fetch(`${context.connection.baseUrl}/wp-json/wp/v2/webhooks`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${context.connection.username}:${context.connection.applicationPassword}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "post.created",
        target_url: webhookUrl,
      }),
    });
  },

  async teardown(context: TriggerTeardownContext): Promise<void> {
    // Remove webhook registration
    // ...
  },
};

export const WordPressTriggers = {
  post_created: PostCreatedTrigger,
};
```

#### `connection.ts`

```typescript
import { z } from "zod";

import type { ConnectionDefinition } from "@acme/integration-sdk";

export const WordPressConnection: ConnectionDefinition = {
  id: "wordpress",
  name: "WordPress",
  type: "basic_auth",
  authSchema: z.object({
    baseUrl: z.string().url("Must be a valid WordPress site URL"),
    username: z.string().min(1, "Username is required"),
    applicationPassword: z.string().min(1, "Application password is required"),
  }),

  async testConnection(auth: unknown): Promise<boolean> {
    try {
      const { baseUrl, username, applicationPassword } =
        WordPressConnection.authSchema.parse(auth);

      const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          Authorization: `Basic ${btoa(`${username}:${applicationPassword}`)}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("WordPress connection test failed:", error);
      return false;
    }
  },
};
```

#### `index.ts`

```typescript
import type { NodeDefinition } from "@acme/integration-sdk";

import { WordPressActions } from "./actions.js";
import { WordPressConnection } from "./connection.js";
import { WordPressMetadata } from "./metadata.js";
import { WordPressTriggers } from "./triggers.js";

export const WordPressNode: NodeDefinition = {
  metadata: WordPressMetadata,
  actions: WordPressActions,
  triggers: WordPressTriggers,
  connection: WordPressConnection,
};

// Export connection separately for registry
export { WordPressConnection } from "./connection.js";
```

### Internal Node Example (Database)

#### `metadata.ts`

```typescript
import type { NodeMetadata } from "@acme/integration-sdk";

export const DatabaseMetadata: NodeMetadata = {
  id: "internal.database",
  name: "Database Operations",
  description: "Internal database operations using Convex",
  type: "internal",
  category: "database",
  version: "1.0.0",
  icon: "Database",
  color: "#059669",
};
```

#### `actions.ts`

```typescript
import { z } from "zod";

import type {
  ActionDefinition,
  ActionExecutionContext,
  ActionExecutionResult,
} from "@acme/integration-sdk";

import { api } from "../../../../convex/_generated/api.js";

const CreateUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["user", "admin"]).default("user"),
});

const CreateUserOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      userId: z.string(),
      email: z.string(),
      name: z.string(),
    })
    .optional(),
  error: z.string().optional(),
});

export const CreateUserAction: ActionDefinition = {
  id: "create_user",
  name: "Create User",
  description: "Create a new user in the database",
  inputSchema: CreateUserInputSchema,
  outputSchema: CreateUserOutputSchema,

  async execute(
    context: ActionExecutionContext,
  ): Promise<ActionExecutionResult> {
    const input = CreateUserInputSchema.parse(context.inputData);

    try {
      // Use Convex internal API
      const userId = await context.convex.mutation(api.users.create, {
        email: input.email,
        name: input.name,
        role: input.role,
      });

      return {
        success: true,
        data: {
          userId,
          email: input.email,
          name: input.name,
        },
        logs: [`Created user: ${input.email}`],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        logs: [`Failed to create user: ${input.email}`],
      };
    }
  },
};

export const DatabaseActions = {
  create_user: CreateUserAction,
};
```

## Registry Structure

#### `registry.ts`

```typescript
import type {
  ConnectionDefinition,
  NodeDefinition,
} from "@acme/integration-sdk";

import { MondayConnection, MondayNode } from "./external/monday/index.js";
import { StripeConnection, StripeNode } from "./external/stripe/index.js";
// External nodes
import {
  WordPressConnection,
  WordPressNode,
} from "./external/wordpress/index.js";
import { AuthNode } from "./internal/auth/index.js";
// Internal nodes
import { DatabaseNode } from "./internal/database/index.js";
import { EmailNode } from "./internal/email/index.js";

export const nodeRegistry = new Map<string, NodeDefinition>();
export const connectionRegistry = new Map<string, ConnectionDefinition>();

// Register external nodes
const externalNodes = [WordPressNode, StripeNode, MondayNode];
const externalConnections = [
  WordPressConnection,
  StripeConnection,
  MondayConnection,
];

externalNodes.forEach((node) => {
  nodeRegistry.set(node.metadata.id, node);
});

externalConnections.forEach((connection) => {
  connectionRegistry.set(connection.id, connection);
});

// Register internal nodes
const internalNodes = [DatabaseNode, EmailNode, AuthNode];

internalNodes.forEach((node) => {
  nodeRegistry.set(node.metadata.id, node);
});

// Helper functions
export function getNode(id: string): NodeDefinition | undefined {
  return nodeRegistry.get(id);
}

export function getConnection(id: string): ConnectionDefinition | undefined {
  return connectionRegistry.get(id);
}

export function getAllNodes(): NodeDefinition[] {
  return Array.from(nodeRegistry.values());
}

export function getNodesByType(
  type: "internal" | "external",
): NodeDefinition[] {
  return Array.from(nodeRegistry.values()).filter(
    (node) => node.metadata.type === type,
  );
}

export function getNodesByCategory(category: string): NodeDefinition[] {
  return Array.from(nodeRegistry.values()).filter(
    (node) => node.metadata.category === category,
  );
}
```

## Benefits of This Structure

1. **Modularity**: Each node is completely self-contained
2. **Clarity**: Separate files for different concerns make code easier to understand
3. **Scalability**: Easy to add new nodes without touching existing ones
4. **Consistency**: Same structure for internal and external nodes
5. **Type Safety**: Full TypeScript support with proper imports
6. **Maintainability**: Changes to one node don't affect others
7. **Testing**: Each file can be tested independently
8. **Documentation**: Clear structure makes documentation easier

## Migration Strategy

1. Create the new folder structure
2. Move existing node logic into appropriate files
3. Update imports and exports
4. Update registry to use new structure
5. Test each node individually
6. Update documentation and examples

This structure provides a clean, scalable foundation for the integration system while maintaining consistency across all node types.
