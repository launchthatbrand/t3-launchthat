# Phase 1: Foundation - Scenario Builder

## Product Requirements Document (PRD)

### Version: 1.0

### Date: January 16, 2025

### Phase: 1 - Foundation

### Duration: Weeks 1-3

---

## Executive Summary

Phase 1 establishes the foundational infrastructure for the Scenario Builder project. This phase focuses on creating the core packages, setting up the build pipeline, and implementing the basic integration registry system. The goal is to have a working foundation that can support subsequent phases.

## Success Criteria

**Phase 1 is complete when:**

- ✅ `@acme/scenario-builder-core` package is created and functional
- ✅ `@acme/scenario-builder-ui` package is created and functional
- ✅ Package structure and build pipeline are working
- ✅ Basic integration registry and seeding system is implemented
- ✅ `pnpm build` runs successfully with no errors
- ✅ All packages can be imported and used in the main app

---

## Technical Requirements

### 1. Package Structure Setup

#### **Monorepo Package Organization**

```
packages/
├── scenario-builder-core/          # Core types, utilities, and execution engine
│   ├── package.json               # @acme/scenario-builder-core
│   ├── src/
│   │   ├── index.ts              # Main exports
│   │   ├── types/                # Core type definitions
│   │   ├── execution/            # Basic execution engine
│   │   ├── validation/           # Schema validation utilities
│   │   └── registry/             # Integration registry system
│   ├── tsconfig.json
│   ├── tests/
│   └── README.md
├── scenario-builder-ui/           # React components and UI utilities
│   ├── package.json               # @acme/scenario-builder-ui
│   ├── src/
│   │   ├── index.ts              # Component exports
│   │   ├── components/           # Basic UI components
│   │   ├── hooks/                # React hooks
│   │   └── stories/              # Storybook stories
│   ├── tsconfig.json
│   ├── tests/
│   └── README.md
```

#### **Package Dependencies**

```json
// packages/scenario-builder-core/package.json
{
  "name": "@acme/scenario-builder-core",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./types": "./src/types/index.ts",
    "./execution": "./src/execution/index.ts",
    "./validation": "./src/validation/index.ts",
    "./registry": "./src/registry/index.ts"
  },
  "dependencies": {
    "zod": "^3.22.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/uuid": "^9.0.0"
  }
}

// packages/scenario-builder-ui/package.json
{
  "name": "@acme/scenario-builder-ui",
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./components": "./src/components/index.ts",
    "./hooks": "./src/hooks/index.ts"
  },
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@acme/scenario-builder-core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "storybook": "^7.0.0"
  }
}
```

### 2. Core Package Implementation

#### **@acme/scenario-builder-core**

**Core Types (`src/types/index.ts`):**

```typescript
// Basic integration types
export interface IntegrationMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  icon: string;
  color: string;
  author: string;
  keywords: string[];
  tags: string[];
}

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  configSchema: {
    input: any;
    settings: any;
    output: any;
  };
  dynamicFields?: DynamicField[];
}

export interface DynamicField {
  fieldName: string;
  type: "select" | "multi-select" | "input";
  label: string;
  description: string;
  fetchOptions?: {
    action: string;
    dependsOn: string[];
    cacheTimeout: number;
    transform?: (data: any[]) => Array<{ label: string; value: string }>;
  };
}

export interface IntegrationManifest {
  metadata: IntegrationMetadata;
  actions: Record<string, ActionDefinition>;
  triggers: Record<string, ActionDefinition>;
  connections: Record<string, any>;
}

// Registry types
export interface IntegrationRegistry {
  [key: string]: IntegrationManifest;
}

export interface RegistryEntry {
  id: string;
  manifest: IntegrationManifest;
  isActive: boolean;
  lastUpdated: number;
}
```

**Integration Registry (`src/registry/index.ts`):**

```typescript
export class IntegrationRegistry {
  private integrations: Map<string, RegistryEntry> = new Map();

  register(id: string, manifest: IntegrationManifest): void {
    this.integrations.set(id, {
      id,
      manifest,
      isActive: true,
      lastUpdated: Date.now(),
    });
  }

  unregister(id: string): void {
    this.integrations.delete(id);
  }

  get(id: string): RegistryEntry | undefined {
    return this.integrations.get(id);
  }

  getAll(): RegistryEntry[] {
    return Array.from(this.integrations.values());
  }

  getActive(): RegistryEntry[] {
    return this.getAll().filter((entry) => entry.isActive);
  }

  update(id: string, manifest: IntegrationManifest): void {
    const existing = this.integrations.get(id);
    if (existing) {
      existing.manifest = manifest;
      existing.lastUpdated = Date.now();
    }
  }
}

export const globalRegistry = new IntegrationRegistry();
```

