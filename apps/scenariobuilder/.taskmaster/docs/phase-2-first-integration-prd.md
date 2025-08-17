# Phase 2: First Integration - Scenario Builder

## Product Requirements Document (PRD)

### Version: 1.0

### Date: January 16, 2025

### Phase: 2 - First Integration

### Duration: Weeks 4-6

---

## Executive Summary

Phase 2 focuses on creating the first real integration package (`@acme/integration-wordpress`) and building the complete UI components for integration configuration. This phase will implement a full WordPress integration with dynamic fields and test the complete Make.com-like workflow. The goal is to have a working end-to-end integration that demonstrates the platform's capabilities.

## Success Criteria

**Phase 2 is complete when:**

- ✅ `@acme/integration-wordpress` package is created and functional
- ✅ Full WordPress integration with dynamic fields is implemented
- ✅ UI components for integration configuration are complete
- ✅ Complete Make.com-like workflow is tested and working
- ✅ `pnpm build` runs successfully with no errors
- ✅ WordPress integration can be used to create posts with dynamic category selection

---

## Technical Requirements

### 1. WordPress Integration Package

#### **Package Structure**

```
packages/
├── integration-nodes/
│   └── wordpress/
│       ├── package.json               # @acme/integration-wordpress
│       ├── src/
│       │   ├── index.ts              # Main exports
│       │   ├── manifest.ts           # Integration manifest
│       │   ├── actions/
│       │   │   ├── index.ts          # Export all actions
│       │   │   ├── createPost.ts     # Create WordPress post
│       │   │   ├── createMedia.ts    # Upload media
│       │   │   ├── getCategories.ts  # Fetch categories (dynamic field)
│       │   │   ├── getTags.ts        # Fetch tags (dynamic field)
│       │   │   └── getUsers.ts       # Fetch users (dynamic field)
│       │   ├── triggers/
│       │   │   ├── index.ts
│       │   │   └── postCreated.ts    # WordPress webhook trigger
│       │   ├── connections/
│       │   │   ├── index.ts
│       │   │   ├── basicAuth.ts      # Username/password auth
│       │   │   └── oauth.ts          # OAuth 2.0 auth
│       │   ├── types.ts              # WordPress-specific types
│       │   ├── utils/
│       │   │   ├── api.ts            # WordPress REST API client
│       │   │   ├── validation.ts     # Input validation
│       │   │   └── transformers.ts   # Data transformation utilities
│       │   └── constants.ts          # WordPress API constants
│       ├── tests/
│       │   ├── actions.test.ts
│       │   ├── connections.test.ts
│       │   └── utils.test.ts
│       └── README.md
```

#### **Package Configuration**

```json
// packages/integration-nodes/wordpress/package.json
{
  "name": "@acme/integration-wordpress",
  "version": "1.0.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
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
    "zod": "^3.22.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### 2. WordPress Integration Implementation

#### **Integration Manifest (`src/manifest.ts`)**

```typescript
import { defineIntegration } from "@acme/scenario-builder-core";

import * as actions from "./actions/index.js";
import * as connections from "./connections/index.js";
import * as triggers from "./triggers/index.js";

export const wordpressManifest = defineIntegration({
  metadata: {
    id: "wordpress",
    name: "WordPress",
    description: "Connect to WordPress sites via REST API",
    version: "1.0.0",
    category: "cms",
    icon: "FileText",
    color: "#21759B",
    author: "Integration Team",
    keywords: ["wordpress", "cms", "blog", "content", "posts"],
    tags: ["popular", "cms", "content-management"],
  },
  connections: connections.definitions,
  actions: actions.definitions,
  triggers: triggers.definitions,
});

export default wordpressManifest;
```

#### **WordPress Types (`src/types.ts`)**

```typescript
export interface WordPressConnection {
  siteUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
  oauthToken?: string;
  apiVersion: "v1" | "v2";
  timeout: number;
}

