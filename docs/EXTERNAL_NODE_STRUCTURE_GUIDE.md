# External Node Structure Guide

This guide explains the proper structure for defining external nodes and how to migrate existing implementations to follow the standardized pattern.

## Current Problems with External Nodes

Our external nodes in `apps/portal/src/integrations/nodes/external/` have inconsistent structures that cause several issues:

1. **Schema Duplication**: Defining schemas twice (top-level and in configSchema)
2. **Wrong IODefinition Structure**: Passing raw Zod schemas instead of IODefinition objects
3. **Inconsistent Processor Structure**: Some use function, some use object
4. **Mixed Auth Patterns**: Different approaches to authentication
5. **Missing Type Safety**: Improper typing and validation

## Standardized Structure

### 1. File Organization

```typescript
// 1. IMPORTS
import { z } from "zod";
import { ExternalNode, [AuthHandlers] } from "@acme/integration-sdk";
import type { ... } from "@acme/integration-sdk";

// 2. SCHEMAS (Define once, reuse)
export const ServiceInputSchema = z.object({...});
export const ServiceOutputSchema = z.object({...});
export const ServiceSettingsSchema = z.object({...});

// 3. CONNECTION DEFINITION
export const ServiceConnectionDefinition: ConnectionDefinition = {...};

// 4. NODE IMPLEMENTATION CLASS
export class ServiceExternalNode extends ExternalNode {...}

// 5. NODE DEFINITION
export const ServiceNodeDefinition: IntegrationNodeDefinition = {...};

// 6. EXPORTS
export const ServiceConnections = [ServiceConnectionDefinition];
```

### 2. Schema Definition (Do Once)

```typescript
// ✅ CORRECT: Define schemas once at the top
export const WordPressInputSchema = z.object({
  action: z.enum(["create_post", "update_post", "get_posts", "delete_post"]),
  postData: z
    .object({
      title: z.string().min(1),
      content: z.string().optional(),
      status: z.enum(["publish", "draft", "private"]).default("draft"),
    })
    .optional(),
  postId: z.number().optional(),
});

export const WordPressOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      post: z
        .object({
          id: z.number(),
          title: z.string(),
          content: z.string(),
          status: z.string(),
          link: z.string().url(),
        })
        .optional(),
      posts: z
        .array(
          z.object({
            id: z.number(),
            title: z.string(),
            excerpt: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export const WordPressSettingsSchema = z.object({
  timeout: z.number().default(30000),
  defaultStatus: z.enum(["publish", "draft", "private"]).default("draft"),
});
```

### 3. Connection Definition

```typescript
export const WordPressConnectionDefinition: ConnectionDefinition = {
  id: "wordpress",
  name: "WordPress",
  type: "basic_auth",
  authSchema: z.object({
    baseUrl: z.string().url("Must be a valid WordPress site URL"),
    username: z.string().min(1, "Username is required"),
    applicationPassword: z.string().min(1, "Application password is required"),
  }),
  testConnection: async (auth: unknown): Promise<boolean> => {
    try {
      const { baseUrl, username, applicationPassword } =
        WordPressConnectionDefinition.authSchema.parse(auth);

      const authHandler = new BasicAuthHandler();
      const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
        headers: await authHandler.authenticate(
          {},
          { username, password: applicationPassword },
        ),
      });

      return response.ok;
    } catch (error) {
      console.error("WordPress connection test failed:", error);
      return false;
    }
  },
};
```

### 4. Node Implementation Class

```typescript
export class WordPressExternalNode extends ExternalNode {
  constructor() {
    const rateLimitConfig: RateLimitConfig = {
      maxRequests: 50,
      windowMs: 60000, // 1 minute
      strategy: "sliding",
    };

    const authHandler = new BasicAuthHandler();

    super(
      "https://wordpress.com", // Default base URL
      authHandler,
      rateLimitConfig,
    );
  }

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    try {
      // Parse inputs
      const input = WordPressInputSchema.parse(context.inputData);
      const settings = WordPressSettingsSchema.parse(context.settings);
      const connection = WordPressConnectionDefinition.authSchema.parse(
        context.connections.wordpress,
      );

      // Set up auth
      const auth = {
        username: connection.username,
        password: connection.applicationPassword,
      };

      // Execute action
      const { action, postData, postId } = input;

      switch (action) {
        case "create_post":
          return await this.createPost(connection.baseUrl, auth, postData!);
        case "update_post":
          return await this.updatePost(
            connection.baseUrl,
            auth,
            postId!,
            postData!,
          );
        case "get_posts":
          return await this.getPosts(connection.baseUrl, auth);
        case "delete_post":
          return await this.deletePost(connection.baseUrl, auth, postId!);
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      return this.handleApiError(error, {
        operation: `wordpress-${(context.inputData as any)?.action || "unknown"}`,
        endpoint: "wordpress-api",
        userId: context.nodeId,
      });
    }
  }

  private async createPost(
    baseUrl: string,
    auth: any,
    postData: any,
  ): Promise<NodeExecutionResult> {
    const result = await this.apiClient.post(
      `${baseUrl}/wp-json/wp/v2/posts`,
      postData,
      { auth },
    );

    return {
      success: true,
      data: { post: result },
      logs: [`Created WordPress post: ${result.title.rendered}`],
    };
  }

  // ... other helper methods
}
```