**Basic Execution Engine (`src/execution/index.ts`):**

```typescript
export interface ExecutionContext {
  executionId: string;
  scenarioId: string;
  nodeId: string;
  input: any;
  settings: any;
  connection: any;
}

export interface ExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  duration: number;
}

export class BasicExecutionEngine {
  async executeAction(
    action: ActionDefinition,
    context: ExecutionContext,
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    try {
      // Basic execution logic - will be enhanced in later phases
      const result = {
        success: true,
        output: { message: "Action executed successfully" },
        duration: Date.now() - startTime,
      };

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
      };
    }
  }
}
```

**Validation Utilities (`src/validation/index.ts`):**

```typescript
import { z } from "zod";

export function validateActionInput(
  action: ActionDefinition,
  input: any,
  settings: any,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  try {
    // Basic validation - will be enhanced in later phases
    if (!input || typeof input !== "object") {
      errors.push("Input must be an object");
    }

    if (!settings || typeof settings !== "object") {
      errors.push("Settings must be an object");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    errors.push(`Validation error: ${error}`);
    return { valid: false, errors };
  }
}

export function validateIntegrationManifest(manifest: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Basic manifest validation
  if (!manifest.metadata?.id) {
    errors.push("Manifest must have metadata.id");
  }

  if (!manifest.actions || Object.keys(manifest.actions).length === 0) {
    errors.push("Manifest must have at least one action");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

#### **@acme/scenario-builder-ui**

**Basic Components (`src/components/index.ts`):**

```typescript
export { IntegrationCard } from "./IntegrationCard";
export { ActionSelector } from "./ActionSelector";
export { DynamicField } from "./DynamicField";
export { ConnectionManager } from "./ConnectionManager";
```

**Integration Card Component (`src/components/IntegrationCard.tsx`):**

```typescript
import React from 'react';
import { IntegrationMetadata } from '@acme/scenario-builder-core';

interface IntegrationCardProps {
  integration: IntegrationMetadata;
  onSelect?: () => void;
  isSelected?: boolean;
}