export interface WordPressPost {
  id: number;
  title: string;
  content: string;
  excerpt: string;
  status: "draft" | "publish" | "private" | "pending";
  categories: number[];
  tags: number[];
  featured_media: number;
  author: number;
  date: string;
  modified: string;
  slug: string;
  link: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  link: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  link: string;
}

export interface WordPressUser {
  id: number;
  name: string;
  username: string;
  email: string;
  roles: string[];
  avatar_urls: Record<string, string>;
}

export interface CreatePostInput {
  title: string;
  content: string;
  excerpt?: string;
  status?: "draft" | "publish" | "private" | "pending";
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  author?: number;
  slug?: string;
}

export interface CreatePostOutput {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
  post?: WordPressPost;
}
```

#### **WordPress API Client (`src/utils/api.ts`)**

```typescript
import axios, { AxiosInstance, AxiosResponse } from "axios";

import {
  WordPressCategory,
  WordPressConnection,
  WordPressPost,
  WordPressTag,
  WordPressUser,
} from "../types.js";

export class WordPressAPIClient {
  private client: AxiosInstance;
  private connection: WordPressConnection;

  constructor(connection: WordPressConnection) {
    this.connection = connection;

    this.client = axios.create({
      baseURL: `${connection.siteUrl}/wp-json/wp/v${connection.apiVersion}`,
      timeout: connection.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Add authentication
    if (connection.apiKey) {
      this.client.defaults.headers.common["Authorization"] =
        `Bearer ${connection.apiKey}`;
    } else if (connection.username && connection.password) {
      this.client.defaults.auth = {
        username: connection.username,
        password: connection.password,
      };
    } else if (connection.oauthToken) {
      this.client.defaults.headers.common["Authorization"] =
        `Bearer ${connection.oauthToken}`;
    }
  }

  async createPost(postData: any): Promise<WordPressPost> {
    const response: AxiosResponse<WordPressPost> = await this.client.post(
      "/posts",
      postData,
    );
    return response.data;
  }

  async getCategories(): Promise<WordPressCategory[]> {
    const response: AxiosResponse<WordPressCategory[]> = await this.client.get(
      "/categories",
      {
        params: { per_page: 100, hide_empty: false },
      },
    );
    return response.data;
  }

  async getTags(): Promise<WordPressTag[]> {
    const response: AxiosResponse<WordPressTag[]> = await this.client.get(
      "/tags",
      {
        params: { per_page: 100, hide_empty: false },
      },
    );
    return response.data;
  }

  async getUsers(): Promise<WordPressUser[]> {
    const response: AxiosResponse<WordPressUser[]> = await this.client.get(
      "/users",
      {
        params: { per_page: 100 },
      },
    );
    return response.data;
  }

  async uploadMedia(
    file: File,
    filename: string,
  ): Promise<{ id: number; url: string }> {
    const formData = new FormData();
    formData.append("file", file, filename);

    const response = await this.client.post("/media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return {
      id: response.data.id,
      url: response.data.source_url,
    };
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.get("/");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }
}
```

#### **Create Post Action (`src/actions/createPost.ts`)**

```typescript
import { z } from "zod";

import { defineAction } from "@acme/scenario-builder-core";

import { CreatePostInput, CreatePostOutput } from "../types.js";
import { WordPressAPIClient } from "../utils/api.js";

export const createPost = defineAction({
  id: "create_post",
  name: "Create Post",
  description: "Create a new WordPress post",
  category: "content",

  configSchema: {
    input: z.object({
      title: z.string().min(1, "Title is required").max(200, "Title too long"),
      content: z.string().min(1, "Content is required"),
      excerpt: z.string().optional(),
      status: z
        .enum(["draft", "publish", "private", "pending"])
        .default("draft"),
    }),

    settings: z.object({
      categories: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      featuredImage: z.string().optional(),
      author: z.string().optional(),
      slug: z.string().optional(),
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
        action: "get_categories",
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
        allowCustom: true,
        transform: (data: any[]) =>
          data.map((tag) => ({ label: tag.name, value: tag.id.toString() })),
      },
    },
    {
      fieldName: "settings.author",
      type: "select",
      label: "Author",
      description: "Select post author",
      fetchOptions: {
        action: "get_users",
        dependsOn: ["connectionId"],
        cacheTimeout: 600, // 10 minutes
        transform: (data: any[]) =>
          data.map((user) => ({ label: user.name, value: user.id.toString() })),
      },
    },
  ],

  async execute({ input, settings, connection }): Promise<CreatePostOutput> {
    try {
      const api = new WordPressAPIClient(connection);

      // Prepare post data
      const postData: CreatePostInput = {
        title: input.title,
        content: input.content,
        excerpt: input.excerpt,
        status: input.status,
      };

      // Add categories if specified
      if (settings.categories && settings.categories.length > 0) {
        postData.categories = settings.categories.map(Number);
      }

      // Add tags if specified
      if (settings.tags && settings.tags.length > 0) {
        postData.tags = settings.tags.map(Number);
      }

      // Add featured image if specified
      if (settings.featuredImage) {
        postData.featured_media = Number(settings.featuredImage);
      }

      // Add author if specified
      if (settings.author) {
        postData.author = Number(settings.author);
      }

      // Add custom slug if specified
      if (settings.slug) {
        postData.slug = settings.slug;
      }

      // Create the post
      const post = await api.createPost(postData);

      return {
        success: true,
        postId: post.id,
        postUrl: post.link,
        post,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

#### **Dynamic Field Actions**

**Get Categories (`src/actions/getCategories.ts`):**

```typescript
import { defineAction } from "@acme/scenario-builder-core";

import { WordPressAPIClient } from "../utils/api.js";

export const getCategories = defineAction({
  id: "get_categories",
  name: "Get Categories",
  description: "Fetch WordPress categories for field population",
  category: "internal",

  configSchema: {
    input: z.object({}),
    settings: z.object({}),
    output: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        count: z.number(),
      }),
    ),
  },

  async execute({ connection }) {
    const api = new WordPressAPIClient(connection);
    return await api.getCategories();
  },
});
```

**Get Tags (`src/actions/getTags.ts`):**

```typescript
import { defineAction } from "@acme/scenario-builder-core";

import { WordPressAPIClient } from "../utils/api.js";

export const getTags = defineAction({
  id: "get_tags",
  name: "Get Tags",
  description: "Fetch WordPress tags for field population",
  category: "internal",

  configSchema: {
    input: z.object({}),
    settings: z.object({}),
    output: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        slug: z.string(),
        description: z.string(),
        count: z.number(),
      }),
    ),
  },

  async execute({ connection }) {
    const api = new WordPressAPIClient(connection);
    return await api.getTags();
  },
});
```

**Get Users (`src/actions/getUsers.ts`):**

```typescript
import { defineAction } from "@acme/scenario-builder-core";

import { WordPressAPIClient } from "../utils/api.js";

export const getUsers = defineAction({
  id: "get_users",
  name: "Get Users",
  description: "Fetch WordPress users for field population",
  category: "internal",

  configSchema: {
    input: z.object({}),
    settings: z.object({}),
    output: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        username: z.string(),
        email: z.string(),
        roles: z.array(z.string()),
      }),
    ),
  },

  async execute({ connection }) {
    const api = new WordPressAPIClient(connection);
    return await api.getUsers();
  },
});
```

#### **Connection Definitions (`src/connections/index.ts`)**

```typescript
import { z } from "zod";

import { defineConnection } from "@acme/scenario-builder-core";

export const basicAuth = defineConnection({
  id: "basic_auth",
  name: "Username & Password",
  description: "Connect using WordPress username and password",
  category: "authentication",

  configSchema: z.object({
    siteUrl: z.string().url("Invalid WordPress site URL"),
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    apiVersion: z.enum(["v1", "v2"]).default("v2"),
    timeout: z.number().min(1000).max(60000).default(30000),
  }),

  testConnection: async (config) => {
    const api = new WordPressAPIClient(config);
    return await api.testConnection();
  },
});

export const oauth = defineConnection({
  id: "oauth",
  name: "OAuth 2.0",
  description: "Connect using OAuth 2.0 authentication",
  category: "authentication",

  configSchema: z.object({
    siteUrl: z.string().url("Invalid WordPress site URL"),
    clientId: z.string().min(1, "Client ID is required"),
    clientSecret: z.string().min(1, "Client Secret is required"),
    redirectUri: z.string().url("Invalid redirect URI"),
    oauthToken: z.string().min(1, "OAuth token is required"),
    apiVersion: z.enum(["v1", "v2"]).default("v2"),
    timeout: z.number().min(1000).max(60000).default(30000),
  }),

  testConnection: async (config) => {
    const api = new WordPressAPIClient(config);
    return await api.testConnection();
  },
});

export const definitions = {
  basicAuth,
  oauth,
};
```

### 3. Enhanced UI Components

#### **Dynamic Field Implementation (`src/components/DynamicField.tsx`)**

```typescript
import React, { useState, useEffect } from 'react';
import { DynamicField as DynamicFieldType } from '@acme/scenario-builder-core';

interface DynamicFieldProps {
  field: DynamicFieldType;
  value: any;
  onChange: (value: any) => void;
  connectionId?: string;
  integrationId?: string;
  disabled?: boolean;
}

export function DynamicField({
  field,
  value,
  onChange,
  connectionId,
  integrationId,
  disabled
}: DynamicFieldProps) {
  const [options, setOptions] = useState<Array<{label: string, value: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch dynamic options when dependencies change
  useEffect(() => {
    if (!field.fetchOptions || !connectionId || !integrationId) return;

    const fetchOptions = async () => {
      setLoading(true);
      setError(null);

      try {
        // This will be implemented in Phase 3 with Convex integration
        // For now, we'll use mock data
        const mockOptions = [
          { label: 'Option 1', value: '1' },
          { label: 'Option 2', value: '2' },
          { label: 'Option 3', value: '3' },
        ];

        if (field.fetchOptions.transform) {
          setOptions(field.fetchOptions.transform(mockOptions));
        } else {
          setOptions(mockOptions);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch options');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [field, connectionId, integrationId]);

  const handleChange = (newValue: any) => {
    if (!disabled) {
      onChange(newValue);
    }
  };

  if (loading) {
    return (
      <div className="dynamic-field loading">
        <label>{field.label}</label>
        <div className="loading-spinner">Loading options...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dynamic-field error">
        <label>{field.label}</label>
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="dynamic-field">
      <label>{field.label}</label>
      <p className="description">{field.description}</p>

      {field.type === 'select' && (
        <select
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">Select...</option>
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {field.type === 'multi-select' && (
        <div className="multi-select">
          {options.map(option => (
            <label key={option.value} className="checkbox-option">
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(option.value)}
                onChange={(e) => {
                  const currentValue = Array.isArray(value) ? value : [];
                  if (e.target.checked) {
                    handleChange([...currentValue, option.value]);
                  } else {
                    handleChange(currentValue.filter(v => v !== option.value));
                  }
                }}
                disabled={disabled}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}

      {field.type === 'input' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
          placeholder={`Enter ${field.label.toLowerCase()}`}
        />
      )}
    </div>
  );
}
```

#### **Connection Manager Component (`src/components/ConnectionManager.tsx`)**

```typescript
import React, { useState } from 'react';
import { ConnectionDefinition } from '@acme/scenario-builder-core';

interface ConnectionManagerProps {
  connections: ConnectionDefinition[];
  onConnectionCreate: (connection: any) => void;
  onConnectionSelect: (connectionId: string) => void;
  selectedConnectionId?: string;
}

export function ConnectionManager({
  connections,
  onConnectionCreate,
  onConnectionSelect,
  selectedConnectionId,
}: ConnectionManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedConnectionType, setSelectedConnectionType] = useState<string>('');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState(false);

  const handleCreateConnection = async () => {
    if (!selectedConnectionType) return;

    setTesting(true);
    try {
      const connectionDef = connections.find(c => c.id === selectedConnectionType);
      if (!connectionDef) throw new Error('Connection type not found');

      // Test connection first
      const testResult = await connectionDef.testConnection(formData);
      if (!testResult.success) {
        throw new Error(testResult.error || 'Connection test failed');
      }

      // Create connection
      const connection = {
        id: `conn_${Date.now()}`,
        type: selectedConnectionType,
        config: formData,
        createdAt: new Date().toISOString(),
      };

      onConnectionCreate(connection);
      setShowCreateForm(false);
      setFormData({});
      setSelectedConnectionType('');
    } catch (error) {
      console.error('Failed to create connection:', error);
      alert(`Failed to create connection: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="connection-manager">
      <h3>Connections</h3>

      {!showCreateForm ? (
        <div className="connection-list">
          <button
            className="create-connection-btn"
            onClick={() => setShowCreateForm(true)}
          >
            + Create New Connection
          </button>

          {/* Connection list will be populated in later phases */}
          <div className="no-connections">
            <p>No connections yet. Create your first connection to get started.</p>
          </div>
        </div>
      ) : (
        <div className="create-connection-form">
          <h4>Create New Connection</h4>

          <div className="form-group">
            <label>Connection Type</label>
            <select
              value={selectedConnectionType}
              onChange={(e) => setSelectedConnectionType(e.target.value)}
            >
              <option value="">Select connection type...</option>
              {connections.map(connection => (
                <option key={connection.id} value={connection.id}>
                  {connection.name}
                </option>
              ))}
            </select>
          </div>

          {selectedConnectionType && (
            <div className="connection-config">
              {/* Dynamic form fields based on connection type */}
              <p>Configuration form will be implemented in Phase 3</p>
            </div>
          )}

          <div className="form-actions">
            <button
              onClick={() => setShowCreateForm(false)}
              disabled={testing}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateConnection}
              disabled={!selectedConnectionType || testing}
              className="primary"
            >
              {testing ? 'Testing...' : 'Create Connection'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4. Testing & Validation

#### **Unit Tests for WordPress Integration**

```typescript
// packages/integration-nodes/wordpress/tests/actions.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createPost } from "../src/actions/createPost.js";
import { WordPressAPIClient } from "../src/utils/api.js";

vi.mock("../src/utils/api.js");

describe("WordPress Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createPost", () => {
    it("should create a post successfully", async () => {
      const mockApi = {
        createPost: vi.fn().mockResolvedValue({
          id: 123,
          title: "Test Post",
          link: "https://example.com/test-post",
        }),
      };

      vi.mocked(WordPressAPIClient).mockImplementation(() => mockApi as any);

      const result = await createPost.execute({
        input: {
          title: "Test Post",
          content: "This is a test post",
          status: "draft",
        },
        settings: {
          categories: ["1", "2"],
          tags: ["tag1", "tag2"],
        },
        connection: {
          siteUrl: "https://example.com",
          username: "testuser",
          password: "testpass",
        },
      });

      expect(result.success).toBe(true);
      expect(result.postId).toBe(123);
      expect(result.postUrl).toBe("https://example.com/test-post");
      expect(mockApi.createPost).toHaveBeenCalledWith({
        title: "Test Post",
        content: "This is a test post",
        status: "draft",
        categories: [1, 2],
        tags: [1, 2],
      });
    });

    it("should handle errors gracefully", async () => {
      const mockApi = {
        createPost: vi.fn().mockRejectedValue(new Error("API Error")),
      };

      vi.mocked(WordPressAPIClient).mockImplementation(() => mockApi as any);

      const result = await createPost.execute({
        input: {
          title: "Test Post",
          content: "This is a test post",
        },
        settings: {},
        connection: {
          siteUrl: "https://example.com",
          username: "testuser",
          password: "testpass",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("API Error");
    });
  });
});
```

#### **Integration Tests**

```typescript
// packages/integration-nodes/wordpress/tests/integration.test.ts
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { WordPressAPIClient } from "../src/utils/api.js";

describe("WordPress API Integration", () => {
  let apiClient: WordPressAPIClient;

  beforeAll(() => {
    // Set up test WordPress site connection
    apiClient = new WordPressAPIClient({
      siteUrl: process.env.TEST_WORDPRESS_URL || "https://test.example.com",
      username: process.env.TEST_WORDPRESS_USERNAME || "testuser",
      password: process.env.TEST_WORDPRESS_PASSWORD || "testpass",
      apiVersion: "v2",
      timeout: 10000,
    });
  });

  it("should connect to WordPress site", async () => {
    const result = await apiClient.testConnection();
    expect(result.success).toBe(true);
  });

  it("should fetch categories", async () => {
    const categories = await apiClient.getCategories();
    expect(Array.isArray(categories)).toBe(true);
    categories.forEach((category) => {
      expect(category).toHaveProperty("id");
      expect(category).toHaveProperty("name");
      expect(category).toHaveProperty("slug");
    });
  });

  it("should fetch tags", async () => {
    const tags = await apiClient.getTags();
    expect(Array.isArray(tags)).toBe(true);
    tags.forEach((tag) => {
      expect(tag).toHaveProperty("id");
      expect(tag).toHaveProperty("name");
      expect(tag).toHaveProperty("slug");
    });
  });

  it("should fetch users", async () => {
    const users = await apiClient.getUsers();
    expect(Array.isArray(users)).toBe(true);
    users.forEach((user) => {
      expect(user).toHaveProperty("id");
      expect(user).toHaveProperty("name");
      expect(user).toHaveProperty("username");
    });
  });
});
```

### 5. Main App Integration

#### **Import WordPress Integration**

```typescript
// apps/scenariobuilder/src/lib/integrations/wordpress.ts
import wordpressManifest from "@acme/integration-wordpress";
import { globalRegistry } from "@acme/scenario-builder-core";

// Register WordPress integration
export function registerWordPressIntegration(): void {
  globalRegistry.register("wordpress", wordpressManifest);
}

// Get WordPress actions
export function getWordPressActions() {
  const entry = globalRegistry.get("wordpress");
  if (!entry) return [];

  return Object.values(entry.manifest.actions);
}

// Get WordPress triggers
export function getWordPressTriggers() {
  const entry = globalRegistry.get("wordpress");
  if (!entry) return [];

  return Object.values(entry.manifest.triggers);
}

// Get WordPress connection types
export function getWordPressConnections() {
  const entry = globalRegistry.get("wordpress");
  if (!entry) return [];

  return Object.values(entry.manifest.connections);
}
```

#### **WordPress Integration Component**

```typescript
// apps/scenariobuilder/src/components/WordPressIntegration.tsx
import React, { useState } from 'react';
import {
  IntegrationCard,
  ActionSelector,
  DynamicField,
  ConnectionManager
} from '@acme/scenario-builder-ui';
import { getWordPressActions, getWordPressConnections } from '../lib/integrations/wordpress';

export function WordPressIntegration() {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [actionConfig, setActionConfig] = useState<Record<string, any>>({});

  const actions = getWordPressActions();
  const connections = getWordPressConnections();

  const handleActionSelect = (action: any) => {
    setSelectedAction(action.id);
    setActionConfig({});
  };

  const handleConfigChange = (fieldName: string, value: any) => {
    setActionConfig(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleExecute = async () => {
    if (!selectedAction || !selectedConnection) return;

    try {
      // This will be implemented in Phase 3 with Convex
      console.log('Executing action:', {
        action: selectedAction,
        connection: selectedConnection,
        config: actionConfig,
      });

      alert('Action execution will be implemented in Phase 3');
    } catch (error) {
      console.error('Action execution failed:', error);
      alert(`Action execution failed: ${error}`);
    }
  };

  return (
    <div className="wordpress-integration">
      <h2>WordPress Integration</h2>

      <div className="integration-overview">
        <IntegrationCard
          integration={{
            id: 'wordpress',
            name: 'WordPress',
            description: 'Connect to WordPress sites via REST API',
            version: '1.0.0',
            category: 'cms',
            icon: 'FileText',
            color: '#21759B',
            author: 'Integration Team',
            keywords: ['wordpress', 'cms', 'blog', 'content'],
            tags: ['popular', 'cms'],
          }}
          isSelected={true}
        />
      </div>

      <div className="integration-workflow">
        <div className="step">
          <h3>Step 1: Select Action</h3>
          <ActionSelector
            actions={actions}
            selectedActionId={selectedAction}
            onSelect={handleActionSelect}
          />
        </div>

        {selectedAction && (
          <div className="step">
            <h3>Step 2: Configure Action</h3>
            <div className="action-config">
              {/* Action configuration form will be implemented in Phase 3 */}
              <p>Configuration form coming in Phase 3...</p>
            </div>
          </div>
        )}

        {selectedAction && (
          <div className="step">
            <h3>Step 3: Execute Action</h3>
            <button
              onClick={handleExecute}
              disabled={!selectedConnection}
              className="execute-btn"
            >
              Execute WordPress Action
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Deliverables

### **Code Deliverables**

- [ ] `@acme/integration-wordpress` package with full functionality
- [ ] WordPress REST API client implementation
- [ ] Create post action with dynamic fields
- [ ] Dynamic field actions (getCategories, getTags, getUsers)
- [ ] Connection types (basic auth, OAuth)
- [ ] Enhanced UI components for dynamic fields
- [ ] Connection manager component
- [ ] WordPress integration component for main app

### **Testing Deliverables**

- [ ] Unit tests for all WordPress actions
- [ ] Integration tests with test WordPress site
- [ ] UI component tests
- [ ] End-to-end workflow testing

### **Documentation Deliverables**

- [ ] WordPress integration README
- [ ] API documentation for WordPress actions
- [ ] Connection setup instructions
- [ ] Dynamic field usage examples

### **Quality Gates**

- [ ] `pnpm build` runs successfully with no errors
- [ ] All TypeScript compilation passes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] WordPress integration can be imported and used
- [ ] Dynamic fields work correctly
- [ ] Complete Make.com-like workflow is functional

---

## Success Metrics

### **Technical Metrics**

- ✅ **Build Success**: 100% successful builds across all packages
- ✅ **Type Safety**: Zero TypeScript compilation errors
- ✅ **Test Coverage**: >90% test coverage for WordPress integration
- ✅ **API Integration**: WordPress REST API calls work correctly

### **Functional Metrics**

- ✅ **Dynamic Fields**: Categories, tags, and users load correctly
- ✅ **Action Execution**: Create post action works end-to-end
- ✅ **Connection Management**: Authentication flows work properly
- ✅ **UI Experience**: Make.com-like workflow is intuitive

---

## Phase 2 Completion Checklist

- [ ] Create WordPress integration package structure
- [ ] Implement WordPress REST API client
- [ ] Create WordPress actions (createPost, getCategories, getTags, getUsers)
- [ ] Implement connection types (basic auth, OAuth)
- [ ] Add dynamic field support to UI components
- [ ] Create connection manager component
- [ ] Build WordPress integration component
- [ ] Write comprehensive unit tests
- [ ] Set up integration testing with test WordPress site
- [ ] Test complete workflow end-to-end
- [ ] Run `pnpm build` and fix all errors
- [ ] Verify WordPress integration works in main app
- [ ] Test dynamic field population
- [ ] Create documentation and examples

**Phase 2 is complete when all items above are checked, `pnpm build` runs successfully with no errors, and the complete WordPress integration workflow is functional.**