### 5. Node Definition (CRITICAL STRUCTURE)

```typescript
export const WordPressNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "external.wordpress",
    name: "WordPress",
    description: "Interact with WordPress sites via REST API",
    type: "external",
    category: "cms",
    version: "2.0.0",
    icon: "FileText",
    color: "#21759B",
  },

  // ✅ CRITICAL: Use IODefinition structure
  configSchema: {
    input: {
      schema: WordPressInputSchema,
      description: "Input parameters for WordPress operations",
      examples: [
        {
          action: "create_post",
          postData: {
            title: "My Post",
            content: "Post content",
            status: "draft",
          },
        },
      ],
      required: true,
    },
    output: {
      schema: WordPressOutputSchema,
      description: "Result from WordPress operation",
      examples: [
        {
          success: true,
          data: { post: { id: 123, title: "My Post" } },
        },
      ],
    },
    settings: {
      schema: WordPressSettingsSchema,
      description: "WordPress node configuration",
      required: false,
    },
  },

  // ✅ CRITICAL: processor must be object with methods
  processor: {
    execute: async (
      context: NodeExecutionContext,
    ): Promise<NodeExecutionResult> => {
      const node = new WordPressExternalNode();
      return await node.execute(context);
    },
    validate: async (settings: unknown): Promise<boolean> => {
      try {
        WordPressSettingsSchema.parse(settings);
        return true;
      } catch {
        return false;
      }
    },
    setup: async (): Promise<void> => {
      console.log("WordPress node setup completed");
    },
    teardown: async (): Promise<void> => {
      console.log("WordPress node cleanup completed");
    },
  },

  // Auth configuration for UI
  auth: {
    type: "basic_auth",
    fields: [
      {
        key: "baseUrl",
        label: "WordPress Site URL",
        type: "text",
        description: "The URL of your WordPress site",
        required: true,
      },
      {
        key: "username",
        label: "Username",
        type: "text",
        description: "Your WordPress username",
        required: true,
      },
      {
        key: "applicationPassword",
        label: "Application Password",
        type: "password",
        description: "WordPress application password (not your login password)",
        required: true,
      },
    ],
    testEndpoint: "/wp-json/wp/v2/users/me",
  },

  onInstall: async (): Promise<void> => {
    console.log("WordPress integration installed");
  },

  onUninstall: async (): Promise<void> => {
    console.log("WordPress integration uninstalled");
  },
};
```

## Migration Guide

### From Current WordPress Node

❌ **WRONG (Current)**:

```typescript
export const WordPressNodeDefinition: IntegrationNodeDefinition = {
  metadata: { ... },

  // Wrong: Raw Zod schemas instead of IODefinition
  configSchema: {
    input: z.object({ ... }),
    output: z.object({ ... }),
    settings: z.object({ ... }),
  },

  // Wrong: connections array (deprecated)
  connections: [WordPressConnectionDefinition],

  // Wrong: execute function directly
  execute: async (context) => { ... },

  // Wrong: validate function directly
  async validate(settings) { ... },
};
```

✅ **CORRECT (New)**:

```typescript
export const WordPressNodeDefinition: IntegrationNodeDefinition = {
  metadata: { ... },

  // Correct: IODefinition with schema + metadata
  configSchema: {
    input: {
      schema: WordPressInputSchema,
      description: "...",
      examples: [...],
      required: true,
    },
    output: {
      schema: WordPressOutputSchema,
      description: "...",
    },
    settings: {
      schema: WordPressSettingsSchema,
      description: "...",
      required: false,
    },
  },

  // Correct: processor object with methods
  processor: {
    execute: async (context) => {
      const node = new WordPressExternalNode();
      return await node.execute(context);
    },
    validate: async (settings) => {
      try {
        WordPressSettingsSchema.parse(settings);
        return true;
      } catch {
        return false;
      }
    },
    setup: async () => { ... },
    teardown: async () => { ... },
  },

  // Correct: auth configuration for UI
  auth: { ... },

  // Correct: lifecycle hooks
  onInstall: async () => { ... },
  onUninstall: async () => { ... },
};
```