export function IntegrationCard({
  integration,
  onSelect,
  isSelected
}: IntegrationCardProps) {
  return (
    <div
      className={`integration-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="integration-icon" style={{ color: integration.color }}>
        {integration.icon}
      </div>
      <div className="integration-info">
        <h3>{integration.name}</h3>
        <p>{integration.description}</p>
        <div className="integration-tags">
          {integration.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Action Selector Component (`src/components/ActionSelector.tsx`):**

```typescript
import React from 'react';
import { ActionDefinition } from '@acme/scenario-builder-core';

interface ActionSelectorProps {
  actions: ActionDefinition[];
  onSelect?: (action: ActionDefinition) => void;
  selectedActionId?: string;
}

export function ActionSelector({
  actions,
  onSelect,
  selectedActionId
}: ActionSelectorProps) {
  return (
    <div className="action-selector">
      <h3>Select Action</h3>
      <div className="action-list">
        {actions.map(action => (
          <div
            key={action.id}
            className={`action-item ${selectedActionId === action.id ? 'selected' : ''}`}
            onClick={() => onSelect?.(action)}
          >
            <h4>{action.name}</h4>
            <p>{action.description}</p>
            <span className="category">{action.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Dynamic Field Component (`src/components/DynamicField.tsx`):**

```typescript
import React from 'react';
import { DynamicField as DynamicFieldType } from '@acme/scenario-builder-core';

interface DynamicFieldProps {
  field: DynamicFieldType;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function DynamicField({
  field,
  value,
  onChange,
  disabled
}: DynamicFieldProps) {
  const handleChange = (newValue: any) => {
    if (!disabled) {
      onChange(newValue);
    }
  };

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
          {/* Options will be populated in later phases */}
        </select>
      )}

      {field.type === 'multi-select' && (
        <div className="multi-select">
          {/* Multi-select implementation will be added in later phases */}
          <p>Multi-select coming soon...</p>
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

### 3. Build Pipeline Setup

#### **Root Package.json Updates**

```json
{
  "scripts": {
    "build": "pnpm -r build",
    "build:core": "pnpm --filter @acme/scenario-builder-core build",
    "build:ui": "pnpm --filter @acme/scenario-builder-ui build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "type-check": "pnpm -r type-check"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### **TypeScript Configuration**

```json
// packages/scenario-builder-core/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}

// packages/scenario-builder-ui/tsconfig.json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

#### **Build Scripts**

```json
// packages/scenario-builder-core/package.json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest"
  }
}

// packages/scenario-builder-ui/package.json
{
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "storybook": "storybook dev -p 6007",
    "build-storybook": "storybook build"
  }
}
```

### 4. Basic Integration Registry

#### **Registry Implementation**

```typescript
// packages/scenario-builder-core/src/registry/integrationRegistry.ts
import { globalRegistry, IntegrationManifest } from "./index";

// Mock integrations for Phase 1 testing
export const mockIntegrations: Record<string, IntegrationManifest> = {
  "mock-system": {
    metadata: {
      id: "mock-system",
      name: "Mock System",
      description: "Mock integration for testing",
      version: "0.1.0",
      category: "system",
      icon: "⚙️",
      color: "#666666",
      author: "Development Team",
      keywords: ["mock", "test", "system"],
      tags: ["testing"],
    },
    actions: {
      "mock-action": {
        id: "mock-action",
        name: "Mock Action",
        description: "A mock action for testing",
        category: "system",
        configSchema: {
          input: {},
          settings: {},
          output: {},
        },
      },
    },
    triggers: {},
    connections: {},
  },
};

// Initialize registry with mock data
export function initializeMockRegistry(): void {
  Object.entries(mockIntegrations).forEach(([id, manifest]) => {
    globalRegistry.register(id, manifest);
  });
}
```

#### **Registry Exports**

```typescript
// Initialize mock registry for Phase 1
import { initializeMockRegistry } from "./registry/integrationRegistry";

// packages/scenario-builder-core/src/index.ts
export * from "./types";
export * from "./execution";
export * from "./validation";
export * from "./registry";

initializeMockRegistry();
```

### 5. Testing & Validation

#### **Unit Tests**

```typescript
// packages/scenario-builder-core/tests/registry.test.ts
import { beforeEach, describe, expect, it } from "vitest";

import { globalRegistry, IntegrationRegistry } from "../src/registry";

describe("IntegrationRegistry", () => {
  beforeEach(() => {
    // Clear registry before each test
    globalRegistry["integrations"].clear();
  });

  it("should register an integration", () => {
    const mockManifest = {
      metadata: {
        id: "test",
        name: "Test Integration",
        description: "Test",
        version: "1.0.0",
        category: "test",
        icon: "🧪",
        color: "#000000",
        author: "Test",
        keywords: [],
        tags: [],
      },
      actions: {},
      triggers: {},
      connections: {},
    };

    globalRegistry.register("test", mockManifest);
    const result = globalRegistry.get("test");

    expect(result).toBeDefined();
    expect(result?.id).toBe("test");
    expect(result?.manifest).toEqual(mockManifest);
  });

  it("should return all active integrations", () => {
    // Add test integrations
    const testManifest = {
      /* ... */
    };
    globalRegistry.register("test1", testManifest);
    globalRegistry.register("test2", testManifest);

    const active = globalRegistry.getActive();
    expect(active).toHaveLength(2);
  });
});
```

#### **Integration Tests**

```typescript
// packages/scenario-builder-core/tests/integration.test.ts
import { describe, expect, it } from "vitest";

import { ActionDefinition, BasicExecutionEngine } from "../src/execution";

describe("BasicExecutionEngine", () => {
  it("should execute a mock action successfully", async () => {
    const engine = new BasicExecutionEngine();
    const mockAction: ActionDefinition = {
      id: "test",
      name: "Test Action",
      description: "Test",
      category: "test",
      configSchema: { input: {}, settings: {}, output: {} },
    };

    const context = {
      executionId: "exec-1",
      scenarioId: "scenario-1",
      nodeId: "node-1",
      input: {},
      settings: {},
      connection: {},
    };

    const result = await engine.executeAction(mockAction, context);

    expect(result.success).toBe(true);
    expect(result.duration).toBeGreaterThan(0);
  });
});
```

### 6. Main App Integration

#### **Import and Use Core Packages**

```typescript
// apps/scenariobuilder/src/lib/scenario-builder.ts
import {
  ActionDefinition,
  globalRegistry,
  IntegrationManifest,
} from "@acme/scenario-builder-core";

export function getAvailableIntegrations(): IntegrationManifest[] {
  return globalRegistry.getAll().map((entry) => entry.manifest);
}

export function getIntegrationActions(
  integrationId: string,
): ActionDefinition[] {
  const entry = globalRegistry.get(integrationId);
  if (!entry) return [];

  return Object.values(entry.manifest.actions);
}

export function getIntegrationTriggers(
  integrationId: string,
): ActionDefinition[] {
  const entry = globalRegistry.get(integrationId);
  if (!entry) return [];

  return Object.values(entry.manifest.triggers);
}
```

#### **UI Component Usage**

```typescript
// apps/scenariobuilder/src/components/IntegrationSelector.tsx
import React from 'react';
import {
  IntegrationCard,
  ActionSelector
} from '@acme/scenario-builder-ui';
import { getAvailableIntegrations, getIntegrationActions } from '../lib/scenario-builder';

export function IntegrationSelector() {
  const integrations = getAvailableIntegrations();
  const [selectedIntegration, setSelectedIntegration] = React.useState<string | null>(null);
  const [selectedAction, setSelectedAction] = React.useState<string | null>(null);

  const actions = selectedIntegration
    ? getIntegrationActions(selectedIntegration)
    : [];

  return (
    <div className="integration-selector">
      <h2>Select Integration</h2>

      <div className="integrations-grid">
        {integrations.map(integration => (
          <IntegrationCard
            key={integration.metadata.id}
            integration={integration.metadata}
            isSelected={selectedIntegration === integration.metadata.id}
            onSelect={() => setSelectedIntegration(integration.metadata.id)}
          />
        ))}
      </div>

      {selectedIntegration && (
        <ActionSelector
          actions={actions}
          selectedActionId={selectedAction}
          onSelect={(action) => setSelectedAction(action.id)}
        />
      )}
    </div>
  );
}
```

---

## Deliverables

### **Code Deliverables**

- [ ] `@acme/scenario-builder-core` package with basic functionality
- [ ] `@acme/scenario-builder-ui` package with basic components
- [ ] Working build pipeline for all packages
- [ ] Basic integration registry system
- [ ] Mock integration for testing
- [ ] Unit tests for core functionality

### **Documentation Deliverables**

- [ ] README files for each package
- [ ] API documentation for core types and functions
- [ ] Basic usage examples
- [ ] Build and development instructions

### **Quality Gates**

- [ ] `pnpm build` runs successfully with no errors
- [ ] All TypeScript compilation passes
- [ ] Unit tests pass
- [ ] Packages can be imported and used in main app
- [ ] Basic integration registry functionality works
- [ ] UI components render without errors

---

## Success Metrics

### **Technical Metrics**

- ✅ **Build Success**: 100% successful builds across all packages
- ✅ **Type Safety**: Zero TypeScript compilation errors
- ✅ **Test Coverage**: >80% test coverage for core functionality
- ✅ **Import Success**: All packages can be imported without errors

### **Development Metrics**

- ✅ **Package Independence**: Each package builds and tests independently
- ✅ **Hot Reloading**: Development mode works with file watching
- ✅ **Storybook**: UI components can be viewed in isolation
- ✅ **Documentation**: Clear usage examples and API docs

---

## Phase 1 Completion Checklist

- [ ] Create package directories and structure
- [ ] Implement core types and interfaces
- [ ] Build basic integration registry
- [ ] Create UI components (IntegrationCard, ActionSelector, DynamicField)
- [ ] Set up TypeScript configurations
- [ ] Configure build scripts and package.json files
- [ ] Write unit tests for core functionality
- [ ] Test package imports in main app
- [ ] Run `pnpm build` and fix all errors
- [ ] Verify all packages build independently
- [ ] Test hot reloading in development mode
- [ ] Create basic documentation and README files

**Phase 1 is complete when all items above are checked and `pnpm build` runs successfully with no errors.**