## Internal Node Structure

Internal nodes follow a similar but slightly different pattern:

```typescript
export const DatabaseNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "internal.database.create_user",
    name: "Create User",
    description: "Create a new user in the database",
    type: "system", // Different from external
    category: "database",
    version: "1.0.0",
  },

  configSchema: {
    input: {
      schema: z.object({
        email: z.string().email(),
        name: z.string(),
        role: z.enum(["user", "admin"]),
      }),
      description: "User data to create",
      required: true,
    },
    output: {
      schema: z.object({
        success: z.boolean(),
        userId: z.string().optional(),
        error: z.string().optional(),
      }),
      description: "Result of user creation",
    },
    settings: {
      schema: z.object({
        sendWelcomeEmail: z.boolean().default(true),
      }),
      description: "User creation settings",
      required: false,
    },
  },

  processor: {
    execute: async (
      context: NodeExecutionContext,
    ): Promise<NodeExecutionResult> => {
      // Internal implementation using database/Convex
      const { email, name, role } = context.inputData as any;

      try {
        // Use internal APIs/Convex mutations
        const userId = await createUser({ email, name, role });

        return {
          success: true,
          data: { userId },
          logs: [`Created user: ${email}`],
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          logs: [`Failed to create user: ${email}`],
        };
      }
    },

    validate: async (settings: unknown): Promise<boolean> => {
      // Internal validation logic
      return true;
    },
  },

  // No auth needed for internal nodes
  // No connections needed for internal nodes
};
```

## Registry Structure

For proper registration, create index files:

```typescript
// apps/portal/src/integrations/registry.ts
import * as ExternalNodes from "./nodes/external/index.js";
import * as InternalNodes from "./nodes/internal/index.js";

// apps/portal/src/integrations/nodes/external/index.ts
export {
  WordPressNodeDefinition,
  WordPressConnections,
} from "./wordpress/node.js";
export { MondayNodeDefinition, MondayConnections } from "./monday/node.js";
export { StripeNodeDefinition, StripeConnections } from "./stripe/node.js";

// apps/portal/src/integrations/nodes/internal/index.ts
export { DatabaseNodeDefinition } from "./database/create-user.js";
export { EmailNodeDefinition } from "./email/send-email.js";

export const nodeRegistry = new Map();
export const connectionRegistry = new Map();

// Register external nodes
Object.values(ExternalNodes).forEach((nodeOrConnection) => {
  if ("metadata" in nodeOrConnection) {
    nodeRegistry.set(nodeOrConnection.metadata.id, nodeOrConnection);
  } else if (Array.isArray(nodeOrConnection)) {
    nodeOrConnection.forEach((conn) => {
      connectionRegistry.set(conn.id, conn);
    });
  }
});

// Register internal nodes
Object.values(InternalNodes).forEach((node) => {
  if ("metadata" in node) {
    nodeRegistry.set(node.metadata.id, node);
  }
});
```

## Key Differences Summary

| Aspect               | ❌ Current (Wrong)              | ✅ Standardized (Correct)                   |
| -------------------- | ------------------------------- | ------------------------------------------- |
| **Schema Structure** | Raw Zod schemas in configSchema | IODefinition with schema + metadata         |
| **Processor**        | Function directly on definition | Object with execute/validate/setup/teardown |
| **Connections**      | `connections` array             | `auth` configuration + ConnectionDefinition |
| **Error Handling**   | Manual try/catch                | ExternalNode.handleApiError()               |
| **Class Structure**  | Functional approach             | Class extending ExternalNode                |
| **Auth Patterns**    | Mixed/inconsistent              | Standardized AuthHandler usage              |
| **Type Safety**      | Partial/inconsistent            | Full runtime + compile-time validation      |

## Migration Checklist

- [ ] Move to class-based ExternalNode approach
- [ ] Fix configSchema to use IODefinition structure
- [ ] Replace execute function with processor object
- [ ] Add auth configuration for UI
- [ ] Implement proper error handling
- [ ] Add lifecycle hooks (onInstall/onUninstall)
- [ ] Update imports to use integration-sdk types
- [ ] Test connection validation
- [ ] Add examples and descriptions
- [ ] Export connections for registry

This standardized structure ensures consistency, better error handling, proper type safety, and easier maintenance across all external nodes.
